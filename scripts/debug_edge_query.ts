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

async function debugQuery() {
    const remoteJid = "120363403431018999@g.us";
    console.log(`🔍 Querying group with JID: '${remoteJid}'`);

    const { data: groupData, error } = await supabase
        .from('groups')
        .select('id, is_active, name, instance_id')
        .eq('jid', remoteJid)
        .maybeSingle();

    if (error) {
        console.error('❌ Query Error:', error);
    } else {
        console.log('✅ Query Result:', groupData);
        if (!groupData) {
            console.log("⚠️ Group NOT FOUND (returned null)");
        }
    }
}

debugQuery();
