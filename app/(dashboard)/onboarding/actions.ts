"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getOnboardingData() {
    try {
        const supabase = await createClient();

        // 1. Get WhatsApp Config
        const { data: whatsappConfig } = await supabase
            .from("admin_outbound_meta")
            .select("id, display_number, phone_number_id")
            .eq("is_active", true)
            .eq("is_system_bot", true)
            .maybeSingle();

        // 2. Get Telegram Bot Link
        const { data: botConfig } = await supabase
            .from("agent_presets")
            .select("bot_link")
            .eq("name", "Sentinel")
            .maybeSingle();

        return {
            whatsappConfig,
            botLink: botConfig?.bot_link || null
        };
    } catch (err: any) {
        console.error('[getOnboardingData] Error:', err);
        return {
            whatsappConfig: null,
            botLink: null
        };
    }
}

export async function registerGroup(data: {
    name: string;
    description?: string;
    platform: string;
    organizationId: string;
}) {
    try {
        const supabase = await createClient(); // Assuming createClient() is intended here, as createAdminClient() is not defined in the original file.

        // Check for duplicate name in the same organization
        const { data: existingGroup } = await supabase
            .from("groups")
            .select("id")
            .eq("organization_id", data.organizationId)
            .ilike("name", data.name)
            .maybeSingle();

        if (existingGroup) {
            return { error: "Já existe um grupo cadastrado com este nome. Por favor, escolha outro nome ou exclua o existente." };
        }

        // 1. Get default preset (Sentinel) or first available
        const { data: preset } = await supabase
            .from('agent_presets')
            .select('id, name')
            .eq('name', 'Sentinel')
            .single()

        // 2. Create Group
        const shortId = Math.random().toString(36).substring(2, 6).toUpperCase();
        const externalId = `SB-${shortId}`;
        const { data: group, error: groupError } = await supabase
            .from('groups')
            .insert({
                name: data.name,
                description: data.description,
                platform: data.platform,
                organization_id: data.organizationId,
                preset_id: preset?.id,
                external_id: externalId,
                is_active: true
            })
            .select("id, external_id")
            .single()

        if (groupError || !group) {
            console.error("[registerGroup] Group Error:", groupError);
            return { error: groupError?.message || "Erro ao registrar grupo." };
        }

        // 3. Create Group Agent record
        // Fixed: Columns in 'group_agents' are 'preset' (text) and 'status' (text)
        const { error: agentError } = await supabase.from("group_agents").insert({
            group_id: group.id,
            preset: preset?.name || 'Sentinel',
            status: "pending",
        });

        if (agentError) {
            console.error("[registerGroup] Agent Error:", agentError);
            // We don't return error here because the group was created, 
            // but we log it for debugging.
        }

        return { groupId: group.id, externalId: group.external_id };
    } catch (err: any) {
        console.error("[registerGroup] Unexpected Error:", err);
        return { error: "Ocorreu um erro inesperado ao processar sua solicitação." };
    }
}

export async function checkGroupSignal(groupId: string) {
    try {
        const supabase = await createClient();

        const { data: agent, error } = await supabase
            .from("group_agents")
            .select("status")
            .eq("group_id", groupId)
            .single();

        if (error || !agent) {
            return { connected: false };
        }

        // If status moved from pending to active, it means the bot captured a message
        return {
            connected: agent.status === "active",
        };
    } catch (err: any) {
        console.error('[checkGroupSignal] Error:', err);
        return { connected: false };
    }
}
