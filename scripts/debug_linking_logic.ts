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

async function debugLogic() {
    const code = "onb_1771196764473_v1q4di";
    const instanceName = "ignohub-teste-04";
    const remoteJid = "1234567890@g.us";

    console.log(`🔍 Debugging logic for Code: ${code} | Instance: ${instanceName}`);

    // 1. Check Pending Group
    const { data: pendingGroup, error: groupError } = await supabase
        .from('groups')
        .select('id, external_id, jid')
        .eq('external_id', code)
        .is('jid', null)
        .maybeSingle();

    if (groupError) console.error('❌ Group Query Error:', groupError);

    if (!pendingGroup) {
        console.error('❌ Pending Group NOT FOUND or JID is not null.');
        // Verify what exists
        const { data: check } = await supabase.from('groups').select('*').eq('external_id', code).single();
        console.log('   Existing Group Data:', check);
        return;
    }
    console.log('✅ Pending Group Found:', pendingGroup);

    // 2. Check Instance
    const { data: currentInstance, error: instError } = await supabase
        .from('admin_collection_instances')
        .select('id, instance_name')
        .eq('instance_name', instanceName)
        .maybeSingle();

    if (instError) console.error('❌ Instance Query Error:', instError);

    if (!currentInstance) {
        console.error('❌ Instance NOT FOUND in admin_collection_instances.');
        return;
    }
    console.log('✅ Instance Found:', currentInstance);

    // 3. Update Group
    console.log('🔄 Attempting Update...');
    const { data: updated, error: updateError } = await supabase
        .from('groups')
        .update({
            jid: remoteJid,
            collection_instance_id: currentInstance.id,
            is_active: true,
            updated_at: new Date().toISOString()
        })
        .eq('id', pendingGroup.id)
        .select();

    if (updateError) {
        console.error('❌ Update Error:', updateError);
    } else {
        console.log('✅ Update Success:', updated);
    }
}

debugLogic();
