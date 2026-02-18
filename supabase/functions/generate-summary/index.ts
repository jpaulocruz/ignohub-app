// Version: 3.0 - Unified Intelligence (Agno-Ready)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const NEXT_PUBLIC_SUPABASE_URL = Deno.env.get('NEXT_PUBLIC_SUPABASE_URL') || SUPABASE_URL;

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        const reqBody = await req.json();
        const { groupId, organizationId, hoursBack = 24 } = reqBody;

        console.log(`[GENERATE-SUMMARY] Starting work for: orgId=${organizationId}, groupId=${groupId}`);

        // 1. Resolve target groups
        let groupsQuery = supabase.from('groups').select('id, name, organization_id').eq('is_active', true);
        if (groupId) {
            groupsQuery = groupsQuery.eq('id', groupId);
        } else if (organizationId) {
            groupsQuery = groupsQuery.eq('organization_id', organizationId);
        } else {
            return new Response(JSON.stringify({ error: 'No context provided' }), { status: 400, headers: corsHeaders });
        }

        const { data: groups, error: groupsError } = await groupsQuery;
        if (groupsError || !groups || groups.length === 0) {
            return new Response(JSON.stringify({ message: 'No groups to process' }), { headers: corsHeaders });
        }

        const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();
        const results = [];

        for (const group of groups) {
            // 2. Fetch pending messages for this group
            const { data: messages, error: msgError } = await supabase
                .from('messages')
                .select('id, author_hash, content_text, message_ts')
                .eq('group_id', group.id)
                .gte('message_ts', cutoffTime)
                .is('batch_id', null)
                .order('message_ts', { ascending: true });

            if (msgError || !messages || messages.length === 0) {
                console.log(`[GENERATE-SUMMARY] Group ${group.name}: No new messages found.`);
                results.push({ group: group.name, skipped: true, reason: 'no_new_messages' });
                continue;
            }

            // 3. Create a Message Batch
            const { data: batch, error: batchError } = await supabase
                .from('message_batches')
                .insert({
                    organization_id: group.organization_id,
                    group_id: group.id,
                    start_ts: messages[0].message_ts,
                    end_ts: messages[messages.length - 1].message_ts,
                    message_count: messages.length,
                    status: 'pending'
                })
                .select()
                .single();

            if (batchError || !batch) {
                console.error(`[GENERATE-SUMMARY] Failed to create batch for ${group.name}:`, batchError);
                continue;
            }

            // 4. Update messages with batch_id
            await supabase
                .from('messages')
                .update({ batch_id: batch.id })
                .in('id', messages.map(m => m.id));

            console.log(`[GENERATE-SUMMARY] Created pending batch ${batch.id} for ${group.name} with ${messages.length} messages.`);

            // 5. Trigger Next.js Intelligence API (non-blocking if possible, but Deno fetch awaits)
            // Note: We use the SUPABASE_URL (which often points to the project) 
            // but the Intelligence Route is in the Next.js app.
            // In Railway, internal URLs are better, but for simplicity we use the public URL or a configured one.
            const { data: appUrlSetting } = await supabase.from('system_settings').select('value').eq('key', 'APP_URL').maybeSingle();
            const appUrl = appUrlSetting?.value || 'http://localhost:3000'; // Default to localhost for dev

            try {
                // We don't necessarily need to wait for the 5+ second AI processing here 
                // if we just want to put it in the queue. 
                // But triggering the API ensures processing starts.
                fetch(`${appUrl}/api/intelligence/process-batch`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ batch_id: batch.id })
                }).then(res => res.text()).then(text => console.log(`[GENERATE-SUMMARY] API Processing Triggered: ${text}`)).catch(e => console.error(`[GENERATE-SUMMARY] API Trigger failed:`, e));
            } catch (triggerError) {
                console.error(`[GENERATE-SUMMARY] Failed to trigger Intelligence API:`, triggerError);
            }

            results.push({ group: group.name, batch_id: batch.id, message_count: messages.length });
        }

        return new Response(JSON.stringify({ success: true, processed: results }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('generate-summary error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: corsHeaders
        });
    }
});
