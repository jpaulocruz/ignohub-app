"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import fs from "fs/promises";
import path from "path";

// ─── Outbound Meta (WhatsApp Official) ───

export async function getOutboundMeta() {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from("admin_outbound_meta")
        .select("*")
        .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
}

export async function saveWhatsAppConfig(formData: {
    id?: string;
    phone_number_id: string;
    waba_id: string;
    access_token: string;
    display_number: string;
    verify_token?: string;
    is_active?: boolean | null;
}) {
    const supabase = createAdminClient();

    try {
        if (formData.id) {
            const { error } = await supabase
                .from("admin_outbound_meta")
                .update({
                    phone_number_id: formData.phone_number_id,
                    waba_id: formData.waba_id,
                    access_token_encrypted: formData.access_token,
                    display_number: formData.display_number,
                    is_active: formData.is_active ?? true,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", formData.id);
            if (error) throw error;
        } else {
            const { error } = await supabase
                .from("admin_outbound_meta")
                .insert({
                    phone_number_id: formData.phone_number_id,
                    waba_id: formData.waba_id,
                    access_token_encrypted: formData.access_token,
                    display_number: formData.display_number,
                    verify_token: formData.verify_token || crypto.randomUUID().slice(0, 16),
                    is_active: formData.is_active ?? true,
                    updated_at: new Date().toISOString(),
                });
            if (error) throw error;
        }

        revalidatePath("/assets");
        return { success: true };
    } catch (err: any) {
        console.error("[saveWhatsAppConfig] Unexpected Error:", err);
        return { error: err.message || "Erro ao salvar configuração do WhatsApp." };
    }
}

export async function deleteWhatsAppConfig(id: string) {
    const supabase = createAdminClient();
    try {
        const { error } = await supabase
            .from("admin_outbound_meta")
            .delete()
            .eq("id", id);
        if (error) throw error;
        revalidatePath("/assets");
        return { success: true };
    } catch (err: any) {
        console.error("[deleteWhatsAppConfig] Unexpected Error:", err);
        return { error: err.message || "Erro ao excluir configuração do WhatsApp." };
    }
}

export async function toggleWhatsAppStatus(id: string, currentStatus: boolean) {
    const supabase = createAdminClient();
    try {
        const { error } = await supabase
            .from("admin_outbound_meta")
            .update({ is_active: !currentStatus, updated_at: new Date().toISOString() })
            .eq("id", id);
        if (error) throw error;
        revalidatePath("/assets");
        return { success: true };
    } catch (err: any) {
        console.error("[toggleWhatsAppStatus] Unexpected Error:", err);
        return { error: err.message || "Erro ao alterar status do WhatsApp." };
    }
}

// ─── Collection Instances (Evolution / Telegram) ───

export async function getCollectionInstances() {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from("admin_collection_instances")
        .select("*")
        .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
}

export async function saveCollectionInstance(formData: {
    id?: string;
    provider: "evolution" | "telegram";
    instance_name: string;
    instance_key?: string;
    status?: string;
    qr_code_base64?: string;
}) {
    const supabase = createAdminClient();

    try {
        if (formData.id) {
            const { error } = await supabase
                .from("admin_collection_instances")
                .update({
                    instance_name: formData.instance_name,
                    instance_key: formData.instance_key,
                    status: formData.status || "disconnected",
                    qr_code_base64: formData.qr_code_base64,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", formData.id);
            if (error) throw error;
        } else {
            const { error } = await supabase
                .from("admin_collection_instances")
                .insert({
                    provider: formData.provider,
                    instance_name: formData.instance_name,
                    instance_key: formData.instance_key,
                    status: formData.status || "disconnected",
                    qr_code_base64: formData.qr_code_base64,
                });
            if (error) throw error;
        }

        revalidatePath("/assets");
        return { success: true };
    } catch (err: any) {
        console.error("[saveCollectionInstance] Unexpected Error:", err);
        return { error: err.message || "Erro ao salvar instância de coleta." };
    }
}

export async function deleteCollectionInstance(id: string) {
    const supabase = createAdminClient();
    try {
        const { error } = await supabase
            .from("admin_collection_instances" as any)
            .delete()
            .eq("id", id);
        if (error) throw error;
        revalidatePath("/assets");
        return { success: true };
    } catch (err: any) {
        console.error("[deleteCollectionInstance] Unexpected Error:", err);
        return { error: err.message || "Erro ao excluir instância de coleta." };
    }
}

export async function toggleCollectionStatus(id: string, currentStatus: boolean) {
    const supabase = createAdminClient();
    try {
        const { error } = await supabase
            .from("admin_collection_instances")
            .update({ is_active: !currentStatus, updated_at: new Date().toISOString() })
            .eq("id", id);
        if (error) throw error;
        revalidatePath("/assets");
        return { success: true };
    } catch (err: any) {
        console.error("[toggleCollectionStatus] Unexpected Error:", err);
        return { error: err.message || "Erro ao alterar status da instância." };
    }
}

// ─── Evolution API Integration ───

import {
    createInstance,
    connectInstance,
    getConnectionState,
    setSettings,
    fetchInstances,
    deleteInstance,
    fetchGroups,
    EvolutionConfig
} from "@/lib/evolution-api";

async function getInternalConfig() {
    const supabase = createAdminClient();
    const { data } = await supabase
        .from("admin_evolution_config")
        .select("instance_url, api_key")
        .single();

    if (data?.instance_url && data?.api_key) {
        return { url: data.instance_url, apiKey: data.api_key };
    }

    // Fallback to env
    if (process.env.EVOLUTION_API_URL && process.env.EVOLUTION_API_KEY) {
        return undefined; // Let the lib use env vars
    }

    throw new Error("Evolution API not configured");
}

export async function createEvolutionInstance(name: string) {
    try {
        const supabase = await createClient();
        const config = await getInternalConfig();

        // Call Evolution API directly
        const result = await createInstance(name, config); // Pass config (undefined if using env)

        console.log("[Evolution Create] Result:", JSON.stringify(result, null, 2));

        // Auto-configure: enable group messages
        try {
            await setSettings(name, {
                groupsIgnore: false,
                rejectCall: true,
                readMessages: false,
                readStatus: false,
                syncFullHistory: false,
                alwaysOnline: true,
            }, config);
        } catch (e) {
            console.warn("Failed to auto-configure settings:", e);
        }

        // Save to Supabase using Admin Client to bypass RLS
        const supabaseAdmin = createAdminClient();
        const qrBase64 = result.qrcode?.base64 || result.base64 || null;

        // Check if result has instance data
        const instanceKey = result.hash || result.instance?.instanceId || result.instance?.id || null;

        const { data: inserted, error } = await supabaseAdmin
            .from("admin_collection_instances")
            .insert({
                provider: "evolution",
                instance_name: name,
                instance_key: instanceKey,
                status: qrBase64 ? "qr_ready" : "created",
                qr_code_base64: qrBase64,
            })
            .select()
            .single();

        if (error) {
            console.error("[Evolution Create] DB Error:", error);
            throw error;
        }

        revalidatePath("/assets");
        return { success: true, instance: inserted, qr: qrBase64, raw: result };
    } catch (err: any) {
        console.error("[createEvolutionInstance] Unexpected Error:", err);
        return { error: err.message || "Erro ao criar instância na Evolution API." };
    }
}

export async function testEvolutionConnection() {
    try {
        const start = Date.now();
        const config = await getInternalConfig();
        const instances = await fetchInstances(config);
        const duration = Date.now() - start;

        return {
            success: true,
            duration,
            count: instances?.length || 0,
            instances: instances ? instances.map(i => i.instance.instanceName) : []
        };
    } catch (error: any) {
        console.error("[Evolution Test] Error:", error);
        return { success: false, error: error.message };
    }
}

export async function connectEvolutionInstance(instanceName: string, dbId: string) {
    try {
        const supabase = await createClient();
        const config = await getInternalConfig();

        const result = await connectInstance(instanceName, config);
        const qrBase64 = result.base64 || result.code || null;

        if (qrBase64) {
            // Update DB
            const supabaseAdmin = createAdminClient();
            await supabaseAdmin
                .from("admin_collection_instances")
                .update({
                    qr_code_base64: qrBase64,
                    status: "qr_ready",
                    updated_at: new Date().toISOString()
                })
                .eq("id", dbId);
        }

        return { success: true, qr: qrBase64, pairingCode: result.pairingCode };
    } catch (err: any) {
        console.error("[connectEvolutionInstance] Unexpected Error:", err);
        return { error: err.message || "Erro ao conectar instância." };
    }
}

export async function getEvolutionConnectionState(instanceName: string, dbId: string) {
    try {
        const supabase = await createClient();
        const config = await getInternalConfig();

        const result = await getConnectionState(instanceName, config);
        const state = (result as any).instance?.state || result.state || "close"; // Handle different API response structures

        // Sync status to Supabase
        await supabase
            .from("admin_collection_instances")
            .update({ status: state, updated_at: new Date().toISOString() })
            .eq("id", dbId);

        return { success: true, state };
    } catch (err: any) {
        console.error("[getEvolutionConnectionState] Unexpected Error:", err);
        return { error: err.message || "Erro ao obter estado da conexão." };
    }
}

export async function syncEvolutionInstances() {
    try {
        const supabase = await createClient();
        const config = await getInternalConfig();

        const evoInstances = await fetchInstances(config);

        console.log(`[Evolution Sync] Fetched ${evoInstances?.length || 0} instances`);
        if (evoInstances?.length > 0) {
            console.log("[Evolution Sync] First instance sample:", JSON.stringify(evoInstances[0], null, 2));
        }

        // Get current DB instances using Admin Client to ensure we see them all
        const supabaseAdmin = createAdminClient();
        const { data: dbInstances } = await supabaseAdmin
            .from("admin_collection_instances")
            .select("*")
            .eq("provider", "evolution");

        const dbMap = new Map<string, any[]>();
        dbInstances?.forEach((i: any) => {
            if (!dbMap.has(i.instance_name)) {
                dbMap.set(i.instance_name, []);
            }
            dbMap.get(i.instance_name)?.push(i);
        });

        // Sync each Evolution instance
        const currentEvolutionNames = new Set<string>();

        for (const evo of evoInstances || []) {
            const name = evo.instance?.instanceName || (evo as any).name; // Handle potential structure variation
            if (!name) {
                console.warn("[Evolution Sync] Skipping instance without name:", evo);
                continue;
            }
            currentEvolutionNames.add(name);

            const statusRaw = evo.instance?.status || (evo as any).status || (evo as any).connectionStatus || "close";
            const status = statusRaw === "open" ? "open" : "close";

            const ownerRaw = evo.instance?.owner || (evo as any).owner || (evo as any).ownerJid;

            const matches = dbMap.get(name) || [];

            if (matches.length > 0) {
                // Sort matches to keep the best one (prefer one with instance_key)
                matches.sort((a, b) => {
                    if (a.instance_key && !b.instance_key) return -1;
                    if (!a.instance_key && b.instance_key) return 1;
                    return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
                });

                const target = matches[0];
                const updates: any = { status, updated_at: new Date().toISOString() };
                // Update key if missing and available
                const key = evo.instance?.instanceId || (evo as any).id;
                if (key && !target.instance_key) {
                    updates.instance_key = key;
                }

                await supabaseAdmin
                    .from("admin_collection_instances")
                    .update(updates)
                    .eq("id", target.id);

                // Delete duplicates
                if (matches.length > 1) {
                    const toDelete = matches.slice(1).map(m => m.id);
                    console.log(`[Evolution Sync] Removing ${toDelete.length} duplicates for ${name}`);
                    await supabaseAdmin
                        .from("admin_collection_instances")
                        .delete()
                        .in("id", toDelete);
                }
            } else {
                await supabaseAdmin
                    .from("admin_collection_instances")
                    .insert({
                        provider: "evolution",
                        instance_name: name,
                        instance_key: evo.instance?.instanceId || (evo as any).id || null,
                        status,
                    });
            }

            // Sync owner to admin_outbound_meta if connected (for both new and existing)
            if (status === "open" && ownerRaw) {
                const owner = ownerRaw.split("@")[0];
                const { data: meta } = await supabaseAdmin
                    .from("admin_outbound_meta")
                    .select("id")
                    .eq("is_active", true)
                    .limit(1)
                    .maybeSingle();

                if (meta) {
                    await supabaseAdmin
                        .from("admin_outbound_meta")
                        .update({
                            display_number: owner,
                            phone_number_id: owner,
                            updated_at: new Date().toISOString()
                        })
                        .eq("id", meta.id);
                } else {
                    await supabaseAdmin.from("admin_outbound_meta").insert({
                        is_active: true,
                        display_number: owner,
                        phone_number_id: owner, // Use phone as ID for Evolution
                        waba_id: "evolution_v2",
                        access_token_encrypted: "evolution_managed", // Placeholder
                        verify_token: "evolution", // Placeholder
                    });
                }
            }
        }

        // Delete instances from DB that are NOT in Evolution
        const toDelete = dbInstances?.filter((i: any) => !currentEvolutionNames.has(i.instance_name)) || [];

        if (toDelete.length > 0) {
            console.log(`[Evolution Sync] Deleting ${toDelete.length} stale instances from DB`);
            await supabaseAdmin
                .from("admin_collection_instances")
                .delete()
                .in("id", toDelete.map(i => i.id));
        }

        revalidatePath("/assets");
        return { success: true, synced: evoInstances?.length || 0 };
    } catch (err: any) {
        console.error("[syncEvolutionInstances] Unexpected Error:", err);
        return { error: err.message || "Erro ao sincronizar instâncias." };
    }
}

export async function deleteEvolutionInstance(dbId: string, instanceName: string) {
    const supabase = await createClient();
    const config = await getInternalConfig();

    // Delete from Evolution API
    try {
        await deleteInstance(instanceName, config);
    } catch (e) {
        console.warn("Failed to delete from Evolution API:", e);
    }

    // Delete from Supabase
    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin
        .from("admin_collection_instances")
        .delete()
        .eq("id", dbId);
    if (error) throw error;

    revalidatePath("/assets");
    return { success: true };
}

export async function fetchEvolutionGroups(instanceName: string) {
    const config = await getInternalConfig();
    const groups = await fetchGroups(instanceName, config);
    return { success: true, groups: groups || [] };
}

export async function getEvolutionConfig() {
    const supabase = createAdminClient();
    const { data } = await supabase
        .from("admin_evolution_config")
        .select("id, instance_url, api_key, updated_at")
        .single();

    if (!data) return null;

    // Mask API Key for security
    const maskedKey = data.api_key
        ? `${data.api_key.slice(0, 4)}...${data.api_key.slice(-4)}`
        : "";

    return { ...data, api_key: maskedKey };
}

export async function saveEvolutionConfig(url: string, apiKey: string) {
    const supabase = createAdminClient();

    try {
        // Check if config exists
        const { data: existing } = await supabase
            .from("admin_evolution_config")
            .select("id")
            .single();

        if (existing) {
            const { error } = await supabase
                .from("admin_evolution_config")
                .update({ instance_url: url, api_key: apiKey, updated_at: new Date().toISOString() })
                .eq("id", existing.id);
            if (error) throw error;
        } else {
            const { error } = await supabase
                .from("admin_evolution_config")
                .insert({ instance_url: url, api_key: apiKey });
            if (error) throw error;
        }

        revalidatePath("/assets");
        return { success: true };
    } catch (err: any) {
        console.error("[saveEvolutionConfig] Unexpected Error:", err);
        return { error: err.message || "Erro ao salvar configuração da Evolution API." };
    }
}

// ─── Agent Presets ───

export async function getAgentPresets() {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from("agent_presets")
        .select("*")
        .order("name", { ascending: true });
    if (error) throw error;
    return data || [];
}

export async function saveAgentPreset(formData: {
    id: string;
    telegram_bot_username: string;
    whatsapp_support_number: string;
    bot_link: string;
    is_active?: boolean | null;
}) {
    const supabase = createAdminClient();

    try {
        const { error } = await supabase
            .from("agent_presets")
            .update({
                telegram_bot_username: formData.telegram_bot_username,
                whatsapp_support_number: formData.whatsapp_support_number,
                bot_link: formData.bot_link,
                is_active: formData.is_active ?? true,
            })
            .eq("id", formData.id);

        if (error) throw error;

        revalidatePath("/assets");
        return { success: true };
    } catch (err: any) {
        console.error("[saveAgentPreset] Unexpected Error:", err);
        return { error: err.message || "Erro ao salvar preset do agente." };
    }
}

export async function togglePresetStatus(id: string, currentStatus: boolean) {
    const supabase = createAdminClient();
    try {
        const { error } = await supabase
            .from("agent_presets")
            .update({ is_active: !currentStatus })
            .eq("id", id);
        if (error) throw error;
        revalidatePath("/assets");
        return { success: true };
    } catch (err: any) {
        console.error("[togglePresetStatus] Unexpected Error:", err);
        return { error: err.message || "Erro ao alterar status do preset." };
    }
}

// ─── Load & Usage Stats ───

export async function getLoadStats() {
    const supabase = createAdminClient();

    const { data: presetLoad } = await supabase
        .from("groups")
        .select("preset_id, id");

    const presetCounts: Record<string, number> = {};
    presetLoad?.forEach((g) => {
        if (g.preset_id) {
            presetCounts[g.preset_id] = (presetCounts[g.preset_id] || 0) + 1;
        }
    });

    const { data: platformLoad } = await supabase
        .from("groups")
        .select("platform, id");

    const platformCounts: Record<string, number> = {};
    platformLoad?.forEach((g) => {
        platformCounts[g.platform] = (platformCounts[g.platform] || 0) + 1;
    });

    return { presetCounts, platformCounts };
}

export async function getTokenUsageStats() {
    const supabase = createAdminClient();

    const { data: batches } = await supabase
        .from("message_batches")
        .select("group_id, tokens_used")
        .not("tokens_used", "is", null);

    const { data: groups } = await supabase
        .from("groups")
        .select("id, name, platform");

    const groupMap = new Map(groups?.map((g) => [g.id, g]) || []);

    const usageByGroup: Record<string, { name: string; platform: string; tokens: number }> = {};

    batches?.forEach((b) => {
        const group = groupMap.get(b.group_id);
        if (!group || !b.tokens_used) return;

        if (!usageByGroup[b.group_id]) {
            usageByGroup[b.group_id] = { name: group.name, platform: group.platform, tokens: 0 };
        }
        usageByGroup[b.group_id].tokens += b.tokens_used;
    });

    return Object.values(usageByGroup).sort((a, b) => b.tokens - a.tokens);
}

// ─── AI Settings (System Settings) ───

export async function getAISettings() {
    const supabase = createAdminClient();
    const apiKeyFields = ["GOOGLE_API_KEY", "OPENAI_API_KEY", "ANTHROPIC_API_KEY", "GROQ_API_KEY", "LOVABLE_API_KEY"];
    const promptFields = ["PROMPT_SUMMARY_SYSTEM", "TELEGRAM_BOT_LINK"];
    const allKeys = [...apiKeyFields, ...promptFields];

    const { data, error } = await supabase
        .from("system_settings")
        .select("key, value")
        .in("key", allKeys);

    if (error) throw error;

    const settings: Record<string, string> = {};

    // Initialize with empty strings
    allKeys.forEach(k => settings[k] = "");

    // Fill values
    (data as any[] | null)?.forEach(s => {
        if (s.value) {
            // Mask API keys only
            if (apiKeyFields.includes(s.key)) {
                settings[s.key] = s.value.length > 8
                    ? `${s.value.slice(0, 4)}...${s.value.slice(-4)}`
                    : "••••••••";
            } else {
                // Return full value for prompts
                settings[s.key] = s.value;
            }
        }
    });

    return settings;
}

export async function getGlobalTemplateSettings() {
    const supabase = createAdminClient();
    const keys = ["META_TEMPLATE_SUMMARY", "META_TEMPLATE_ALERT", "META_TEMPLATE_INSIGHT"];

    const { data, error } = await supabase
        .from("system_settings")
        .select("key, value")
        .in("key", keys);

    if (error) throw error;

    const settings: Record<string, string> = {};
    keys.forEach(k => settings[k] = "");
    (data as any[] | null)?.forEach(s => settings[s.key] = s.value);

    return settings;
}

export async function saveAISetting(key: string, value: string, description?: string) {
    const supabase = createAdminClient();

    try {
        const payload: any = { key, value };
        if (description) payload.description = description;

        console.log("[saveAISetting] Attempting to save:", { key, valueLength: value?.length, description });

        const { error } = await supabase
            .from("system_settings")
            .upsert(payload, { onConflict: "key" });

        if (error) {
            console.error("[saveAISetting] DB Error:", error);
            throw error;
        }
        console.log("[saveAISetting] Success!");

        revalidatePath("/assets");
        return { success: true };
    } catch (err: any) {
        console.error("[saveAISetting] Unexpected Error:", err);
        return { error: err.message || "Erro ao salvar configuração de IA." };
    }
}

// ─── WhatsApp Templates ───

export async function getWhatsAppTemplates() {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from("admin_whatsapp_templates")
        .select("*")
        .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
}

export async function saveWhatsAppTemplate(formData: {
    id?: string;
    name: string;
    platform: "meta" | "evolution";
    category?: string;
    language?: string;
    content?: string;
    is_active?: boolean;
}) {
    const supabase = createAdminClient();

    try {
        const payload = {
            name: formData.name,
            platform: formData.platform,
            category: formData.category || "MARKETING",
            language: formData.language || "pt_BR",
            content: formData.content,
            is_active: formData.is_active ?? true,
            updated_at: new Date().toISOString(),
        };

        if (formData.id) {
            const { error } = await supabase
                .from("admin_whatsapp_templates")
                .update(payload)
                .eq("id", formData.id);
            if (error) throw error;
        } else {
            const { error } = await supabase
                .from("admin_whatsapp_templates")
                .insert(payload);
            if (error) throw error;
        }

        revalidatePath("/assets");
        return { success: true };
    } catch (err: any) {
        console.error("[saveWhatsAppTemplate] Unexpected Error:", err);
        return { error: err.message || "Erro ao salvar template do WhatsApp." };
    }
}

export async function syncMetaTemplates() {
    const supabase = createAdminClient();

    try {
        // 1. Get active Meta system bot
        const { data: systemBot } = await supabase
            .from("admin_outbound_meta")
            .select("*")
            .eq("is_system_bot", true)
            .eq("is_active", true)
            .maybeSingle();

        if (!systemBot) {
            throw new Error("Nenhum Bot do Sistema (Meta) configurado ou ativo.");
        }

        const WABA_ID = systemBot.waba_id;
        const ACCESS_TOKEN = systemBot.access_token_encrypted;

        // 2. Fetch from Meta
        const response = await fetch(`https://graph.facebook.com/v17.0/${WABA_ID}/message_templates?limit=100`, {
            headers: {
                Authorization: `Bearer ${ACCESS_TOKEN}`,
            },
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(`Erro Meta API: ${err.error?.message || response.statusText}`);
        }

        const { data: metaTemplates } = await response.json();

        // 3. Upsert into database
        let syncCount = 0;
        for (const tmpl of metaTemplates) {
            const isActive = tmpl.status === "APPROVED";

            const payload = {
                name: tmpl.name,
                platform: "meta",
                category: tmpl.category,
                language: tmpl.language,
                content: JSON.stringify({ components: tmpl.components }),
                is_active: isActive,
                updated_at: new Date().toISOString(),
            };

            const { data: existing } = await supabase
                .from("admin_whatsapp_templates")
                .select("id")
                .eq("name", tmpl.name)
                .eq("platform", "meta")
                .maybeSingle();

            if (existing) {
                await supabase
                    .from("admin_whatsapp_templates")
                    .update(payload)
                    .eq("id", existing.id);
            } else {
                await supabase
                    .from("admin_whatsapp_templates")
                    .insert(payload);
            }
            syncCount++;
        }

        revalidatePath("/assets");
        return { success: true, count: syncCount };
    } catch (e: any) {
        console.error("[syncMetaTemplates] Error:", e);
        return { error: e.message || "Erro ao sincronizar templates do Meta." };
    }
}

export async function deleteWhatsAppTemplate(id: string) {
    const supabase = createAdminClient();
    try {
        const { error } = await supabase
            .from("admin_whatsapp_templates" as any)
            .delete()
            .eq("id", id);
        if (error) throw error;
        revalidatePath("/assets");
        return { success: true };
    } catch (err: any) {
        console.error("[deleteWhatsAppTemplate] Unexpected Error:", err);
        return { error: err.message || "Erro ao excluir template do WhatsApp." };
    }
}

// ─── System Bot Configuration ───

export async function setSystemBot(id: string, table: "admin_outbound_meta" | "admin_collection_instances") {
    const supabase = createAdminClient();

    try {
        // 1. Reset all
        await supabase.from("admin_outbound_meta" as any).update({ is_system_bot: false } as any);
        await supabase.from("admin_collection_instances" as any).update({ is_system_bot: false } as any);

        // 2. Set new system bot
        const { error } = await supabase
            .from(table as any)
            .update({ is_system_bot: true, is_active: true } as any)
            .eq("id", id);

        if (error) throw error;

        revalidatePath("/assets");
        return { success: true };
    } catch (err: any) {
        console.error("[setSystemBot] Unexpected Error:", err);
        return { error: err.message || "Erro ao definir bot do sistema." };
    }
}
