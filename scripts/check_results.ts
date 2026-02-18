
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

async function checkResults() {
    const batchId = '5c228a7d-4657-412e-9073-71c741eb1631';
    console.log(`Checking results for batch: ${batchId}`);

    const { data: queueItems, error } = await supabase
        .from('delivery_queue')
        .select('type, status, payload')
        .eq('batch_id', batchId);

    if (error) {
        console.error('Error fetching queue:', error);
        return;
    }

    console.log(`Found ${queueItems?.length} items in delivery_queue.`);

    const emailItems = queueItems?.filter(i => i.type === 'email') || [];
    const waItems = queueItems?.filter(i => i.type === 'whatsapp') || [];

    console.log(`Email Items: ${emailItems.length}`);
    console.log(`WhatsApp Items: ${waItems.length}`);

    if (queueItems?.length === 10 && emailItems.length === 5 && waItems.length === 5) {
        console.log('✅ SUCCESS: All 10 items queued (5 Email, 5 WhatsApp).');
    } else {
        console.error('❌ FAILURE: Incorrect item count.');
        // logging details
        console.log('Email Types:', emailItems.map(i => i.payload.emailType));
        console.log('WA payloads:', waItems.map(i => i.payload.template?.name || 'text'));
    }
}

checkResults();
