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

const GROUP_ID = '69be71e9-6273-4972-a051-1c413ac705a5';
const ORG_ID = '4545be6b-ed21-428c-911d-8915588b3270';

async function main() {
    console.log('--- FORCING INTELLIGENCE FLOW ---');

    // 1. Fetch messages without batch
    const { data: messages } = await supabase
        .from('messages')
        .select('id, message_ts')
        .eq('group_id', GROUP_ID)
        .is('batch_id', null)
        .order('message_ts', { ascending: true });

    if (!messages || messages.length === 0) {
        console.log('No messages found without batch_id.');
        return;
    }

    console.log(`Found ${messages.length} messages.`);

    // 2. Create Batch
    console.log('2. Creating message batch...');
    const { data: batch, error: bErr } = await supabase
        .from('message_batches')
        .insert({
            organization_id: ORG_ID,
            group_id: GROUP_ID,
            start_ts: messages[0].message_ts,
            end_ts: messages[messages.length - 1].message_ts,
            message_count: messages.length,
            status: 'pending'
        })
        .select()
        .single();

    if (bErr || !batch) {
        console.error('Error creating batch:', bErr);
        return;
    }
    console.log(`✅ Batch created: ${batch.id}`);

    // 3. Update messages
    await supabase
        .from('messages')
        .update({ batch_id: batch.id })
        .in('id', messages.map(m => m.id));

    // 4. Trigger API
    console.log('3. Triggering process-batch API...');
    try {
        const res = await fetch('http://localhost:3000/api/intelligence/process-batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                batch_id: batch.id,
                simulate: true
            })
        });
        const text = await res.text();
        try {
            const result = JSON.parse(text);
            console.log('API Result:', JSON.stringify(result, null, 2));
        } catch (e) {
            console.error('Failed to parse JSON. Response text:', text);
        }
    } catch (err) {
        console.error('API call failed:', err);
    }
}

main();
