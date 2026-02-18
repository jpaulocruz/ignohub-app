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

async function simulateMessage() {
    // 1. Get Token from DB
    const { data: setting } = await supabase.from('system_settings').select('value').eq('key', 'WEBHOOK_AUTH_TOKEN').single();

    if (!setting) {
        console.error("❌ Token not found in DB");
        return;
    }

    const token = setting.value;
    // Use the user's project URL based on .env or hardcoded if necessary for testing
    // In this environment, SUPABASE_URL is usually capable of calling functions if they are deployed.
    // However, direct function checks are usually `https://<ref>.supabase.co/functions/v1/...`
    // We can infer ref from SUPABASE_URL

    const projectRef = SUPABASE_URL.split('https://')[1].split('.')[0];
    const url = `https://${projectRef}.supabase.co/functions/v1/whatsapp-webhook?token=${token}`;

    console.log(`📡 Simulating Webhook to: ${url}`);

    const payload = {
        event: "messages.upsert",
        instance: "ignohub-teste-04",
        data: {
            key: {
                remoteJid: "120363403431018999@g.us", // REAL GROUP JID
                fromMe: false,
                id: "TEST_MSG_ID_" + Date.now()
            },
            pushName: "Test User Simulation",
            message: { conversation: "Hello World testing storage " + Date.now() },
            messageType: "conversation",
            messageTimestamp: Math.floor(Date.now() / 1000)
        }
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        console.log(`Response Status: ${response.status}`);
        const text = await response.text();
        console.log(`Response Body: ${text}`);

        if (response.ok) {
            console.log("✅ Webhook accepted successfully.");
        } else {
            console.error("❌ Webhook rejected.");
        }

    } catch (e) {
        console.error("❌ Error sending webhook:", e);
    }
}

simulateMessage();
