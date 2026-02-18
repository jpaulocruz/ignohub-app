import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Load .env manually
const envPath = path.resolve(process.cwd(), '.env');
const envConfig = fs.readFileSync(envPath, 'utf8');
envConfig.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        process.env[key.trim()] = value.trim();
    }
});

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const GROUP_ID = '69be71e9-6273-4972-a051-1c413ac705a5';
const ORG_ID = '4545be6b-ed21-428c-911d-8915588b3270';

async function triggerTest() {
    console.log(`Starting Agno Test for Group ${GROUP_ID}...`);

    // 1. Get messages for this group (force reset batch_id for testing if none found)
    let { data: messages } = await supabase
        .from('messages')
        .select('*')
        .eq('group_id', GROUP_ID)
        .is('batch_id', null)
        .order('message_ts', { ascending: true });

    if (!messages || messages.length === 0) {
        console.log("No messages without batch_id. Forcing reset for testing...");
        await supabase.from('messages').update({ batch_id: null }).eq('group_id', GROUP_ID);
        const { data: refetched } = await supabase
            .from('messages')
            .select('*')
            .eq('group_id', GROUP_ID)
            .order('message_ts', { ascending: true });
        messages = refetched;
    }

    if (!messages || messages.length === 0) {
        console.error("Error: No messages found at all.");
        return;
    }

    // 2. Create a pending batch
    const { data: batch, error: batchError } = await supabase
        .from('message_batches')
        .insert({
            organization_id: ORG_ID,
            group_id: GROUP_ID,
            status: 'pending',
            message_count: messages?.length || 0,
            start_ts: messages?.[0]?.message_ts || new Date().toISOString(),
            end_ts: messages?.[messages.length - 1]?.message_ts || new Date().toISOString()
        })
        .select()
        .single();

    if (batchError || !batch) {
        console.error("Error creating batch:", batchError);
        return;
    }

    console.log(`Created pending batch: ${batch.id}`);

    // updates messages to link them to the new batch
    if (messages && messages.length > 0) {
        const msgIds = messages.map(m => m.id);
        const { error: updateError } = await supabase
            .from('messages')
            .update({ batch_id: batch.id })
            .in('id', msgIds);

        if (updateError) {
            console.error("Error linking messages to batch:", updateError);
            return;
        }
        console.log(`Linked ${msgIds.length} messages to batch.`);
    }

    // 3. Trigger the API route via local fetch (since we are in the same environment)
    // Actually, hitting the external URL is more reliable for testing the full cycle.
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    console.log(`Triggering processing via: ${baseUrl}/api/intelligence/process-batch`);

    try {
        const response = await fetch(`${baseUrl}/api/intelligence/process-batch`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();
        console.log("API Response:", result);
    } catch (err) {
        console.error("Failed to call API route:", err);
    }
}

triggerTest();
