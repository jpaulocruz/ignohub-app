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

async function getConfig() {
    const { data } = await supabase.from('admin_evolution_config').select('*').single();
    if (!data) {
        console.error('❌ No configuration found in admin_evolution_config table.');
        process.exit(1);
    }
    return {
        url: data.instance_url?.replace(/\/$/, ""),
        key: data.api_key
    };
}

async function fetchJson(url: string, apiKey: string) {
    const res = await fetch(url, {
        headers: { apikey: apiKey }
    });
    if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    return res.json();
}

async function debugEvolution() {
    const config = await getConfig();
    const API_URL = config.url;
    const API_KEY = config.key;

    if (!API_URL || !API_KEY) {
        console.error('❌ Invalid config in DB');
        process.exit(1);
    }

    console.log(`🔍 Diagnosing Evolution API at: ${API_URL}`);

    try {
        // 1. Fetch Instances
        console.log('\n--- 1. Fetching Instances ---');
        const instances = await fetchJson(`${API_URL}/instance/fetchInstances`, API_KEY);

        if (!Array.isArray(instances) || instances.length === 0) {
            console.warn('⚠️ No instances found in Evolution API.');
            return;
        }

        console.log(`✅ Found ${instances.length} instances.`);

        for (const item of instances) {
            console.log('   👉 Item:', JSON.stringify(item));
            const name = item.instance?.instanceName || item.name || 'UNKNOWN';
            const status = item.instance?.status || item.connectionStatus || 'UNKNOWN';
            const owner = item.instance?.owner || item.ownerJid || 'N/A';
            console.log(`\n👉 Instance: [${name}] | Status: ${status} | Owner: ${owner}`);

            if (name === 'UNKNOWN') continue;

            // 2. Check Webhook Config
            try {
                const webhook = await fetchJson(`${API_URL}/webhook/find/${name}`, API_KEY);

                console.log(`   📡 Webhook Config:`);
                if (webhook.enabled || webhook.webhook_by_events) {
                    console.log(`      - URL: ${webhook.url}`);
                    console.log(`      - Enabled: ${webhook.enabled}`);
                    console.log(`      - By Events: ${webhook.webhook_by_events}`);
                    console.log(`      - Events: ${webhook.events?.join(', ') || 'NONE'}`);

                    // Check for critical events
                    const required = ['GROUPS_UPSERT', 'GROUP_UPDATE', 'MESSAGES_UPSERT'];
                    // Note: API might return different casing or structure, ensuring robustness
                    const missing = required.filter(e => !webhook.events?.includes(e));
                    if (missing.length > 0) {
                        console.error(`      ❌ MISSING EVENTS: ${missing.join(', ')}`);
                    } else {
                        console.log(`      ✅ All required events subscribed.`);
                    }
                } else {
                    console.error(`      ❌ WEBHOOK DISABLED OR NOT CONFIGURED.`);
                }

            } catch (error) {
                console.error(`      ❌ Failed to fetch webhook config: ${error.message}`);
            }

            // 3. Check Settings (Ignore Groups?)
            try {
                const settings = await fetchJson(`${API_URL}/settings/find/${name}`, API_KEY);
                console.log(`   ⚙️  Settings:`);
                console.log(`      - Reject Call: ${settings.rejectCall}`);
                console.log(`      - Ignore Groups: ${settings.groupsIgnore}`);
                console.log(`      - Always Online: ${settings.alwaysOnline}`);

                if (settings.groupsIgnore) {
                    console.error(`      ❌ FATAL: groupsIgnore is TRUE. This prevents group data!`);
                }
            } catch (error) {
                console.error(`      ❌ Failed to fetch settings: ${error.message}`);
            }
        }

    } catch (error) {
        console.error('❌ Fatal Error accessing Evolution API:', error.message);
    }
}

debugEvolution();
