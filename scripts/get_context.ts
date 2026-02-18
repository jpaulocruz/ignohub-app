import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Manual env parsing
const envPath = path.join(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.join('=').trim();
    }
});

const supabase = createClient(
    env['SUPABASE_URL'],
    env['SUPABASE_SERVICE_ROLE_KEY']
);

async function main() {
    const { data: orgs } = await supabase.from('organizations').select('id, name').limit(1);
    const { data: groups } = await supabase.from('groups').select('id, name, organization_id').eq('is_active', true).limit(1);

    console.log('Context Found:');
    console.log('Organizations:', JSON.stringify(orgs, null, 2));
    console.log('Groups:', JSON.stringify(groups, null, 2));
}

main();
