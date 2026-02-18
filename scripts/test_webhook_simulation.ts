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
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function simulateWebhook() {
    // 1. Get Token from DB
    const { data: setting } = await supabase.from('system_settings').select('value').eq('key', 'WEBHOOK_AUTH_TOKEN').single();
    if (!setting) {
        console.error('❌ WEBHOOK_AUTH_TOKEN not found in DB');
        return;
    }
    const token = setting.value;
    const url = `${SUPABASE_URL}/functions/v1/whatsapp-webhook?token=${token}`;

    console.log(`📡 Simulating Webhook to: ${url}`);

    // 2. Prepare Payload
    const payload = {
        event: "MESSAGES_UPSERT",
        instance: "ignohub-teste-04",
        data: {
            key: {
                remoteJid: "1234567890@g.us",
                fromMe: false,
                id: "TEST_MSG_ID_" + Date.now()
            },
            pushName: "Test User",
            message: {
                conversation: "onb_1771196764473_v1q4di" // The user's code
            },
            messageType: "conversation",
            messageTimestamp: Math.floor(Date.now() / 1000)
        }
    };

    // 3. Send Request
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const text = await res.text();
        console.log(`Response Status: ${res.status}`);
        console.log(`Response Body: ${text}`);

        if (res.ok) {
            console.log('✅ Webhook accepted successfully.');
        } else {
            console.error('❌ Webhook rejected.');
        }

    } catch (e) {
        console.error('❌ Fetch error:', e);
    }
}

simulateWebhook();
