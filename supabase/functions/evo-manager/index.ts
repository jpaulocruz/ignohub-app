// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// --- Configuration ---
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- Interfaces ---
interface RequestBody {
    action: string;
    instanceName?: string;
    instanceId?: string;
    to?: string;
    message?: string;
    [key: string]: any;
}

interface ServiceResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    status: number;
}

// --- Services ---

class EvolutionService {
    constructor(
        private baseUrl: string,
        private apiKey: string
    ) {
        this.baseUrl = baseUrl.replace(/\/$/, '');
    }

    async callApi(endpoint: string, method: string, body?: any, timeoutMs: number = 15000): Promise<any> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        const finalUrl = `${this.baseUrl}${endpoint}`;

        console.log(`[EvolutionService] Calling: ${method} ${finalUrl}`);

        try {
            const response = await fetch(finalUrl, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': this.apiKey,
                },
                body: body ? JSON.stringify(body) : undefined,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            const contentType = response.headers.get('content-type');
            let data = null;

            if (contentType && contentType.includes('application/json')) {
                data = await response.json().catch(() => null);
            } else {
                const text = await response.text();
                // HTML error check
                if (contentType && contentType.includes('text/html')) {
                    throw new Error(`Upstream Error: Server returned HTML(Status ${response.status}).Check Evolution API availability.`);
                }
                data = { message: text };
            }

            if (!response.ok) {
                const errorMessage = data?.response?.message ||
                    data?.message ||
                    data?.error ||
                    `HTTP ${response.status} `;
                // Detect "Instance not found" specifically
                if (response.status === 404) throw new Error(`Resource not found: ${errorMessage} `);
                throw new Error(`API Error(${response.status}): ${JSON.stringify(errorMessage)} `);
            }

            return data;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error('API Timeout: Evolution API took too long to respond.');
            }
            throw error;
        }
    }

    // Verifies connection and finds the EXACT instance name (case-insensitive handling)
    async getRealInstanceName(suspectedName: string): Promise<string> {
        try {
            const data = await this.callApi('/instance/fetchInstances', 'GET');
            const instances = Array.isArray(data) ? data : [];

            const found = instances.find((i: any) => {
                const name = i.instance?.instanceName || i.instanceName || i.name;
                return name === suspectedName || name?.toLowerCase() === suspectedName.toLowerCase();
            });

            if (!found) {
                throw new Error(`Instance '${suspectedName}' not found in Evolution API.`);
            }

            return found.instance?.instanceName || found.instanceName || found.name;
        } catch (error) {
            console.error(`[EvolutionService] Failed to resolve instance name '${suspectedName}': `, error);
            throw error; // Re-throw to controller
        }
    }

    async getGroups(instanceName: string): Promise<any[]> {
        // 1. Get real name first to avoid 404s
        const realName = await this.getRealInstanceName(instanceName);

        const data = await this.callApi(`/group/fetchAllGroups/${realName}?getParticipants=true`, 'GET', undefined, 60000); // 60s timeout

        // 3. Normalize Payload
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.groups)) return data.groups;
        if (data && Array.isArray(data.data)) return data.data;

        console.warn('[EvolutionService] Unexpected group payload format:', data);
        return [];
    }

    async getMyJid(instanceName: string): Promise<string | null> {
        try {
            const data = await this.callApi('/instance/fetchInstances', 'GET');
            if (Array.isArray(data)) {
                const instance = data.find((i: any) => {
                    const name = i.instance?.instanceName || i.instanceName || i.name || i.instance?.name;
                    return name === instanceName || name?.toLowerCase() === instanceName.toLowerCase();
                });

                // Try multiple fields where number might be stored
                const owner = instance?.owner || instance?.instance?.owner || instance?.number || instance?.instance?.number;
                if (owner) {
                    return owner.includes('@') ? owner : `${owner}@s.whatsapp.net`;
                }
            }
            return null;
        } catch (e) {
            console.error('[EvolutionService] getMyJid error:', e);
            return null;
        }
    }

    // Pass-through methods for existing functionality
    async createInstance(params: any): Promise<any> {
        return this.callApi('/instance/create', 'POST', params);
    }

    async deleteInstance(name: string): Promise<any> {
        return this.callApi(`/instance/delete/${name}`, 'DELETE');
    }

    async logoutInstance(name: string): Promise<any> {
        return this.callApi(`/instance/logout/${name}`, 'DELETE');
    }

    async setWebhook(name: string, webhookConfig: any): Promise<any> {
        return this.callApi(`/webhook/set/${name}`, 'POST', webhookConfig);
    }

    async findWebhook(name: string): Promise<any> {
        return this.callApi(`/webhook/find/${name}`, 'GET');
    }

    async connectInstance(name: string): Promise<any> {
        return this.callApi(`/instance/connect/${name}`, 'GET');
    }

    async sendMessage(name: string, body: any): Promise<any> {
        return this.callApi(`/message/sendText/${name}`, 'POST', body);
    }
}

class GroupService {
    constructor(private supabase: SupabaseClient) { }

    async syncGroups(instanceId: string, groups: any[], myJid: string | null): Promise<number> {
        if (!groups.length) return 0;

        const upsertData = groups.map(group => {
            // Determine Admin Status
            let isAdmin = false;
            if (myJid) {
                const myNum = myJid.split('@')[0];
                const ownerNum = (group.owner || group.metadata?.owner || '').split('@')[0];

                if (ownerNum && ownerNum === myNum) {
                    isAdmin = true;
                } else {
                    const participants = group.participants || group.metadata?.participants;
                    if (Array.isArray(participants)) {
                        const me = participants.find((p: any) => {
                            const pId = p.id || p.jid || '';
                            return pId.split('@')[0] === myNum;
                        });
                        if (me && (me.admin === 'admin' || me.admin === 'superadmin' || me.is_admin === true)) {
                            isAdmin = true;
                        }
                    }
                }
            }

            return {
                instance_id: instanceId,
                jid: group.id,
                name: group.subject || group.name || 'Grupo Desconhecido',
                is_admin: isAdmin,
                participants_count: group.size || group.participants?.length || group.metadata?.participants?.length || 0,
                // Removed is_active: false to prevent overwriting existing active groups status
            };
        });

        // Batch upsert for performance
        const { error, count } = await this.supabase
            .from('groups')
            .upsert(upsertData, { onConflict: 'jid', count: 'exact' });

        if (error) {
            console.error('[GroupService] Upsert failed:', error);
            throw new Error(`Database Error: ${error.message}`);
        }

        return upsertData.length; // Approximate count since upsert result count can be null
    }
}

// --- Controller ---

serve(async (req: any) => {
    if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

    try {
        // 1. Auth & Env Check
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
        const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        // Attempt to load settings from DB for Evo Config
        const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!);

        // We fetch settings manually or fallback to env. 
        // For simplicity in this robust refactor, let's prioritize ENV but check DB.
        let EVOLUTION_API_URL = Deno.env.get('EVOLUTION_API_URL');
        let EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY');
        let WEBHOOK_AUTH_TOKEN = Deno.env.get('WEBHOOK_AUTH_TOKEN');

        if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY || !WEBHOOK_AUTH_TOKEN) {
            // Fallback: Check DB "system_settings" (if table exists)
            const { data: settings } = await supabase.from('system_settings').select('*');
            if (settings) {
                EVOLUTION_API_URL = EVOLUTION_API_URL || settings.find((s: any) => s.key === 'EVOLUTION_API_URL')?.value;
                EVOLUTION_API_KEY = EVOLUTION_API_KEY || settings.find((s: any) => s.key === 'EVOLUTION_API_KEY')?.value;
                WEBHOOK_AUTH_TOKEN = WEBHOOK_AUTH_TOKEN || settings.find((s: any) => s.key === 'WEBHOOK_AUTH_TOKEN')?.value;
            }
        }

        if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
            throw new Error('Configuration Error: Evolution API URL/Key missing.');
        }

        // 2. Initialize Services
        const evolutionService = new EvolutionService(EVOLUTION_API_URL, EVOLUTION_API_KEY);
        const groupService = new GroupService(supabase);

        // 3. User Auth
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('Unauthorized: Missing header');
        const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
        if (authError || !user) throw new Error('Unauthorized: Invalid token');

        // 4. Parse Request
        const body = await req.json() as RequestBody;
        const { action } = body;
        console.log(`[Controller] Action: ${action} | User: ${user.id}`);

        // 5. Route Action
        let result: any = { success: true };

        // --- Actions ---

        if (action === 'test_connection') {
            const instances = await evolutionService.callApi('/instance/fetchInstances', 'GET');
            result = { success: true, message: 'Connected', instancesCount: instances.length };
        }

        else if (action === 'fetch_groups') {
            // Get Instance from DB
            const { data: instance } = await supabase.from('instances')
                .select('id, name').eq('user_id', user.id).maybeSingle();

            if (!instance) throw new Error('No instance found for user');

            console.log(`[Controller] Syncing groups for ${instance.name}`);

            // Use Service Layer
            const groups = await evolutionService.getGroups(instance.name);
            const myJid = await evolutionService.getMyJid(instance.name);
            const savedCount = await groupService.syncGroups(instance.id, groups, myJid);

            result = { success: true, count: savedCount };
        }

        else if (action === 'create_instance') {
            const name = body.instanceName || `zapdigest_${user.id.slice(0, 8)}`;
            const webhookUrl = buildWebhookUrl(SUPABASE_URL!, WEBHOOK_AUTH_TOKEN);

            // Check DB first
            let { data: existing } = await supabase.from('instances').select('*').eq('user_id', user.id).maybeSingle();

            const payload = {
                instanceName: existing?.name || name,
                integration: 'WHATSAPP-BAILEYS',
                qrcode: true,
                webhook: {
                    url: webhookUrl,
                    byEvents: true,
                    base64: true,
                    events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE', 'GROUPS_UPSERT', 'GROUP_UPDATE', 'GROUP_PARTICIPANTS_UPDATE']
                }
            };

            let createResponse: any;
            try {
                createResponse = await evolutionService.createInstance(payload);
            } catch (e: any) {
                if (e.message.includes('already exists')) {
                    console.log('Instance exists, updating webhook...');
                    await evolutionService.setWebhook(payload.instanceName, { webhook: payload.webhook });
                } else {
                    throw e;
                }
            }

            // Connect/QR
            const connectData = await evolutionService.connectInstance(payload.instanceName);

            // Update DB
            const status = connectData.instance?.state === 'open' ? 'connected' : 'connecting';
            const qrCode = connectData.base64 || connectData.code || connectData.qrcode?.base64;

            if (existing) {
                await supabase.from('instances').update({ status, qr_code: qrCode, updated_at: new Date().toISOString() }).eq('id', existing.id);
            } else {
                await supabase.from('instances').insert({ user_id: user.id, name: payload.instanceName, status, qr_code: qrCode });
            }

            result = { success: true, status, qrCode, pairingCode: connectData.pairingCode };
        }

        // ... (Implement other actions like fetch_qr, find_webhook using similar pattern if needed)
        // For brevity in this fix, I am ensuring the CRITICAL actions are refactored.
        // I will include the other handlers to not break functionality.

        else if (action === 'fetch_qr') {
            const { data: instance } = await supabase.from('instances').select('name').eq('user_id', user.id).maybeSingle();
            if (!instance) throw new Error('No instance found');

            const data = await evolutionService.connectInstance(instance.name);
            const qrCode = data.base64 || data.code || data.qrcode?.base64;

            if (qrCode) {
                await supabase.from('instances').update({ qr_code: qrCode, status: 'connecting', updated_at: new Date().toISOString() }).eq('user_id', user.id);
            }
            result = { qrCode, pairingCode: data.pairingCode };
        }

        else if (action === 'fetch_status') {
            const { data: instance } = await supabase.from('instances').select('name').eq('user_id', user.id).maybeSingle();
            if (!instance) {
                result = { status: 'disconnected' };
            } else {
                const data = await evolutionService.callApi(`/instance/connectionState/${instance.name}`, 'GET');
                const state = data?.instance?.state || data?.state;
                const status = state === 'open' ? 'connected' : state === 'connecting' ? 'connecting' : 'disconnected';

                // SELF-HEALING: Verify and Fix Webhook if connected
                if (status === 'connected') {
                    try {
                        const webhookConfig = await evolutionService.findWebhook(instance.name);
                        const expectedUrl = buildWebhookUrl(SUPABASE_URL!, WEBHOOK_AUTH_TOKEN);
                        const currentUrl = webhookConfig?.url || webhookConfig?.webhook?.url || '';
                        const isEnabled = webhookConfig?.enabled || webhookConfig?.webhook?.enabled || false;

                        if (currentUrl !== expectedUrl || !isEnabled) {
                            console.log(`[Self-Healing] Webhook mismatch for ${instance.name}. Updating...`);
                            const payload = {
                                webhook: {
                                    enabled: true,
                                    url: expectedUrl,
                                    webhookByEvents: true,
                                    events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE', 'GROUPS_UPSERT', 'GROUP_UPDATE', 'GROUP_PARTICIPANTS_UPDATE']
                                }
                            };
                            await evolutionService.setWebhook(instance.name, payload);
                            console.log(`[Self-Healing] Webhook updated successfully.`);
                        }
                    } catch (err) {
                        console.error('[Self-Healing] Webhook check failed:', err);
                    }
                }

                await supabase.from('instances').update({ status, updated_at: new Date().toISOString() }).eq('user_id', user.id);
                result = { status };
            }
        }

        else if (action === 'set_webhook') {
            const { data: instance } = await supabase.from('instances').select('name').eq('user_id', user.id).maybeSingle();
            if (!instance) throw new Error('No instance found');

            const webhookUrl = buildWebhookUrl(SUPABASE_URL!, WEBHOOK_AUTH_TOKEN);
            const payload = {
                webhook: {
                    enabled: true,
                    url: webhookUrl,
                    webhookByEvents: true,
                    events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE', 'GROUPS_UPSERT', 'GROUP_UPDATE', 'GROUP_PARTICIPANTS_UPDATE']
                }
            };

            const response = await evolutionService.setWebhook(instance.name, payload);
            result = { success: true, response };
        }

        else if (action === 'find_webhook') {
            const { data: instance } = await supabase.from('instances').select('name').eq('user_id', user.id).maybeSingle();
            if (!instance) throw new Error('No instance found');

            const config = await evolutionService.findWebhook(instance.name);
            const expectedUrl = buildWebhookUrl(SUPABASE_URL!, WEBHOOK_AUTH_TOKEN);
            const currentUrl = config?.url || config?.webhook?.url || '';

            result = {
                success: true,
                isCorrect: currentUrl === expectedUrl,
                hasToken: currentUrl.includes('token='),
                currentUrl,
                webhook: config
            };
        }

        else if (action === 'logout_instance' || action === 'delete_instance') {
            const { data: instance } = await supabase.from('instances').select('id, name').eq('user_id', user.id).maybeSingle();
            if (instance) {
                if (action === 'logout_instance') {
                    await evolutionService.logoutInstance(instance.name);
                    await supabase.from('instances').update({ status: 'disconnected', qr_code: null }).eq('id', instance.id);
                } else {
                    await evolutionService.deleteInstance(instance.name);
                    await supabase.from('groups').delete().eq('instance_id', instance.id);
                    await supabase.from('instances').delete().eq('id', instance.id);
                }
            }
        }

        else if (action === 'send_message') {
            const { data: instance } = await supabase.from('instances').select('name').eq('user_id', user.id).maybeSingle();
            if (!instance) throw new Error('No instance found');

            await evolutionService.sendMessage(instance.name, { number: body.to, text: body.message });
        }

        else {
            throw new Error(`Invalid action: ${action}`);
        }

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error(`[Controller] Error:`, error.message);
        const status = error.message.includes('Unauthorized') ? 401 :
            error.message.includes('not found') ? 404 : 500;

        return new Response(
            JSON.stringify({ error: error.message, details: error.stack }),
            { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});

// Helper for Webhook URL
function buildWebhookUrl(supabaseUrl: string, token?: string): string {
    const authToken = token || Deno.env.get('WEBHOOK_AUTH_TOKEN');
    return authToken
        ? `${supabaseUrl}/functions/v1/whatsapp-webhook?token=${authToken}`
        : `${supabaseUrl}/functions/v1/whatsapp-webhook`;
}
