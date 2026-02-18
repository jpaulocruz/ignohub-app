
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
    env['NEXT_PUBLIC_SUPABASE_URL'] || env['SUPABASE_URL'],
    env['SUPABASE_SERVICE_ROLE_KEY']
);

const ORG_ID = '4545be6b-ed21-428c-911d-8915588b3270';
const GROUP_ID = '69be71e9-6273-4972-a051-1c413ac705a5';

async function main() {
    console.log('--- CREATING TEST BATCH ---');

    const { data: batch, error: batchError } = await supabase
        .from('message_batches')
        .insert({
            organization_id: ORG_ID,
            group_id: GROUP_ID,
            status: 'pending',
            start_ts: new Date(Date.now() - 3600000).toISOString(),
            end_ts: new Date().toISOString()
        })
        .select()
        .single();

    if (batchError || !batch) {
        console.error('❌ Failed to create batch:', batchError);
        return;
    }
    console.log('BATCH_ID=' + batch.id);
}

main();
