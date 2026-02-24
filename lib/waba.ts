import { createAdminClient } from "./supabase/admin";

export interface WabaPayload {
    to: string;
    type: 'text' | 'template';
    text?: { body: string };
    template?: {
        name: string;
        language: { code: string };
        components: Record<string, unknown>[];
    };
}

/**
 * Sends a message via Meta WhatsApp Business API (WABA)
 * using the system's active bot.
 */
export async function sendWabaMessage(payload: WabaPayload) {
    const supabase = createAdminClient();

    // 1. Get active system bot
    const { data: bot, error: botError } = await supabase
        .from('admin_outbound_meta')
        .select('*')
        .eq('is_system_bot', true)
        .eq('is_active', true)
        .maybeSingle();

    if (botError || !bot) {
        throw new Error(`[WABA] System bot not found or error: ${botError?.message || 'Unknown'}`);
    }

    const { phone_number_id, access_token_encrypted } = bot;

    if (!phone_number_id || !access_token_encrypted) {
        throw new Error('[WABA] System bot configuration missing phone_number_id or access_token');
    }

    // 2. Dispatch to Meta API
    const response = await fetch(`https://graph.facebook.com/v17.0/${phone_number_id}/messages`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${access_token_encrypted}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            messaging_product: 'whatsapp',
            ...payload
        })
    });

    const result = await response.json();

    if (!response.ok) {
        console.error('[WABA] API Error:', JSON.stringify(result, null, 2));
        throw new Error(`[WABA] API Failure: ${result.error?.message || response.statusText}`);
    }

    return result;
}
