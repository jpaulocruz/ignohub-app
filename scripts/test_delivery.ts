import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Load .env manually
const envPath = path.resolve(process.cwd(), '.env');
const envConfig = fs.readFileSync(envPath, 'utf8');
envConfig.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) process.env[key.trim()] = value.trim();
});

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function testDelivery() {
    console.log("🚀 Testing Delivery System for jpaulodg@gmail.com...");

    const userId = 'b83caf99-799d-4110-ac1d-e97703275a64';

    // 1. Ensure user settings are correct for testing
    await s.from('user_settings').upsert({
        user_id: userId,
        email_summary_enabled: true,
        whatsapp_summary_enabled: true,
        notification_email: 'jpaulodg@gmail.com',
        notification_whatsapp: '557591357078', // Using the number provided in settings or bot number for testing
        auto_generate_enabled: true
    });

    // 2. Find a group for this user
    const { data: orgUser } = await s.from('organization_users').select('organization_id').eq('user_id', userId).limit(1).single();
    if (!orgUser) return console.error("No organization found for testing user.");

    const { data: group } = await s.from('groups').select('id, name').eq('organization_id', orgUser.organization_id).limit(1).single();
    if (!group) return console.error("No group found for testing organization.");

    console.log(`Using Group: ${group.name} (${group.id})`);

    // 3. Reset all messages for this group to have no batch_id to ensure a new batch is created
    await s.from('messages').update({ batch_id: null }).eq('group_id', group.id);

    // 4. Insert critical messages to trigger alerts
    const criticalMessages = [
        {
            group_id: group.id,
            author_hash: 'threat-actor-99',
            content_text: 'Vou abrir um processo contra essa empresa amanha mesmo! Nao aguento mais esse descaso.',
            message_ts: new Date().toISOString()
        },
        {
            group_id: group.id,
            author_hash: 'worried-user-1',
            content_text: 'Cuidado pessoal, acabei de ver que os dados de acesso vazaram no Pastebin!',
            message_ts: new Date().toISOString()
        }
    ];

    await s.from('messages').insert(criticalMessages);
    console.log("Inserted critical messages to trigger Sentinel/Observer agents.");

    // 5. Trigger generate-summary function (which now handles batches)
    console.log("Triggering intelligence flow...");
    const { data: triggerResult, error: triggerError } = await s.functions.invoke('generate-summary', {
        body: { groupId: group.id, hoursBack: 1 }
    });

    if (triggerError) {
        console.error("Trigger Failed:", triggerError);
    } else {
        console.log("Trigger Success:", triggerResult);
        console.log("\n✅ The system has created a batch and triggered the intelligence API.");

        console.log("Waiting for delivery_queue items (10s max)...");
        let found = false;
        for (let i = 0; i < 5; i++) {
            await new Promise(r => setTimeout(r, 2000));
            const { data: queueItems } = await s.from('delivery_queue')
                .select('*')
                .eq('status', 'pending')
                .ilike('payload->>to', 'jpaulodg@gmail.com');

            if (queueItems && queueItems.length > 0) {
                console.log(`\n✅ FOUND ${queueItems.length} items in delivery_queue!`);
                queueItems.forEach(item => {
                    console.log(`- [${item.type}] ${item.payload.subject || 'WhatsApp Message'}`);
                });
                found = true;
                break;
            }
            process.stdout.write(".");
        }

        if (!found) {
            console.error("\n❌ No items found in delivery_queue after 10s. Check logs.");
        }
    }
}

testDelivery();
