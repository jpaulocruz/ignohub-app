"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getOnboardingData() {
    const supabase = await createClient();

    const { data: whatsappConfig } = await supabase
        .from("admin_collection_instances")
        .select("id, instance_name")
        .eq("is_active", true)
        .eq("provider", "evolution")
        .limit(1)
        .maybeSingle();

    const { data: globalLink } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "TELEGRAM_BOT_LINK")
        .maybeSingle();

    let botLink = globalLink?.value;

    if (!botLink) {
        const { data: preset } = await supabase
            .from("agent_presets")
            .select("bot_link")
            .eq("is_active", true)
            .ilike("name", "Sentinel")
            .maybeSingle();
        botLink = preset?.bot_link;
    }

    if (!botLink) {
        const { data: anyPreset } = await supabase
            .from("agent_presets")
            .select("bot_link")
            .eq("is_active", true)
            .limit(1)
            .maybeSingle();
        botLink = anyPreset?.bot_link;
    }

    return {
        whatsappConfig: whatsappConfig ? {
            id: whatsappConfig.id,
            display_number: whatsappConfig.instance_name,
            phone_number_id: whatsappConfig.instance_name
        } : null,
        botLink: botLink || null
    };
}

export async function registerGroup(data: {
    name: string;
    description?: string;
    platform: string;
    organizationId: string;
}) {
    const supabase = await createClient();

    const externalId = `onb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

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
        console.error("[registerGroup]", groupError);
        return { error: groupError?.message || "Erro ao registrar grupo." };
    }

    await supabase.from("group_agents").insert({
        group_id: group.id,
        preset_id: preset?.id, // Use preset_id instead of preset name string if schema changed, or name
        status: "pending",
    });

    return { groupId: group.id, externalId: group.external_id };
}

export async function checkGroupSignal(groupId: string) {
    const supabase = await createClient();

    const { data: message } = await supabase
        .from("messages")
        .select("id")
        .eq("group_id", groupId)
        .limit(1)
        .maybeSingle();

    if (message) {
        await supabase
            .from("group_agents")
            .update({ status: "active", last_seen_at: new Date().toISOString() })
            .eq("group_id", groupId);

        revalidatePath("/groups");
        return { connected: true };
    }

    return { connected: false };
}
