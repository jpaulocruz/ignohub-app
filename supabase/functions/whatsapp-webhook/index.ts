
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-token',
};

// --- TYPES ---
interface EvolutionPayload {
    event?: string;
    instance?: string;
    data?: any;
}

interface MessageData {
    key?: {
        remoteJid?: string;
        fromMe?: boolean;
        id?: string;
    };
    pushName?: string;
    message?: any;
    messageType?: string;
    messageTimestamp?: number;
}

interface GroupData {
    id: string; // JID
    subject: string;
}

interface WebhookAuthResult {
    valid: boolean;
    reason: string;
}

// --- HELPERS ---

// Validate webhook authentication token
function validateWebhookToken(req: Request, expectedToken: string): WebhookAuthResult {
    if (!expectedToken) {
        console.error('[WEBHOOK-AUTH] No expected token provided to validator');
        return { valid: false, reason: 'TOKEN_NOT_CONFIGURED' };
    }

    const trimmedExpected = expectedToken.trim();

    // 1. Query Param
    const url = new URL(req.url);
    const queryToken = url.searchParams.get('token')?.trim();

    if (queryToken) {
        const isExact = queryToken === trimmedExpected;
        const isPrefix = queryToken.startsWith(trimmedExpected + '/');
        if (isExact || isPrefix) return { valid: true, reason: 'QUERY_PARAM' };
    }

    // 2. Authorization Header
    const authHeader = req.headers.get('authorization')?.trim();
    if (authHeader) {
        const [scheme, token] = authHeader.split(' ');
        if (scheme?.toLowerCase() === 'bearer' && token?.trim() === trimmedExpected) {
            return { valid: true, reason: 'BEARER_TOKEN' };
        }
    }

    // 3. X-Webhook-Token Header
    const webhookToken = req.headers.get('x-webhook-token')?.trim();
    if (webhookToken === trimmedExpected) {
        return { valid: true, reason: 'X_WEBHOOK_TOKEN' };
    }

    return { valid: false, reason: 'INVALID_TOKEN' };
}

// Extract message content safely
function extractMessageContent(data: MessageData): string {
    const msgType = data.messageType || '';
    if (!data.message) return '';

    if (msgType === 'conversation') return data.message.conversation || '';
    if (msgType === 'extendedTextMessage') return data.message.extendedTextMessage?.text || '';
    if (msgType === 'imageMessage') return data.message.imageMessage?.caption || '';
    if (msgType === 'videoMessage') return data.message.videoMessage?.caption || '';

    return '';
}

// --- HANDLERS ---

// --- CACHE HELPER ---
const globalCache = new Map<string, { val: any, exp: number }>();

function getCache<T>(key: string): T | null {
    const item = globalCache.get(key);
    if (!item) return null;
    if (Date.now() > item.exp) {
        globalCache.delete(key);
        return null;
    }
    return item.val;
}

function setCache(key: string, val: any, ttlSec: number) {
    globalCache.set(key, { val, exp: Date.now() + ttlSec * 1000 });
}

// --- HANDLERS ---

async function handleConnectionUpdate(supabase: SupabaseClient, instance: string, data: any) {
    const state = data.state;
    // Map Evolution API states to our status
    const status = state === 'open' ? 'connected' :
        state === 'connecting' ? 'connecting' : 'disconnected';

    const { data: instanceData } = await supabase
        .from('admin_collection_instances')
        .select('id')
        .eq('instance_name', instance)
        .maybeSingle();

    if (instanceData) {
        await supabase
            .from('admin_collection_instances')
            .update({
                status,
                qr_code_base64: status === 'connected' ? null : undefined,
                updated_at: new Date().toISOString()
            })
            .eq('id', instanceData.id);

        if (status === 'disconnected') {
            await supabase.from('notifications').insert({
                title: 'WhatsApp Desconectado',
                message: `A instância "${instance}" foi desconectada. Verifique o status no painel de Assets.`,
                type: 'error',
                scope: 'super_admin',
                metadata: { instance_name: instance }
            });
        }

        console.log(`Instance ${instance} status updated to ${status}`);
    }
}

async function handleGroupUpsert(supabase: SupabaseClient, instance: string, data: any) {
    const groups: GroupData[] = Array.isArray(data) ? data : [data];
    if (groups.length === 0) return;

    // Verify instance exists in our DB (Fetch ONCE)
    let instanceData = getCache<{ id: string }>(`instance:${instance}`);
    if (!instanceData) {
        const { data } = await supabase
            .from('admin_collection_instances')
            .select('id')
            .eq('instance_name', instance)
            .maybeSingle();
        if (data) {
            instanceData = data;
            setCache(`instance:${instance}`, data, 300); // 5 min cache
        }
    }

    if (!instanceData) {
        console.log(`Instance ${instance} not found. Skipping group upsert.`);
        return;
    }

    // Optimization: we could fetch all existing groups in one query if list is small, 
    // but for now, let's just loop efficiently.
    for (const group of groups) {
        if (!group || !group.id || !group.subject) continue;

        console.log(`Upserting group: ${group.subject} (${group.id})`);

        // Check active monitoring
        let existingGroup = getCache<{ id: string }>(`group_lookup:${group.id}`);
        if (!existingGroup) {
            const { data } = await supabase
                .from('groups')
                .select('id')
                .eq('jid', group.id)
                .maybeSingle();
            existingGroup = data;
            if (data) setCache(`group_lookup:${group.id}`, data, 60);
        }

        if (existingGroup) {
            // Check if name changed? Optional.
            await supabase
                .from('groups')
                .update({
                    name: group.subject,
                    last_message_at: new Date().toISOString()
                })
                .eq('id', existingGroup.id);
        } else {
            // Group not monitored/linked yet. 
            // We do NOT auto-create here to avoid clutter. 
            console.log(`Group ${group.id} not tracked. Waiting for link.`);
        }
    }
}

async function handleMessageUpsert(supabase: SupabaseClient, instance: string, data: MessageData) {
    const remoteJid = data.key?.remoteJid;
    const fromMe = data.key?.fromMe;

    // Filter noise
    if (!remoteJid || remoteJid === 'status@broadcast' || fromMe) return;
    if (!remoteJid.endsWith('@g.us')) return; // Groups only

    // Extract content ONCE
    const messageContent = extractMessageContent(data);
    if (!messageContent) return; // Ignore empty/unsupported messages

    // 1. LINKING LOGIC
    const codeMatch = messageContent.match(/(onb_[a-z0-9_]+|SB-[A-Z0-9]{4})/i);

    if (codeMatch && codeMatch[1]) {
        // Linking logic usually happens once, so no need to cache aggressively here.
        // We keep the original logic for linking as it is critical and rare.
        const verificationCode = codeMatch[1].toUpperCase();
        console.log(`[LINK] Detected code: ${verificationCode} in ${remoteJid}`);

        const { data: pendingGroup } = await supabase
            .from('groups')
            .select('id')
            .eq('external_id', verificationCode)
            .is('jid', null)
            .maybeSingle();

        if (pendingGroup) {
            const { data: currentInstance } = await supabase
                .from('admin_collection_instances')
                .select('id')
                .eq('instance_name', instance)
                .maybeSingle();

            if (currentInstance) {
                console.log(`[LINK] Linking Group ${pendingGroup.id} -> ${remoteJid}`);

                const { data: groupAfterUpdate, error: updateError } = await supabase.from('groups').update({
                    jid: remoteJid,
                    collection_instance_id: currentInstance.id,
                    is_active: true,
                    updated_at: new Date().toISOString()
                }).eq('id', pendingGroup.id).select('organization_id, name').single();

                if (!updateError && groupAfterUpdate) {
                    // Sync agent status
                    await supabase
                        .from('group_agents')
                        .update({
                            status: 'active',
                            updated_at: new Date().toISOString()
                        })
                        .eq('group_id', pendingGroup.id);

                    // Invalidate keys
                    globalCache.delete(`group:${remoteJid}`);

                    await supabase.from('notifications').insert({
                        title: 'Grupo Conectado',
                        message: `O grupo "${groupAfterUpdate.name}" foi vinculado com sucesso.`,
                        type: 'success',
                        scope: 'organization',
                        organization_id: groupAfterUpdate.organization_id,
                        metadata: { group_id: pendingGroup.id }
                    });
                }
            }
        }
    }

    // 2. ACTIVE GROUP CHECK (Cached)
    let groupData = getCache<{ id: string, is_active: boolean, name: string, organization_id: string }>(`group:${remoteJid}`);

    if (!groupData) {
        const { data } = await supabase
            .from('groups')
            .select('id, is_active, name, organization_id')
            .eq('jid', remoteJid)
            .maybeSingle();
        if (data) {
            groupData = data;
            setCache(`group:${remoteJid}`, data, 60); // 1 min cache for active groups
        }
    }

    if (!groupData || !groupData.is_active) return;

    // 4. INSERT MESSAGE
    const senderName = data.pushName || 'Desconhecido';
    const actualSenderJid = data.key?.participant || data.key?.remoteJid || 'unknown';
    const msgType = data.messageType || 'text';

    const insertPayload = {
        group_id: groupData.id,
        organization_id: groupData.organization_id,
        author_hash: actualSenderJid,
        content_text: messageContent,
        message_ts: data.messageTimestamp
            ? new Date(data.messageTimestamp > 100000000000 ? data.messageTimestamp : data.messageTimestamp * 1000).toISOString()
            : new Date().toISOString(),
        created_at: new Date().toISOString(),
        platform_message_id: data.key?.id || null,
        pre_flags: {
            sender_name: senderName,
            message_type: msgType,
            topic: 'general'
        }
    };

    const { error: insertError } = await supabase
        .from('messages')
        .insert(insertPayload);

    if (insertError) {
        console.error(`Insert error: ${insertError.message}`);
        return;
    }

    // Update group timestamp (Fire and forget, or optimize to not update on every single message if frequent?)
    // We can assume Supabase handles this quick update fast.
    await supabase.from('groups')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', groupData.id);

    console.log(`Msg saved: ${senderName} @ ${groupData.name}`);

    // 5. KEYWORD MONITORING (Async/Fire-and-forget)
    // We need user_id for this. Cache it.
    let userId = getCache<string>(`instance_user:${instance}`);
    if (!userId) {
        const { data: legacyInstance } = await supabase
            .from('instances')
            .select('user_id')
            .eq('name', instance)
            .maybeSingle();
        if (legacyInstance?.user_id) {
            userId = legacyInstance.user_id;
            setCache(`instance_user:${instance}`, userId, 300);
        }
    }

    if (userId) {
        await checkKeywords(supabase, userId, messageContent, groupData, senderName, actualSenderJid);
    }
}

async function checkKeywords(supabase: SupabaseClient, userId: string, content: string, groupData: any, senderName: string, senderJid: string) {
    try {
        let monitors = getCache<any[]>(`monitors:${userId}`);
        if (!monitors) {
            const { data } = await supabase
                .from('keyword_monitors')
                .select('*')
                .eq('user_id', userId)
                .eq('is_active', true);
            monitors = data || [];
            setCache(`monitors:${userId}`, monitors, 60);
        }

        if (!monitors || monitors.length === 0) return;

        const lowerContent = content.toLowerCase();

        for (const monitor of monitors) {
            if (lowerContent.includes(monitor.keyword.toLowerCase())) {
                console.log(`[KEYWORD] Match: "${monitor.keyword}" (User ${userId})`);

                // Log match
                // We'll skip the 'messages' select for message_id if strictness isn't required, 
                // but purely finding the just-inserted message ID is tricky without returning it from insert.
                // We'll try to find it.
                const { data: msg } = await supabase
                    .from('messages')
                    .select('id')
                    .eq('group_id', groupData.id)
                    .eq('author_hash', senderJid) // Use consistent field
                    .order('created_at', { ascending: false }) // Use created_at
                    .limit(1)
                    .maybeSingle();

                await supabase.rpc('log_keyword_match', {
                    p_monitor_id: monitor.id,
                    p_message_id: msg?.id || null
                });

                // Notifications ...
                notifyUser(supabase, userId, monitor.keyword, groupData.name, senderName, content);
            }
        }
    } catch (e) {
        console.error('[KEYWORD] Error:', e);
    }
}

async function notifyUser(supabase: SupabaseClient, userId: string, keyword: string, groupName: string, senderName: string, content: string) {
    // Determine notification settings
    const { data: userSettings } = await supabase
        .from('user_settings')
        .select('notification_email, sms_alerts_enabled, my_phone_number')
        .eq('user_id', userId)
        .maybeSingle();

    const { data: prof } = await supabase.from('profiles').select('email').eq('user_id', userId).maybeSingle();

    const email = userSettings?.notification_email || prof?.email;
    const phone = userSettings?.my_phone_number;
    const sms = userSettings?.sms_alerts_enabled;

    if (email) {
        await supabase.functions.invoke('send-email', {
            body: {
                to: email,
                subject: `🚨 Alerta: ${keyword}`,
                htmlContent: `<p>Termo <b>"${keyword}"</b> detectado.</p><p><b>Grupo:</b> ${groupName}</p><p><b>De:</b> ${senderName}</p><blockquote>${content}</blockquote>`,
                emailType: 'keyword_alert',
                userId: userId
            }
        }).catch(e => console.error('Email fail:', e));
    }
}


// --- MAIN ENTRYPOINT ---

async function processPayload(payload: EvolutionPayload) {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        console.error('Missing Supabase env vars');
        return;
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
        }
    });
    const { event, instance, data } = payload;

    if (!data) return;

    if (event === 'CONNECTION_UPDATE' || event === 'connection.update') {
        await handleConnectionUpdate(supabase, instance || '', data);
    }
    else if (event === 'GROUPS_UPSERT' || event === 'groups.upsert' || event === 'GROUP_UPDATE') {
        await handleGroupUpsert(supabase, instance || '', data);
    }
    else if (event === 'MESSAGES_UPSERT' || event === 'messages.upsert') {
        await handleMessageUpsert(supabase, instance || '', data);
    }
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

    // Auth
    const envToken = Deno.env.get('WEBHOOK_AUTH_TOKEN');

    // Fetch from cache first
    let dbToken = getCache<string>('webhook_token');

    if (!dbToken) {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );
        const { data: s } = await supabase.from('system_settings').select('value').eq('key', 'WEBHOOK_AUTH_TOKEN').maybeSingle();
        dbToken = s?.value || '';
        if (dbToken) setCache('webhook_token', dbToken, 300); // 5 min
    }

    const { valid, reason } = validateWebhookToken(req, envToken || '');
    const { valid: validDb, reason: reasonDb } = validateWebhookToken(req, dbToken || '');

    if (!valid && !validDb) {
        return new Response(JSON.stringify({ error: 'Unauthorized', reason: reason || reasonDb }), { status: 401, headers: corsHeaders });
    }

    try {
        const payload = await req.json() as EvolutionPayload;

        // LOGGING (Fire and forget or minimal)
        // We'll keep it but maybe we can sample it if high volume? 
        // For now keep as is.
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );
        // Async log
        // EdgeRuntime.waitUntil(supabase.from('webhook_logs').insert(...)); 
        // But doing it properly:

        if (payload) {
            // Non-blocking log
            supabase.from('webhook_logs').insert({
                event: payload.event,
                instance: payload.instance,
                payload: payload
            }).then(({ error }: { error: any }) => { if (error) console.error('Log error', error) });
        }

        // @ts-ignore
        EdgeRuntime.waitUntil(processPayload(payload));
        return new Response(JSON.stringify({ status: 'processed' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } catch (e) {
        return new Response(JSON.stringify({ error: 'Bad Request' }), { status: 400, headers: corsHeaders });
    }
});

