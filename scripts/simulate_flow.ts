
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
    console.log('--- STARTING WABA SIMULATION ---');

    // 1. Insert Mock Messages
    console.log('1. Inserting mock messages...');
    await supabase.from('messages').insert([
        {
            group_id: GROUP_ID,
            organization_id: ORG_ID,
            author_hash: 'SimUser_1',
            content_text: '🚨 ALERTA GERAL: Vazamento de dados detectado. CPFs expostos.',
            message_ts: new Date().toISOString(),
            created_at: new Date().toISOString()
        },
        {
            group_id: GROUP_ID,
            organization_id: ORG_ID,
            author_hash: 'SimUser_2',
            content_text: 'Estou recebendo ameaças de processo.',
            message_ts: new Date().toISOString(),
            created_at: new Date().toISOString()
        }
    ]);
    console.log('✅ Messages inserted.');

    // 1b. Create Pending Batch
    console.log('1b. Creating pending batch...');
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
    console.log('✅ Batch created:', batch.id);

    // 2. Trigger Batch Processing (Simulate Mode)
    console.log('2. Triggering API (simulate: true)...');

    // We can't easily fetch localhost from this script context if running inside environment without port knowledge
    // But we can invoke the handler logic directly or just use fetch if the server is running.
    // Assuming server is running on http://localhost:3000 based on previous context.

    try {
        const response = await fetch('http://localhost:3000/api/intelligence/process-batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                batch_id: batch.id, // Use real batch ID
                simulate: true
            })
        });

        const data = await response.json();
        console.log('✅ API Response:', JSON.stringify(data, null, 2));

        if (!response.ok) {
            console.error('❌ API Failed:', data);
            return;
        }

    } catch (e) {
        console.error('❌ Failed to call API. Is the dev server running?', e);
        return;
    }

    // 3. Verify Delivery Queue for WABA Items
    console.log('3. Verifying Delivery Queue (WABA)...');

    // Allow a moment for async processing
    await new Promise(r => setTimeout(r, 2000));

    const { data: queue, error } = await supabase
        .from('delivery_queue')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('❌ DB Error:', error);
    } else {
        console.log(`✅ Found ${queue?.length} recent queue items.`);
        queue?.forEach(item => {
            console.log(`- [${item.status}] Type: ${item.type} | WABA Template: ${item.payload?.template?.name || 'Text Fallback'}`);
        });
    }
}

main();
