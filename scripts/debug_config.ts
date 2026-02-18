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

async function checkConfig() {
    console.log('🔍 Checking admin_evolution_config table...');
    const { data, error } = await supabase.from('admin_evolution_config').select('*');

    if (error) {
        console.error('❌ Supabase Error:', error);
        return;
    }

    if (!data || data.length === 0) {
        console.warn('⚠️ Table is empty.');
    } else {
        console.log('✅ Config found:', JSON.stringify(data, null, 2));
    }
}

checkConfig();
