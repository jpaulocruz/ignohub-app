import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load env vars
const envPath = path.resolve(process.cwd(), '.env');
const envConfig = fs.readFileSync(envPath, 'utf-8');
envConfig.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        process.env[key.trim()] = value.trim();
    }
});

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const WEBHOOK_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/whatsapp-webhook`;

async function getConfig() {
    const { data } = await supabase.from('admin_evolution_config').select('*').single();
    if (!data) {
        throw new Error('No configuration found in admin_evolution_config table.');
    }
    return {
        url: data.instance_url?.replace(/\/$/, ""),
        key: data.api_key // Correct column
    };
}

async function getOrGenerateToken() {
    const { data } = await supabase.from('system_settings').select('value').eq('key', 'WEBHOOK_AUTH_TOKEN').maybeSingle();

    if (data?.value) {
        return data.value;
    }

    console.log('⚠️ WEBHOOK_AUTH_TOKEN not found. Generating new one...');
    const newToken = `wh_${Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)}`;

    const { error } = await supabase.from('system_settings').insert({
        key: 'WEBHOOK_AUTH_TOKEN',
        value: newToken,
        description: 'Token for verifying Evolution API webhook requests'
    });

    if (error) {
        throw new Error(`Failed to save new token: ${error.message}`);
    }

    console.log('✅ Generated and saved new WEBHOOK_AUTH_TOKEN.');
    return newToken;
}

async function fetchJson(url: string, apiKey: string, options: any = {}) {
    const res = await fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            apikey: apiKey,
            'Content-Type': 'application/json'
        }
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${res.statusText} - ${text}`);
    }
    return res.json();
}

async function fixWebhook() {
    try {
        const config = await getConfig();
        const API_URL = config.url;
        const API_KEY = config.key;

        console.log(`🔧 Evolution API: ${API_URL}`);

        const token = await getOrGenerateToken();
        const fullWebhookUrl = `${WEBHOOK_FUNCTION_URL}?token=${token}`;
        console.log(`🔗 Target Webhook URL: ${fullWebhookUrl}`);

        // 1. Fetch Instances
        const instances = await fetchJson(`${API_URL}/instance/fetchInstances`, API_KEY);
        if (!Array.isArray(instances)) throw new Error('Invalid instances response');

        console.log(`Found ${instances.length} instances to configure.`);

        for (const item of instances) {
            const name = item.instance?.instanceName || item.name;
            if (!name) continue;

            console.log(`\n👉 Configuring Instance: ${name}...`);

            // 2. Set Webhook
            // /webhook/set/:instance
            const payload = {
                "webhook": {
                    url: fullWebhookUrl,
                    webhook_by_events: true,
                    webhook_base64: false,
                    events: [
                        "GROUPS_UPSERT",
                        "GROUP_UPDATE",
                        "MESSAGES_UPSERT",
                        "CONNECTION_UPDATE"
                    ],
                    enabled: true
                }
            };

            await fetchJson(`${API_URL}/webhook/set/${name}`, API_KEY, {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            console.log(`   ✅ Webhook updated successfully.`);

            // 3. Ensure groupsIgnore is FALSE
            await fetchJson(`${API_URL}/settings/set/${name}`, API_KEY, {
                method: 'POST',
                body: JSON.stringify({ groupsIgnore: false })
            });
            console.log(`   ✅ Settings updated (groupsIgnore: false).`);
        }

        console.log('\n🎉 All instances configured!');

    } catch (e) {
        console.error('❌ Error fixing webhook:', e);
    }
}

fixWebhook();
