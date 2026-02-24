/**
 * Evolution API v2 HTTP Client
 *
 * All calls require EVOLUTION_API_URL and EVOLUTION_API_KEY env vars.
 * Docs: https://doc.evolution-api.com
 */

/**
 * Evolution API v2 HTTP Client
 *
 * All calls require EVOLUTION_API_URL and EVOLUTION_API_KEY env vars,
 * OR a config object passed explicitly.
 * Docs: https://doc.evolution-api.com
 */

export interface EvolutionConfig {
    url: string;
    apiKey: string;
}

const getBaseUrl = (config?: EvolutionConfig) => {
    const url = config?.url || process.env.EVOLUTION_API_URL;
    if (!url) throw new Error("EVOLUTION_API_URL is not configured");
    return url.replace(/\/$/, "");
};

const getApiKey = (config?: EvolutionConfig) => {
    const key = config?.apiKey || process.env.EVOLUTION_API_KEY;
    if (!key) throw new Error("EVOLUTION_API_KEY is not configured");
    return key;
};

async function evoFetch<T = unknown>(
    path: string,
    options: { method?: string; body?: unknown; config?: EvolutionConfig } = {}
): Promise<T> {
    const { method = "GET", body, config } = options;
    const res = await fetch(`${getBaseUrl(config)}${path}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            apikey: getApiKey(config),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "Unknown error");
        throw new Error(`Evolution API [${method} ${path}] ${res.status}: ${text}`);
    }

    return res.json();
}

// ─── Instance Management ───

export interface CreateInstanceParams {
    instanceName: string;
    qrcode?: boolean;
    integration?: "WHATSAPP-BAILEYS" | "WHATSAPP-BUSINESS" | "EVOLUTION";
}

export interface InstanceInfo {
    instance: {
        instanceName: string;
        instanceId: string;
        status: string;
        owner?: string;
    };
}

export async function createInstance(name: string, config?: EvolutionConfig) {
    return evoFetch<unknown>("/instance/create", {
        method: "POST",
        body: {
            instanceName: name,
            qrcode: true,
            integration: "WHATSAPP-BAILEYS",
        },
        config,
    });
}

export async function fetchInstances(config?: EvolutionConfig) {
    return evoFetch<InstanceInfo[]>("/instance/fetchInstances", { config });
}

export async function deleteInstance(name: string, config?: EvolutionConfig) {
    return evoFetch<unknown>(`/instance/delete/${name}`, { method: "DELETE", config });
}

// ─── Connection / QR Code ───

export interface ConnectResponse {
    pairingCode?: string;
    code?: string;
    base64?: string;
    count?: number;
}

export async function connectInstance(name: string, config?: EvolutionConfig) {
    return evoFetch<ConnectResponse>(`/instance/connect/${name}`, { config });
}

export interface ConnectionState {
    instance: string;
    state: "open" | "close" | "connecting";
}

export async function getConnectionState(name: string, config?: EvolutionConfig) {
    return evoFetch<ConnectionState>(`/instance/connectionState/${name}`, { config });
}

// ─── Settings ───

export interface InstanceSettings {
    rejectCall?: boolean;
    msgCall?: string;
    groupsIgnore?: boolean;
    alwaysOnline?: boolean;
    readMessages?: boolean;
    readStatus?: boolean;
    syncFullHistory?: boolean;
}

export async function setSettings(name: string, settings: InstanceSettings, config?: EvolutionConfig) {
    return evoFetch<unknown>(`/settings/set/${name}`, {
        method: "POST",
        body: settings,
        config,
    });
}

export async function getSettings(name: string, config?: EvolutionConfig) {
    return evoFetch<InstanceSettings>(`/settings/find/${name}`, { config });
}

// ─── Groups ───

export interface EvolutionGroup {
    id: string;
    subject: string;
    subjectOwner?: string;
    subjectTime?: number;
    size?: number;
    creation?: number;
    desc?: string;
}

export async function fetchGroups(name: string, config?: EvolutionConfig) {
    return evoFetch<EvolutionGroup[]>(`/group/fetchAllGroups/${name}`, {
        method: "GET",
        config,
    });
}

// ─── Messages ───

export async function sendTextMessage(instanceName: string, number: string, text: string, config?: EvolutionConfig) {
    return evoFetch<unknown>(`/message/sendText/${instanceName}`, {
        method: "POST",
        body: {
            number,
            text,
            delay: 1200,
            linkPreview: true,
        },
        config,
    });
}

// ─── Webhook ───

export async function setWebhook(name: string, webhookUrl: string, events: string[], config?: EvolutionConfig) {
    return evoFetch<unknown>(`/webhook/set/${name}`, {
        method: "POST",
        body: {
            url: webhookUrl,
            webhook_by_events: true,
            webhook_base64: false,
            events,
        },
        config,
    });
}
