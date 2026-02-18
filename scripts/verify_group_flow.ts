import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load env vars manually since we don't have dotenv
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
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function runTest() {
    console.log('🚀 Starting "Group Integration & Editing" Verification...');

    const testExternalId = 'onb_test_' + Math.floor(Math.random() * 10000);
    const testJid = '120363000000000000@g.us'; // Dummy JID
    let groupId: string | null = null;
    let orgId: string | null = null;
    let instanceId: string | null = null;

    try {
        // 0. Get an Organization ID (any)
        const { data: orgs } = await supabase.from('organizations').select('id').limit(1);
        if (!orgs || orgs.length === 0) throw new Error('No organizations found to test with.');
        orgId = orgs[0].id;

        // 0. Get a Collection Instance ID (any, for linking)
        const { data: instances } = await supabase.from('admin_collection_instances').select('id').limit(1);
        if (instances && instances.length > 0) {
            instanceId = instances[0].id;
        } else {
            console.warn('⚠️ No admin_collection_instances found. verification might simulate without valid instance ID.');
        }

        // 1. Simulate Register Group (Onboarding)
        console.log(`\n1. Simulating Onboarding (Register Group)...`);
        console.log(`   Creating group with external_id: ${testExternalId}`);

        const { data: group, error: createError } = await supabase
            .from('groups')
            .insert({
                organization_id: orgId,
                name: 'Test Group Pending',
                description: 'Initial Description',
                platform: 'whatsapp',
                external_id: testExternalId,
                is_active: false,
                jid: null,
                collection_instance_id: null
            })
            .select()
            .single();

        if (createError) throw new Error(`Create Failed: ${createError.message}`);
        groupId = group.id;
        console.log(`✅ Group created successfully. ID: ${groupId}`);
        console.log(`   State: is_active=${group.is_active}, jid=${group.jid}`);

        // 2. Simulate Webhook Linking Logic
        console.log(`\n2. Simulating Webhook Linking Logic...`);
        // Logic from whatsapp-webhook/index.ts (Refactored)
        const { data: pendingGroup } = await supabase
            .from('groups')
            .select('id, organization_id')
            .eq('external_id', testExternalId)
            .is('jid', null)
            .maybeSingle();

        if (!pendingGroup) throw new Error('Webhook logic failed to find pending group.');

        console.log(`   Found pending group. Linking to JID: ${testJid} and Instance: ${instanceId}`);

        const { error: linkError } = await supabase
            .from('groups')
            .update({
                jid: testJid,
                collection_instance_id: instanceId, // Using correct column
                is_active: true,
                updated_at: new Date().toISOString()
            })
            .eq('id', pendingGroup.id);

        if (linkError) throw new Error(`Link Failed: ${linkError.message}`);
        console.log(`✅ Webhook logic executed successfully.`);

        // Verify Upgrade
        const { data: linkedGroup } = await supabase.from('groups').select('*').eq('id', groupId).single();
        if (linkedGroup.jid !== testJid || !linkedGroup.is_active) {
            throw new Error(`Verification Failed: Group not linked/activated correctly. JID=${linkedGroup.jid}, Active=${linkedGroup.is_active}`);
        }
        if (instanceId && linkedGroup.collection_instance_id !== instanceId) {
            throw new Error(`Verification Failed: Instance ID not set correctly. Expected=${instanceId}, Actual=${linkedGroup.collection_instance_id}`);
        }
        console.log(`   Verified: Group is now ACTIVE and LINKED.`);

        // 3. Simulate Dashboard Edit (Update Group Action)
        console.log(`\n3. Simulating Dashboard Edit (Name & Description)...`);
        const newName = 'Test Group Updated';
        const newDesc = 'Updated Description Works';

        const { error: updateError } = await supabase
            .from('groups')
            .update({
                name: newName,
                description: newDesc
            })
            .eq('id', groupId);

        if (updateError) throw new Error(`Update Failed: ${updateError.message}`);

        // Verify Update
        const { data: updatedGroup } = await supabase.from('groups').select('*').eq('id', groupId).single();
        if (updatedGroup.name !== newName || updatedGroup.description !== newDesc) {
            throw new Error(`Verification Failed: Name/Desc not updated. Name=${updatedGroup.name}, Desc=${updatedGroup.description}`);
        }
        console.log(`✅ Group updated successfully.`);
        console.log(`   Name: ${updatedGroup.name}`);
        console.log(`   Description: ${updatedGroup.description}`);

        console.log(`\n✅ ALL TESTS PASSED SUCCESSFULLY!`);

    } catch (err: any) {
        console.error(`\n❌ TEST FAILED: ${err.message}`);
    } finally {
        if (groupId) {
            console.log(`\n4. Cleanup: Deleting test group...`);
            await supabase.from('groups').delete().eq('id', groupId);
            console.log(`   Cleanup done.`);
        }
    }
}

runTest();
