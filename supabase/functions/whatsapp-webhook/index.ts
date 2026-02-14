// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-token',
};

interface EvolutionPayload {
    event?: string;
    instance?: string;
    data?: any;
}

// Validate webhook authentication token
function validateWebhookToken(req: Request, expectedToken: string): { valid: boolean; reason: string } {
    // If no token is provided, reject
    if (!expectedToken) {
        console.error('[WEBHOOK-AUTH] No expected token provided to validator');
        return { valid: false, reason: 'TOKEN_NOT_CONFIGURED' };
    }

    const trimmedExpected = expectedToken.trim();

    // Check query parameter (common in Evolution API)
    const url = new URL(req.url);
    const queryToken = url.searchParams.get('token')?.trim();

    if (queryToken) {
        const isExact = queryToken === trimmedExpected;
        const isPrefix = queryToken.startsWith(trimmedExpected + '/');

        if (isExact || isPrefix) {
            return { valid: true, reason: 'QUERY_PARAM' };
        }
    }

    // Check Authorization header (Bearer token)
    const authHeader = req.headers.get('authorization')?.trim();
    if (authHeader) {
        const [scheme, token] = authHeader.split(' ');
        if (scheme?.toLowerCase() === 'bearer' && token?.trim() === trimmedExpected) {
            return { valid: true, reason: 'BEARER_TOKEN' };
        }
    }

    // Check X-Webhook-Token header
    const webhookToken = req.headers.get('x-webhook-token')?.trim();
    if (webhookToken === trimmedExpected) {
        return { valid: true, reason: 'X_WEBHOOK_TOKEN' };
    }

    return { valid: false, reason: 'INVALID_TOKEN' };
}

// Background task to process the payload (não bloqueia a Evolution)
async function processPayload(payload: EvolutionPayload) {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const { event, instance, data } = payload;

    // Validação básica
    if (!data) {
        console.error('Invalid payload: missing data');
        return;
    }

    // Handle connection updates
    if (event === 'CONNECTION_UPDATE' || event === 'connection.update') {
        const state = data.state;
        const status = state === 'open' ? 'connected' :
            state === 'connecting' ? 'connecting' : 'disconnected';

        const { data: instanceData } = await supabase
            .from('instances')
            .select('id')
            .eq('name', instance)
            .maybeSingle();

        if (instanceData) {
            await supabase
                .from('instances')
                .update({
                    status,
                    qr_code: status === 'connected' ? null : undefined,
                    updated_at: new Date().toISOString()
                })
                .eq('id', instanceData.id);

            console.log(`Instance ${instance} status updated to ${status}`);
        }
        return;
    }

    // Handle group updates (create or update)
    if (event === 'GROUPS_UPSERT' || event === 'groups.upsert' || event === 'GROUP_UPDATE' || event === 'group.update') {
        console.log(`Processing group event: ${event}`);

        // data can be a single object or an array of groups
        const groups = Array.isArray(data) ? data : [data];

        for (const group of groups) {
            if (!group || !group.id || !group.subject) continue;

            const { data: instanceData } = await supabase
                .from('instances')
                .select('id')
                .eq('name', instance)
                .maybeSingle();

            if (!instanceData) {
                console.log(`Instance ${instance} not found for group update`);
                continue;
            }

            console.log(`Upserting group: ${group.subject} (${group.id})`);

            const { error } = await supabase
                .from('groups')
                .upsert({
                    instance_id: instanceData.id,
                    jid: group.id,
                    name: group.subject,
                }, { onConflict: 'jid' });

            if (error) {
                console.error('Error upserting group:', error);
            }
        }
        return;
    }

    // Handle new messages
    if (event === 'MESSAGES_UPSERT' || event === 'messages.upsert') {
        const remoteJid = data.key?.remoteJid;
        const fromMe = data.key?.fromMe;

        // Skip status messages and own messages
        if (!remoteJid || remoteJid === 'status@broadcast' || fromMe) {
            return;
        }

        // Only process group messages
        if (!remoteJid.endsWith('@g.us')) {
            return;
        }

        // Initialize Evolution API env vars with fallback from system_settings if needed
        let EV_URL = Deno.env.get('EVOLUTION_API_URL');
        let EV_KEY = Deno.env.get('EVOLUTION_API_KEY');

        if (!EV_URL || !EV_KEY) {
            const { data: setts } = await supabase.from('system_settings').select('key, value');
            if (setts) {
                EV_URL = EV_URL || setts.find(s => s.key === 'EVOLUTION_API_URL')?.value;
                EV_KEY = EV_KEY || setts.find(s => s.key === 'EVOLUTION_API_KEY')?.value;
            }
        }

        // Check if group is monitored
        let { data: groupData, error: groupError } = await supabase
            .from('groups')
            .select('id, is_active, name')
            .eq('jid', remoteJid)
            .maybeSingle();

        if (groupError) {
            console.error(`Group fetch error: ${groupError.message}`);
            return;
        }

        // --- SMART AUTO-ACTIVATION ---
        // If group doesn't exist OR is inactive, try to activate if space available
        if (!groupData || !groupData.is_active) {
            console.log(`Group ${remoteJid} (${groupData?.name || 'New'}) is ${groupData ? 'inactive' : 'missing'}. Checking quota...`);

            // Get instance and plan info
            const { data: instanceData } = await supabase
                .from('instances')
                .select('id, user_id, profiles(plan_id, plans(max_groups))')
                .eq('name', instance)
                .maybeSingle();

            if (instanceData) {
                const plan = instanceData.profiles?.plans;
                const { count: activeCount } = await supabase
                    .from('groups')
                    .select('*', { count: 'exact', head: true })
                    .eq('instance_id', instanceData.id)
                    .eq('is_active', true);

                const canActivate = plan?.max_groups === -1 || (activeCount || 0) < (plan?.max_groups || 0);

                if (canActivate) {
                    console.log(`Quota available (${activeCount}/${plan?.max_groups}). Activating group ${remoteJid}.`);
                    const { data: updatedGroup, error: upsertError } = await supabase
                        .from('groups')
                        .upsert({
                            instance_id: instanceData.id,
                            jid: remoteJid,
                            name: groupData?.name || 'Novo Grupo (Auto-ativado)',
                            is_active: true,
                            last_message_at: new Date().toISOString()
                        }, { onConflict: 'jid' })
                        .select('id, is_active')
                        .single();

                    if (!upsertError) {
                        groupData = updatedGroup;
                    } else {
                        console.error('Failed to auto-activate group:', upsertError);
                    }
                } else {
                    console.log(`Quota full (${activeCount}/${plan?.max_groups}). Cannot auto-activate ${remoteJid}.`);
                }
            }
        }

        if (!groupData || !groupData.is_active) {
            console.log(`Group ${remoteJid} remains inactive. Ignoring message.`);
            return;
        }

        // Extract content
        let messageContent = '';
        const msgType = data.messageType || '';

        if (msgType === 'conversation' && data.message?.conversation) {
            messageContent = data.message.conversation;
        } else if (msgType === 'extendedTextMessage' && data.message?.extendedTextMessage?.text) {
            messageContent = data.message.extendedTextMessage.text;
        } else if (msgType === 'imageMessage' && data.message?.imageMessage?.caption) {
            messageContent = data.message.imageMessage.caption;
        } else if (msgType === 'videoMessage' && data.message?.videoMessage?.caption) {
            messageContent = data.message.videoMessage.caption;
        }

        // Ignore short messages
        if (!messageContent || messageContent.length < 2) {
            return;
        }

        // --- QUOTA ENFORCEMENT ---
        // Start by getting instance and user plan info
        const { data: instanceData } = await supabase
            .from('instances')
            .select('id, user_id')
            .eq('name', instance)
            .maybeSingle();

        if (!instanceData) return;

        // Get user plan and profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('plan_id')
            .eq('user_id', instanceData.user_id)
            .maybeSingle();

        if (!profile) return;

        const { data: plan } = await supabase
            .from('plans')
            .select('max_messages_per_day, max_groups')
            .eq('id', profile.plan_id)
            .maybeSingle();

        if (!plan) return;

        // Check message quota (max_messages_per_day = -1 means unlimited)
        if (plan.max_messages_per_day !== -1) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Get IDs of all groups belonging to this user's instance
            const { data: userGroups } = await supabase
                .from('groups')
                .select('id')
                .eq('instance_id', instanceData.id);

            if (userGroups && userGroups.length > 0) {
                const groupIds = userGroups.map(g => g.id);

                const { count } = await supabase
                    .from('messages')
                    .select('*', { count: 'exact', head: true })
                    .in('group_id', groupIds)
                    .gte('received_at', today.toISOString());

                if (count !== null && count >= plan.max_messages_per_day) {
                    console.log(`User ${instanceData.user_id} reached message limit: ${count}/${plan.max_messages_per_day}`);
                    // Option: notify user via email/notification in the future
                    return;
                }
            }
        }
        // --- END QUOTA ENFORCEMENT ---

        const senderName = data.pushName || 'Desconhecido';
        const senderJid = data.key?.id || 'unknown';

        // Insert message
        const { error: insertError } = await supabase
            .from('messages')
            .insert({
                group_id: groupData.id,
                sender_jid: senderJid,
                sender_name: senderName,
                content: messageContent,
                message_type: msgType || 'text',
                topic: 'general', // Campo obrigatório no banco
                extension: 'txt', // Campo obrigatório no banco
                received_at: data.messageTimestamp
                    ? new Date(data.messageTimestamp * 1000).toISOString()
                    : new Date().toISOString(),
                inserted_at: new Date().toISOString(), // Campo obrigatório no banco
                updated_at: new Date().toISOString(), // Campo obrigatório no banco
            });

        if (insertError) {
            console.error(`Insert error: ${insertError.message}`);
            return;
        }

        // Update last_message_at
        await supabase
            .from('groups')
            .update({ last_message_at: new Date().toISOString() })
            .eq('id', groupData.id);

        console.log(`Mensagem salva de ${senderName} em ${remoteJid}`);

        // --- KEYWORD MONITORING ---
        try {
            // 1. Fetch active monitors for this user
            const { data: monitors } = await supabase
                .from('keyword_monitors')
                .select('*')
                .eq('user_id', instanceData.user_id)
                .eq('is_active', true);

            if (monitors && monitors.length > 0) {
                const lowerContent = messageContent.toLowerCase();

                for (const monitor of monitors) {
                    const keyword = monitor.keyword.toLowerCase();

                    if (lowerContent.includes(keyword)) {
                        console.log(`[KEYWORD MATCH] Term "${monitor.keyword}" found for user ${instanceData.user_id}`);

                        // 2. Log the match
                        await supabase.rpc('log_keyword_match', {
                            p_monitor_id: monitor.id,
                            p_message_id: (await supabase.from('messages').select('id').eq('group_id', groupData.id).eq('sender_jid', senderJid).order('created_at', { ascending: false }).limit(1).single()).data?.id
                        });

                        const groupName = groupData.name || 'Grupo';
                        const alertText = `🚨 *Alerta de Termo*\n\n` +
                            `📌 *Termo:* ${monitor.keyword}\n` +
                            `👥 *Grupo:* ${groupName}\n` +
                            `👤 *De:* ${senderName}\n\n` +
                            `📝 *Mensagem:* ${messageContent}`;

                        // Fetch user settings for notifications
                        const { data: userSettings } = await supabase
                            .from('user_settings')
                            .select('notification_email, sms_alerts_enabled, my_phone_number')
                            .eq('user_id', instanceData.user_id)
                            .maybeSingle(); // Changed to maybeSingle as per original email fetch

                        const { data: prof } = await supabase.from('profiles').select('email').eq('user_id', instanceData.user_id).maybeSingle(); // Changed to maybeSingle

                        const destEmail = userSettings?.notification_email || prof?.email;
                        const sendSms = userSettings?.sms_alerts_enabled || false;
                        const phoneNumber = userSettings?.my_phone_number;

                        // Notification: Email
                        if (destEmail) {
                            console.log(`Sending alert email to ${destEmail}`);
                            await supabase.functions.invoke('send-email', {
                                body: {
                                    to: destEmail,
                                    subject: `🚨 Alerta: ${monitor.keyword}`,
                                    htmlContent: `<p>Termo <b>"${monitor.keyword}"</b> detectado.</p><p><b>Grupo:</b> ${groupName}</p><p><b>De:</b> ${senderName}</p><blockquote>${messageContent}</blockquote>`,
                                    emailType: 'keyword_alert',
                                    userId: instanceData.user_id
                                }
                            }).catch(e => console.error('Email Alert fail', e));
                        }

                        // Notification: SMS
                        if (sendSms && phoneNumber) {
                            console.log(`Sending alert SMS to ${phoneNumber}`);
                            await supabase.functions.invoke('send-sms', {
                                body: {
                                    to: phoneNumber,
                                    content: `[ZapDigest] Alerta: "${monitor.keyword}" mencionado por ${senderName} no grupo ${groupName}.`,
                                    userId: instanceData.user_id
                                }
                            }).catch(e => console.error('SMS Alert fail', e));
                        }
                    }
                }
            }
        } catch (err) {
            console.error('[KEYWORD-ERR]', err);
        }
    }
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    // Validate webhook authentication
    let expectedToken = Deno.env.get('WEBHOOK_AUTH_TOKEN');

    if (!expectedToken) {
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
        const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!);
        const { data: settings } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', 'WEBHOOK_AUTH_TOKEN')
            .maybeSingle();
        expectedToken = settings?.value;
    }

    const authResult = validateWebhookToken(req, expectedToken || '');

    if (!authResult.valid) {
        console.error(`[WEBHOOK] Unauthorized - Reason: ${authResult.reason}`);
        return new Response(
            JSON.stringify({ error: 'Unauthorized' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    console.log(`[WEBHOOK] Authenticated via: ${authResult.reason}`);

    try {
        const payload = await req.json() as EvolutionPayload;
        console.log('Webhook received (authenticated):', JSON.stringify(payload).slice(0, 300));

        // Usa EdgeRuntime.waitUntil para processar em background
        // Equivalente ao BackgroundTasks do FastAPI
        // @ts-ignore - EdgeRuntime is available in Supabase Edge Functions
        EdgeRuntime.waitUntil(processPayload(payload));

        // Retorna imediatamente para não travar a Evolution
        return new Response(
            JSON.stringify({ status: 'processed' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error) {
        console.error('Webhook error:', error);
        return new Response(
            JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
