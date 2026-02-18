
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env manually
const envPath = path.resolve(process.cwd(), '.env');
let envConfig: Record<string, string> = {};

try {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim().replace(/^['"](.*)['"]$/, '$1');
            envConfig[key] = value;
        }
    });
} catch (e) {
    console.error('Error reading .env file:', e);
}

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPresets() {
    console.log('--- Checking Agent Presets ---');
    const { data: presets, error } = await supabase
        .from('agent_presets')
        .select('*');

    if (error) {
        console.error('Error fetching presets:', error);
        return;
    }

    console.log(`Found ${presets.length} presets.`);
    presets.forEach(p => {
        console.log(`- Name: ${p.name}`);
        console.log(`  Bot Link: ${p.bot_link}`);
        console.log(`  Is Active: ${p.is_active}`);
        console.log(`  Telegram: ${p.telegram_bot_username}`);
        console.log('---');
    });
}

checkPresets();
