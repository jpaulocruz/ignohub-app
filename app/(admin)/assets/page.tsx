"use client";

import React, { useState, useEffect, useCallback, useRef, ReactNode, ReactElement, cloneElement } from "react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import {
    Smartphone,
    QrCode,
    Shield,
    Send,
    Bot,
    Brain,
    Plus,
    Trash2,
    Power,
    Copy,
    Check,
    X,
    Eye,
    EyeOff,
    AlertTriangle,
    Activity,
    RefreshCw,
    Globe,
    Settings,
    ArrowLeft,
    Info,
    Save,
    Star,
    MessageSquare,
    Lightbulb,
    ArrowUpRight,
    Trash
} from "lucide-react";
import {
    getOutboundMeta,
    getCollectionInstances,
    getAgentPresets,
    getLoadStats,
    getTokenUsageStats,
    saveWhatsAppConfig,
    deleteWhatsAppConfig,
    toggleWhatsAppStatus,
    saveCollectionInstance,
    deleteCollectionInstance,
    toggleCollectionStatus,
    saveAgentPreset,
    togglePresetStatus,
    createEvolutionInstance,
    connectEvolutionInstance,
    getEvolutionConnectionState,
    syncEvolutionInstances,
    deleteEvolutionInstance,
    fetchEvolutionGroups,
    getEvolutionConfig,
    saveEvolutionConfig,
    testEvolutionConnection,
    getAISettings,
    saveAISetting,
    getWhatsAppTemplates,
    saveWhatsAppTemplate,
    deleteWhatsAppTemplate,
    syncMetaTemplates,
    getGlobalTemplateSettings,
    setSystemBot
} from "./actions";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

type TabId = "collection" | "official" | "telegram" | "monitor" | "messages" | "prompts";

interface TabItem {
    id: TabId;
    label: string;
    icon: ReactNode;
    activeColor: string;
    activeBg: string;
}

interface TabGroup {
    title: string;
    items: TabItem[];
}

const TAB_GROUPS: TabGroup[] = [
    {
        title: "Channels",
        items: [
            { id: "collection", label: "WhatsApp Collection", icon: <QrCode className="h-4 w-4" />, activeColor: "text-green-600 dark:text-green-400", activeBg: "bg-green-100 dark:bg-green-900/30" },
            { id: "official", label: "WhatsApp Official", icon: <Send className="h-4 w-4" />, activeColor: "text-green-600 dark:text-green-400", activeBg: "bg-green-100 dark:bg-green-900/30" },
            { id: "telegram", label: "Telegram Unit", icon: <Bot className="h-4 w-4" />, activeColor: "text-sky-600 dark:text-sky-400", activeBg: "bg-sky-100 dark:bg-sky-900/30" },
        ],
    },
    {
        title: "Intelligence",
        items: [
            { id: "messages", label: "Message Protocol", icon: <MessageSquare className="h-4 w-4" />, activeColor: "text-primary", activeBg: "bg-primary/10" },
            { id: "prompts", label: "Neural Prompts", icon: <Brain className="h-4 w-4" />, activeColor: "text-amber-600 dark:text-amber-400", activeBg: "bg-amber-100 dark:bg-amber-900/30" },
            { id: "monitor", label: "Intelligence Monitor", icon: <Activity className="h-4 w-4" />, activeColor: "text-primary", activeBg: "bg-primary/10" },
        ],
    },
];

export default function AdminAssetsPage() {
    const [activeTab, setActiveTab] = useState<TabId>("collection");
    const [outboundMeta, setOutboundMeta] = useState<any[]>([]);
    const [instances, setInstances] = useState<any[]>([]);
    const [presets, setPresets] = useState<any[]>([]);
    const [templates, setTemplates] = useState<any[]>([]);
    const [tokenUsage, setTokenUsage] = useState<any[]>([]);
    const [aiSettings, setAiSettings] = useState<Record<string, string>>({});
    const [globalTemplateSettings, setGlobalTemplateSettings] = useState<Record<string, string>>({});
    const [loadStats, setLoadStats] = useState<{ presetCounts: Record<string, number>; platformCounts: Record<string, number> }>({ presetCounts: {}, platformCounts: {} });
    const [loading, setLoading] = useState(true);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [meta, inst, pres, stats, usage, ai, tmpls, gTmpls] = await Promise.all([
                getOutboundMeta(),
                getCollectionInstances(),
                getAgentPresets(),
                getLoadStats(),
                getTokenUsageStats(),
                getAISettings(),
                getWhatsAppTemplates(),
                getGlobalTemplateSettings(),
            ]);
            setOutboundMeta(meta);
            setInstances(inst);
            setPresets(pres);
            setLoadStats(stats);
            setTokenUsage(usage);
            setAiSettings(ai);
            setTemplates(tmpls);
            setGlobalTemplateSettings(gTmpls);
        } catch (e) {
            console.error("Failed to fetch assets:", e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const evolutionInstances = instances.filter((i) => i.provider === "evolution");
    const telegramInstances = instances.filter((i) => i.provider === "telegram");

    return (
        <div className="space-y-6 pb-12">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Asset registry</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Manage ingestion channels, delivery credentials, and AI consumption metrics.
                </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-10">
                {/* Section Navigation */}
                <aside className="lg:w-56 shrink-0">
                    <PremiumCard className="p-2 space-y-1">
                        {TAB_GROUPS.map((group, gi) => (
                            <div key={group.title}>
                                {gi > 0 && <Separator className="my-2" />}
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-3 pt-2 pb-1.5">
                                    {group.title}
                                </p>
                                {group.items.map((tab) => {
                                    const isActive = activeTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={cn(
                                                "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-all cursor-pointer",
                                                isActive
                                                    ? "bg-primary/5 dark:bg-primary/10 border-l-2 border-primary text-foreground font-semibold"
                                                    : "border-l-2 border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/50"
                                            )}
                                        >
                                            <div className={cn(
                                                "flex items-center justify-center h-7 w-7 rounded-md shrink-0 transition-colors",
                                                isActive ? cn(tab.activeBg, tab.activeColor) : "bg-muted text-muted-foreground"
                                            )}>
                                                {tab.icon}
                                            </div>
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </div>
                        ))}
                    </PremiumCard>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 min-w-0">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {loading ? (
                                <LoadingSkeleton />
                            ) : (
                                <div className="space-y-6">
                                    {activeTab === "collection" && (
                                        <CollectionTab instances={evolutionInstances} loadStats={loadStats} onRefresh={fetchAll} />
                                    )}
                                    {activeTab === "official" && (
                                        <OfficialTab configs={outboundMeta} loadStats={loadStats} onRefresh={fetchAll} />
                                    )}
                                    {activeTab === "telegram" && (
                                        <TelegramTab instances={telegramInstances} presets={presets} loadStats={loadStats} onRefresh={fetchAll} />
                                    )}
                                    {activeTab === "messages" && (
                                        <MessagesTab
                                            templates={templates}
                                            globalTemplateSettings={globalTemplateSettings}
                                            onRefresh={fetchAll}
                                        />
                                    )}
                                    {activeTab === "monitor" && (
                                        <MonitorTab usage={tokenUsage} aiSettings={aiSettings} onRefresh={fetchAll} />
                                    )}
                                    {activeTab === "prompts" && (
                                        <PromptsTab aiSettings={aiSettings} onRefresh={fetchAll} />
                                    )}
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
}

// ─── Loading Skeleton ───

function LoadingSkeleton() {
    return (
        <div className="space-y-4">
            {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />
            ))}
        </div>
    );
}

// ─── Tab 1: WhatsApp Collection (Evolution) ───

function CollectionTab({ instances, loadStats, onRefresh }: { instances: any[]; loadStats: any; onRefresh: () => void }) {
    const [showNewForm, setShowNewForm] = useState(false);
    const [qrModal, setQrModal] = useState<{ open: boolean; qr?: string | null; name?: string; dbId?: string; state?: string; loading?: boolean; error?: string }>({ open: false });
    const [newName, setNewName] = useState("");
    const [saving, setSaving] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const pollingRef = useRef<NodeJS.Timeout | null>(null);

    // Cleanup polling on unmount
    useEffect(() => {
        return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
    }, []);

    const handleOpenQr = async (inst: any) => {
        setQrModal({ open: true, name: inst.instance_name, dbId: inst.id, state: inst.status, loading: true });

        // Start polling immediately for status updates
        startPolling(inst.instance_name, inst.id);

        try {
            // Fetch fresh QR code
            const res = await connectEvolutionInstance(inst.instance_name, inst.id);
            if (res.success && res.qr) {
                setQrModal(prev => ({ ...prev, qr: res.qr, loading: false }));
            } else {
                setQrModal(prev => ({
                    ...prev,
                    loading: false,
                    error: "Não foi possível obter o QR Code. Verifique se a instância está conectada."
                }));
            }
        } catch (e) {
            setQrModal(prev => ({
                ...prev,
                loading: false,
                error: "Erro ao conectar com a API."
            }));
        }
    };

    const handleCreate = async () => {
        if (!newName.trim()) return;
        setSaving(true);
        setError(null);
        try {
            const result = await createEvolutionInstance(newName.trim());
            setNewName("");
            setShowNewForm(false);
            onRefresh();

            // Open QR modal if we got a QR from creation
            if (result.qr) {
                setQrModal({ open: true, qr: result.qr, name: newName, dbId: result.instance?.id, state: "qr_ready" });
                startPolling(newName.trim(), result.instance?.id);
            }
        } catch (e: any) {
            setError(e.message || "Falha ao criar instância");
        } finally {
            setSaving(false);
        }
    };

    const handleConnect = async (inst: any) => {
        setError(null);
        try {
            const result = await connectEvolutionInstance(inst.instance_name, inst.id);
            if (result.qr) {
                setQrModal({ open: true, qr: result.qr, name: inst.instance_name, dbId: inst.id, state: "qr_ready" });
                startPolling(inst.instance_name, inst.id);
            } else {
                setError("QR Code não disponível. A instância pode já estar conectada.");
                onRefresh();
            }
        } catch (e: any) {
            setError(e.message || "Falha ao gerar QR Code");
        }
    };

    const startPolling = (name: string, dbId: string) => {
        if (pollingRef.current) clearInterval(pollingRef.current);

        pollingRef.current = setInterval(async () => {
            try {
                const result = await getEvolutionConnectionState(name, dbId);
                if (result.state === "open") {
                    if (pollingRef.current) clearInterval(pollingRef.current);
                    setQrModal(prev => ({ ...prev, state: "open" }));
                    onRefresh();
                } else if (result.state === "connecting") {
                    setQrModal(prev => ({ ...prev, state: "connecting" }));
                }
            } catch {
                // silently retry
            }
        }, 5000);
    };

    const handleCloseQrModal = () => {
        if (pollingRef.current) clearInterval(pollingRef.current);
        setQrModal({ open: false });
        onRefresh();
    };

    const handleSync = async () => {
        setSyncing(true);
        setError(null);
        try {
            const result = await syncEvolutionInstances();
            onRefresh();
        } catch (e: any) {
            setError(e.message || "Falha ao sincronizar");
        } finally {
            setSyncing(false);
        }
    };

    const handleDelete = async (inst: any) => {
        if (!confirm(`Remover instância "${inst.instance_name}"? Isso a desconecta da Evolution API também.`)) return;
        try {
            await deleteEvolutionInstance(inst.id, inst.instance_name);
            onRefresh();
        } catch (e: any) {
            setError(e.message || "Falha ao remover");
        }
    };

    const handleToggle = async (id: string, active: boolean) => {
        await toggleCollectionStatus(id, active);
        onRefresh();
    };

    const [configStatus, setConfigStatus] = useState<"loading" | "missing" | "configured">("loading");
    const [configForm, setConfigForm] = useState({ url: "", apiKey: "" });
    const [editingConfig, setEditingConfig] = useState(false);
    const [maskedKey, setMaskedKey] = useState("");
    const [connTest, setConnTest] = useState<{ status: "idle" | "testing" | "success" | "error"; message: string }>({ status: "idle", message: "" });

    // Check configuration on mount
    const checkConfig = useCallback(async () => {
        try {
            const config = await getEvolutionConfig();
            if (config?.instance_url && config?.api_key) {
                setConfigStatus("configured");
                setConfigForm({ url: config.instance_url, apiKey: config.api_key });
                setMaskedKey(config.api_key);
            } else {
                setConfigStatus("missing");
            }
        } catch (e) {
            console.error(e);
            setConfigStatus("missing");
        }
    }, []);

    const handleTestConnection = async () => {
        setConnTest({ status: "testing", message: "Verificando conexão..." });
        try {
            const res = await testEvolutionConnection();
            if (res.success) {
                setConnTest({ status: "success", message: `Conexão OK! ${res.count} instâncias (${res.duration}ms)` });
                setTimeout(() => setConnTest({ status: "idle", message: "" }), 5000);
            } else {
                setConnTest({ status: "error", message: res.error || "Falha na conexão" });
            }
        } catch (e: any) {
            setConnTest({ status: "error", message: e.message });
        }
    };

    useEffect(() => {
        checkConfig();
    }, [checkConfig]);

    const handleSaveConfig = async () => {
        if (!configForm.url.trim() || !configForm.apiKey.trim()) return;
        setSaving(true);
        setError(null);
        try {
            // Remove trailing slash from URL
            const cleanUrl = configForm.url.trim().replace(/\/$/, "");
            await saveEvolutionConfig(cleanUrl, configForm.apiKey.trim());

            await checkConfig();
            setEditingConfig(false);
            onRefresh(); // Refresh instances with new config
        } catch (e: any) {
            setError(e.message || "Falha ao salvar configuração");
        } finally {
            setSaving(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "open": return { bg: "bg-green-500/10", text: "text-green-500", border: "border-green-500/20", label: "Operational" };
            case "connecting": return { bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/20", label: "Syncing..." };
            case "qr_ready": return { bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/20", label: "Pending Auth" };
            default: return { bg: "bg-red-500/10", text: "text-red-500", border: "border-red-500/20", label: "Dormant" };
        }
    };

    if (configStatus === "loading") {
        return (
            <div className="flex items-center justify-center p-12">
                <RefreshCw className="h-6 w-6 text-green-500 animate-spin" />
            </div>
        );
    }

    if (configStatus === "missing" || editingConfig) {
        return (
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-center gap-3 mb-6">
                    <button
                        onClick={() => setEditingConfig(false)}
                        disabled={configStatus === "missing"}
                        className={`p-2 hover:bg-background/80 rounded-lg transition-colors border border-card-border ${configStatus === "missing" ? "hidden" : ""}`}
                    >
                        <ArrowLeft className="h-5 w-5 text-text-muted hover:text-foreground" />
                    </button>
                    <h2 className="text-xl font-bold text-foreground">Configuração Evolution API</h2>
                </div>

                <PremiumCard className="p-8 space-y-6">
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3">
                        <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <p className="text-sm text-blue-300 font-medium">Credenciais Necessárias</p>
                            <p className="text-xs text-blue-400/80">
                                Insira a URL e a API Key da sua instância Evolution API. Esses dados são necessários para gerenciar suas conexões do WhatsApp.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-muted">URL da API</label>
                            <div className="relative">
                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
                                <input
                                    type="text"
                                    value={configForm.url}
                                    onChange={(e) => setConfigForm(prev => ({ ...prev, url: e.target.value }))}
                                    placeholder="https://api.seudominio.com"
                                    className="w-full bg-background border border-card-border rounded-xl pl-10 pr-4 py-3 text-foreground placeholder:text-text-muted focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/50 transition-all outline-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-muted">Global API Key</label>
                            <div className="relative">
                                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
                                <input
                                    type="text"
                                    value={configForm.apiKey}
                                    onChange={(e) => setConfigForm(prev => ({ ...prev, apiKey: e.target.value }))}
                                    placeholder="Ex: 44299384-..."
                                    className="w-full bg-background border border-card-border rounded-xl pl-10 pr-4 py-3 text-foreground placeholder:text-text-muted focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/50 transition-all outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Connection Test Feedback */}
                    {connTest.message && (
                        <div className={`p-3 rounded-xl flex items-center gap-2 text-sm ${connTest.status === "success" ? "bg-green-500/10 text-green-500" : connTest.status === "error" ? "bg-red-500/10 text-red-500" : "bg-blue-500/10 text-blue-500"}`}>
                            {connTest.status === "testing" && <RefreshCw className="h-4 w-4 animate-spin" />}
                            {connTest.status === "success" && <Check className="h-4 w-4" />}
                            {connTest.status === "error" && <AlertTriangle className="h-4 w-4" />}
                            {connTest.message}
                        </div>
                    )}

                    <div className="flex justify-end pt-4 gap-3">
                        <button
                            onClick={handleTestConnection}
                            disabled={connTest.status === "testing" || !configForm.url || !configForm.apiKey}
                            className="bg-background border border-card-border hover:bg-background/80 text-foreground font-medium py-2.5 px-6 rounded-lg transition-all disabled:opacity-50 cursor-pointer"
                        >
                            Testar Conexão
                        </button>
                        <button
                            onClick={handleSaveConfig}
                            disabled={saving || !configForm.url || !configForm.apiKey}
                            className="bg-brand-500 hover:bg-brand-600 text-white font-medium py-2.5 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {saving ? "Salvando..." : "Salvar Configuração"}
                        </button>
                    </div>
                </PremiumCard>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Error Banner */}
            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
                        <p className="text-sm text-red-400">{error}</p>
                    </div>
                    <button onClick={() => setError(null)} className="p-1 hover:bg-white/5 rounded-lg cursor-pointer">
                        <X className="h-4 w-4 text-red-400" />
                    </button>
                </div>
            )}

            {/* Header / Actions Row */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                {/* Stats Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1 w-full">
                    <StatCard icon={<QrCode />} color="green" label="Instâncias Evolution" value={instances.length} sub="configuradas" />
                    <StatCard icon={<Smartphone />} color="green" label="Conectadas" value={instances.filter(i => i.status === "open").length} sub={`de ${instances.length}`} />
                    <StatCard icon={<Activity />} color="green" label="Grupos WhatsApp" value={loadStats.platformCounts?.whatsapp || 0} sub="coletando mensagens" />
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {connTest.message && connTest.status !== "idle" && (
                        <div className={`px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-semibold ${connTest.status === "success" ? "bg-green-500/10 text-green-600 dark:text-green-500" : connTest.status === "error" ? "bg-red-500/10 text-red-600 dark:text-red-500" : "bg-blue-500/10 text-blue-600 dark:text-blue-500"}`}>
                            {connTest.status === "testing" && <RefreshCw className="h-3 w-3 animate-spin" />}
                            {connTest.message}
                        </div>
                    )}
                    <button
                        onClick={handleTestConnection}
                        disabled={connTest.status === "testing"}
                        className="p-2.5 bg-background hover:bg-background/80 text-text-muted hover:text-foreground rounded-lg border border-card-border transition-all cursor-pointer"
                        title="Testar Conexão API"
                    >
                        <Activity className={`h-4 w-4 ${connTest.status === "testing" ? "animate-pulse" : ""}`} />
                    </button>
                    <button
                        onClick={() => setEditingConfig(true)}
                        className="p-2.5 bg-background hover:bg-background/80 text-text-muted hover:text-foreground rounded-lg border border-card-border transition-all cursor-pointer"
                        title="Configurações da API"
                    >
                        <Settings className="h-4 w-4" />
                    </button>
                    <button
                        onClick={handleSync}
                        disabled={syncing}
                        className="flex items-center gap-2 px-4 py-2 bg-background hover:bg-background/80 text-sm font-medium text-text-muted hover:text-foreground rounded-lg border border-card-border transition-all cursor-pointer disabled:opacity-50"
                    >
                        <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
                        {syncing ? "Sincronizando..." : "Sincronizar"}
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {instances.map((inst) => {
                    const statusInfo = getStatusColor(inst.status);
                    return (
                        <PremiumCard key={inst.id} className="p-0 border border-white/5 rounded-sm overflow-hidden bg-navy-950/20 group">
                            <div className="p-6 flex items-center justify-between gap-6 bg-transparent border-l-2 border-l-brand-500 hover:bg-white/5 transition-all">
                                <div className="flex items-center gap-5 min-w-0">
                                    <div className={cn(
                                        "h-10 w-10 rounded-sm flex items-center justify-center border",
                                        statusInfo.bg, statusInfo.border
                                    )}>
                                        <QrCode className={cn("h-5 w-5", statusInfo.text)} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[13px] font-black text-white uppercase tracking-widest truncate">{inst.instance_name}</p>
                                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                            {/* Connection State Badge */}
                                            <div className={cn("flex items-center gap-2 px-3 py-1 rounded-none border", statusInfo.bg, statusInfo.border)}>
                                                <div className={cn("h-1.5 w-1.5 bg-current", inst.status === "open" ? "animate-pulse" : "")} />
                                                <span className={cn("text-[9px] font-black uppercase tracking-[0.2em]", statusInfo.text)}>{statusInfo.label}</span>
                                            </div>
                                            <span className="text-[9px] font-black text-secondary-gray-500 bg-navy-950/40 border border-white/5 px-2 py-1 rounded-none uppercase tracking-widest">
                                                {inst.groups_count ?? 0} Unit{(inst.groups_count ?? 0) !== 1 ? "s" : ""} Synced
                                            </span>
                                            {inst.instance_key && (
                                                <span className="text-[9px] font-black text-secondary-gray-600 bg-navy-950/40 border border-white/5 px-2 py-1 rounded-none font-mono tracking-tight uppercase">
                                                    ID: {inst.instance_key.slice(0, 12)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2.5 shrink-0">
                                    {/* Connect / Generate QR */}
                                    {inst.status !== "open" && (
                                        <button
                                            onClick={() => handleConnect(inst)}
                                            className="p-3 rounded-sm border border-green-500/20 bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors cursor-pointer"
                                            title="Protocol Link (QR)"
                                        >
                                            <QrCode className="h-4 w-4" />
                                        </button>
                                    )}
                                    {/* View existing QR */}
                                    {inst.qr_code_base64 && inst.status !== "open" && (
                                        <button
                                            onClick={() => handleOpenQr(inst)}
                                            className="p-3 rounded-sm border border-blue-500/20 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors cursor-pointer"
                                            title="Inspect QR"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </button>
                                    )}
                                    <button
                                        onClick={async () => {
                                            await setSystemBot(inst.id, "admin_collection_instances");
                                            onRefresh();
                                        }}
                                        className={cn(
                                            "p-3 rounded-sm border transition-all cursor-pointer",
                                            inst.is_system_bot ? "bg-brand-500/10 text-brand-500 border-brand-500/30" : "bg-navy-950 border-white/5 text-secondary-gray-600 hover:text-brand-500 hover:border-brand-500/30"
                                        )}
                                        title={inst.is_system_bot ? "System Core Active" : "Map to System Core"}
                                    >
                                        <Star className={cn("h-4 w-4", inst.is_system_bot ? "fill-current" : "")} />
                                    </button>
                                    <button
                                        onClick={() => handleToggle(inst.id, inst.is_active)}
                                        className={cn(
                                            "p-3 rounded-sm border transition-all cursor-pointer",
                                            inst.is_active ? "bg-green-500/5 border-green-500/20 text-green-500 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-500" : "bg-red-500/5 border-red-500/20 text-red-500 hover:bg-green-500/10 hover:border-green-500/20 hover:text-green-500"
                                        )}
                                        title={inst.is_active ? "Terminate Protocol" : "Initialize Protocol"}
                                    >
                                        <Power className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(inst)}
                                        className="p-3 rounded-sm border border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500/20 transition-colors cursor-pointer"
                                        title="Purge Identity"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </PremiumCard>
                    );
                })}
            </div>

            {/* New Instance Form */}
            {showNewForm ? (
                <PremiumCard className="p-8 border-2 border-dashed border-green-500/30 bg-green-500/5 rounded-none">
                    <h3 className="text-xl font-black text-white mb-4 flex items-center gap-3 uppercase tracking-tighter">
                        <Plus className="h-6 w-6 text-green-500" /> New Registry Unit
                    </h3>
                    <p className="text-[11px] font-medium text-secondary-gray-500 mb-6 uppercase tracking-widest bg-navy-950/40 p-3 border border-white/5">
                        Initialize a sovereign ingestion channel. Automated group message synchronization protocol will be applied on discovery.
                    </p>
                    <div className="space-y-4">
                        <label className="text-[9px] font-black text-secondary-gray-600 uppercase tracking-[0.2em] px-1">Unit Identity (Lowercase / Kebab Only)</label>
                        <input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="ex: unit-alpha-registry"
                            className="w-full max-w-md bg-navy-950 border border-white/5 rounded-none px-4 py-4 text-[13px] font-black text-white tracking-widest placeholder:text-secondary-gray-800 focus:border-green-500/50 outline-none transition-all"
                            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                        />
                    </div>
                    <div className="flex items-center gap-4 mt-8">
                        <button
                            onClick={handleCreate}
                            disabled={saving || !newName.trim()}
                            className="px-8 py-4 bg-green-500 hover:bg-green-600 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-none transition-all disabled:opacity-50 cursor-pointer flex items-center gap-3"
                        >
                            {saving ? (
                                <><RefreshCw className="h-4 w-4 animate-spin" /> Synchronizing...</>
                            ) : (
                                <><Plus className="h-4 w-4" /> Initialize Unit</>
                            )}
                        </button>
                        <button
                            onClick={() => { setShowNewForm(false); setError(null); }}
                            className="px-8 py-4 bg-navy-950 border border-white/5 hover:bg-white/5 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-none transition-all cursor-pointer"
                        >
                            Abort
                        </button>
                    </div>
                </PremiumCard>
            ) : (
                <button
                    onClick={() => setShowNewForm(true)}
                    className="w-full p-8 border border-dashed border-white/5 rounded-none hover:border-green-500/30 transition-all group cursor-pointer bg-navy-950/20"
                >
                    <div className="flex items-center justify-center gap-4 text-secondary-gray-600 group-hover:text-green-500 transition-colors">
                        <Plus className="h-6 w-6" />
                        <span className="text-[11px] font-black uppercase tracking-[0.3em]">Initialize New Unit Channel</span>
                    </div>
                </button>
            )}

            {/* QR Code Modal with Auto-Polling */}
            <AnimatePresence>
                {qrModal.open && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={handleCloseQrModal}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-background border border-card-border rounded-2xl p-8 max-w-sm w-full shadow-lg"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-foreground">QR Code</h3>
                                <button onClick={handleCloseQrModal} className="p-2 rounded-lg hover:bg-card-hover transition-colors cursor-pointer text-text-muted hover:text-foreground">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <p className="text-sm font-medium text-text-muted mb-4">{qrModal.name}</p>

                            {qrModal.state === "open" ? (
                                <div className="text-center py-8">
                                    <div className="h-16 w-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
                                        <Check className="h-8 w-8 text-green-500" />
                                    </div>
                                    <p className="text-lg font-bold text-green-600 dark:text-green-500">Conectado!</p>
                                    <p className="text-sm text-text-muted mt-2">WhatsApp vinculado com sucesso.</p>
                                    <p className="text-xs text-text-muted mt-1">Mensagens de grupos estão sendo coletadas.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="bg-white rounded-xl p-6 flex items-center justify-center min-h-[250px] border border-gray-200">
                                        {qrModal.loading ? (
                                            <div className="py-8 text-center">
                                                <RefreshCw className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-3" />
                                                <p className="text-gray-600 font-medium text-sm">Gerando novo QR Code...</p>
                                            </div>
                                        ) : qrModal.error ? (
                                            <div className="text-center py-8">
                                                <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-3" />
                                                <p className="text-red-600 font-medium text-sm">{qrModal.error}</p>
                                                <button
                                                    onClick={() => qrModal.name && qrModal.dbId && handleOpenQr({ instance_name: qrModal.name, id: qrModal.dbId, status: qrModal.state })}
                                                    className="mt-4 px-4 py-2 bg-background border border-card-border text-foreground text-sm font-medium rounded-lg hover:bg-card-hover transition-colors cursor-pointer"
                                                >
                                                    Tentar Novamente
                                                </button>
                                            </div>
                                        ) : qrModal.qr ? (
                                            <img src={qrModal.qr.startsWith("data:") ? qrModal.qr : `data:image/png;base64,${qrModal.qr}`} alt="QR Code" className="w-full h-auto rounded-lg" />
                                        ) : (
                                            <div className="py-8 text-center">
                                                <p className="text-gray-500 text-sm">Nenhum QR Code disponível.</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-center gap-2 mt-4">
                                        <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                                        <p className="text-xs text-text-muted">
                                            Aguardando escaneamento... (verificando a cada 5s)
                                        </p>
                                    </div>

                                    <p className="text-xs text-text-muted text-center mt-2">
                                        Abra o WhatsApp → Menu → Aparelhos conectados → Conectar
                                    </p>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Info Card */}
            <PremiumCard className="p-5 bg-green-500/5 border border-green-500/10">
                <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center border border-green-500/20 shrink-0 mt-0.5">
                        <Shield className="h-5 w-5 text-green-600 dark:text-green-500" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-foreground">Configuração Automática</p>
                        <p className="text-xs text-text-muted mt-1 leading-relaxed">
                            Ao criar uma instância, as seguintes configurações são aplicadas automaticamente:
                            <strong className="text-green-600 dark:text-green-500 font-medium"> groupsIgnore: false</strong> (mensagens de grupo ativadas),
                            <strong className="text-amber-600 dark:text-amber-500 font-medium"> rejectCall: true</strong>,
                            <strong className="text-foreground font-medium"> alwaysOnline: true</strong>.
                        </p>
                    </div>
                </div>
            </PremiumCard>
        </div>
    );
}

// ─── Tab 2: WhatsApp Official (Meta) ───

function OfficialTab({ configs, loadStats, onRefresh }: { configs: any[]; loadStats: any; onRefresh: () => void }) {
    const [showNew, setShowNew] = useState(false);
    const whatsappGroupCount = loadStats.platformCounts?.whatsapp || 0;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <StatCard icon={<Shield />} color="emerald" label="Números Meta API" value={configs.length} sub="configurados" />
                <StatCard icon={<Send />} color="emerald" label="Disparos Ativos" value={whatsappGroupCount} sub="grupos recebendo alertas" />
            </div>

            {configs.map((config) => (
                <OutboundMetaCard key={config.id} config={config} groupCount={whatsappGroupCount} onRefresh={onRefresh} />
            ))}

            {showNew ? (
                <OutboundMetaCard config={null} isNew groupCount={0} onRefresh={() => { onRefresh(); setShowNew(false); }} onCancel={() => setShowNew(false)} />
            ) : (
                <button
                    onClick={() => setShowNew(true)}
                    className="w-full p-8 border border-dashed border-white/5 rounded-none hover:border-emerald-500/30 transition-all group cursor-pointer bg-navy-950/20"
                >
                    <div className="flex items-center justify-center gap-4 text-secondary-gray-600 group-hover:text-emerald-500 transition-colors">
                        <Plus className="h-6 w-6" />
                        <span className="text-[11px] font-black uppercase tracking-[0.3em]">Authorize New Meta Protocol</span>
                    </div>
                </button>
            )}
        </div>
    );
}

function OutboundMetaCard({ config, isNew, groupCount, onRefresh, onCancel }: {
    config: any; isNew?: boolean; groupCount: number; onRefresh: () => void; onCancel?: () => void;
}) {
    const [form, setForm] = useState({
        phone_number_id: config?.phone_number_id || "",
        waba_id: config?.waba_id || "",
        access_token: config?.access_token_encrypted || "",
        display_number: config?.display_number || "",
        verify_token: config?.verify_token || "",
    });
    const [showToken, setShowToken] = useState(false);
    const [saving, setSaving] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            await saveWhatsAppConfig({ id: config?.id, ...form });
            onRefresh();
        } catch (e) { console.error(e); }
        finally { setSaving(false); }
    };

    const handleDelete = async () => {
        if (!config?.id || !confirm("Remover esta configuração?")) return;
        await deleteWhatsAppConfig(config.id);
        onRefresh();
    };

    const handleToggle = async () => {
        if (!config?.id) return;
        await toggleWhatsAppStatus(config.id, config.is_active);
        onRefresh();
    };

    const copyVerifyToken = () => {
        navigator.clipboard.writeText(form.verify_token);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <PremiumCard className={`p-5 bg-card hover:border-brand-300 transition-all ${isNew ? "border-2 border-dashed border-emerald-200" : "border border-border"}`}>
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-sm bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                        <Shield className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div>
                        <h3 className="text-[13px] font-black text-white uppercase tracking-widest leading-none">
                            {isNew ? "New Meta Protocol" : (config.display_number || config.phone_number_id)}
                        </h3>
                        <div className="flex items-center gap-3 mt-2">
                            {!isNew && <StatusBadge active={config.is_active} />}
                            {!isNew && (
                                <span className="text-[9px] font-black text-secondary-gray-600 uppercase tracking-widest bg-navy-950/40 px-2 py-1 rounded-none border border-white/5">
                                    {groupCount} Unit Syncs
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                {!isNew && (
                    <div className="flex items-center gap-2.5">
                        <button
                            onClick={async () => {
                                if (!config?.id) return;
                                await setSystemBot(config.id, "admin_outbound_meta");
                                onRefresh();
                            }}
                            className={cn(
                                "p-3 rounded-sm border transition-all cursor-pointer",
                                config?.is_system_bot ? "bg-brand-500/10 text-brand-500 border-brand-500/30" : "bg-navy-950 border-white/5 text-secondary-gray-600 hover:text-brand-500 hover:border-brand-500/30"
                            )}
                            title={config?.is_system_bot ? "System Core Active" : "Map to System Core"}
                        >
                            <Star className={cn("h-4 w-4", config?.is_system_bot ? "fill-current" : "")} />
                        </button>
                        <button onClick={handleToggle} className={cn(
                            "p-3 rounded-sm border transition-all cursor-pointer",
                            config.is_active ? "bg-green-500/10 border-green-500/20 text-green-500 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-500" : "bg-red-500/10 border-red-500/20 text-red-500 hover:bg-green-500/10 hover:border-green-500/20 hover:text-green-500"
                        )}>
                            <Power className="h-4 w-4" />
                        </button>
                        <button onClick={handleDelete} className="p-3 rounded-sm bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-all cursor-pointer">
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <InputField label="Phone Number ID" value={form.phone_number_id} onChange={(v) => setForm({ ...form, phone_number_id: v })} placeholder="123456789" />
                <InputField label="WABA ID" value={form.waba_id} onChange={(v) => setForm({ ...form, waba_id: v })} placeholder="1234567890" />
                <InputField label="Display Number" value={form.display_number} onChange={(v) => setForm({ ...form, display_number: v })} placeholder="+55 11 99999-0000" />
                <div>
                    <label className="text-[9px] font-black text-secondary-gray-600 uppercase tracking-[0.2em] px-1 mb-2 block">Cryptographic Access Token</label>
                    <div className="relative">
                        <input
                            type={showToken ? "text" : "password"}
                            value={form.access_token}
                            onChange={(e) => setForm({ ...form, access_token: e.target.value })}
                            placeholder="EAAxxxxxxx..."
                            className="w-full bg-navy-950/40 border border-white/5 rounded-none px-4 py-4 pr-12 text-[13px] font-black text-white tracking-widest placeholder:text-secondary-gray-800 focus:border-brand-500/50 focus:outline-none transition-all font-mono"
                        />
                        <button onClick={() => setShowToken(!showToken)} className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-gray-600 hover:text-white cursor-pointer transition-colors p-2 rounded-sm hover:bg-white/5">
                            {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>
            </div>

            {config?.verify_token && (
                <div className="mt-8 flex items-center gap-6 p-6 bg-navy-950/40 border border-white/5 rounded-none group">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black text-secondary-gray-700 uppercase tracking-[0.2em] mb-2">Protocol Verify Token</span>
                        <code className="text-[13px] text-brand-500 font-mono font-black tracking-tight truncate max-w-sm uppercase">{config.verify_token}</code>
                    </div>
                    <button onClick={copyVerifyToken} className="ml-auto p-3 rounded-none hover:bg-brand-500/10 text-secondary-gray-600 hover:text-brand-500 transition-all cursor-pointer border border-transparent hover:border-brand-500/20">
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                </div>
            )}

            <div className="flex items-center gap-4 mt-10 pt-8 border-t border-white/5">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 sm:flex-none px-10 py-4 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-none transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-3"
                >
                    {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {saving ? "Synchronizing..." : "Authorize Registry"}
                </button>
                {isNew && onCancel && (
                    <button onClick={onCancel} className="px-10 py-4 bg-navy-950 border border-white/5 hover:bg-white/5 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-none transition-all cursor-pointer">
                        Abort
                    </button>
                )}
            </div>
        </PremiumCard>
    );
}

// ─── Tab 3: Telegram ───

function TelegramTab({ instances, presets, loadStats, onRefresh }: { instances: any[]; presets: any[]; loadStats: any; onRefresh: () => void }) {
    const [showNewBot, setShowNewBot] = useState(false);
    const [newBotName, setNewBotName] = useState("");
    const [newBotKey, setNewBotKey] = useState("");
    const [saving, setSaving] = useState(false);
    const telegramGroupCount = loadStats.platformCounts?.telegram || 0;

    const handleCreateBot = async () => {
        if (!newBotName.trim()) return;
        setSaving(true);
        try {
            await saveCollectionInstance({ provider: "telegram", instance_name: newBotName, instance_key: newBotKey || undefined });
            setNewBotName("");
            setNewBotKey("");
            setShowNewBot(false);
            onRefresh();
        } catch (e) { console.error(e); }
        finally { setSaving(false); }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard icon={<Bot />} color="blue" label="Bots Telegram" value={instances.length} sub="cadastrados" />
                <StatCard icon={<Globe />} color="blue" label="Grupos Ativos" value={telegramGroupCount} sub="monitorados" />
                <StatCard icon={<Activity />} color="blue" label="Presets Vinculados" value={presets.length} sub="configurados" />
            </div>

            {/* Existing Telegram Instances */}
            {instances.map((inst) => (
                <PremiumCard key={inst.id} className="p-0 border border-white/5 rounded-none overflow-hidden bg-navy-950/20 group">
                    <div className="p-6 flex items-center justify-between gap-6 border-l-2 border-l-blue-500 hover:bg-white/5 transition-all">
                        <div className="flex items-center gap-5 min-w-0">
                            <div className="h-12 w-12 rounded-sm bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0">
                                <Bot className="h-6 w-6 text-blue-500" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[13px] font-black text-white uppercase tracking-widest leading-none truncate">{inst.instance_name}</p>
                                <div className="flex items-center gap-3 mt-2.5">
                                    <StatusBadge active={inst.is_active} />
                                    <span className="text-[9px] font-black text-secondary-gray-600 uppercase tracking-widest bg-navy-950/40 px-2 py-1 border border-white/5">{inst.groups_count} Unit Syncs</span>
                                </div>
                                {inst.instance_key && (
                                    <p className="text-[10px] text-secondary-gray-700 font-mono mt-2 tracking-tight uppercase">Protocol: ••••{inst.instance_key.slice(-8)}</p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2.5 shrink-0">
                            <button
                                onClick={async () => { await toggleCollectionStatus(inst.id, inst.is_active); onRefresh(); }}
                                className={cn(
                                    "p-3 rounded-none border transition-all cursor-pointer",
                                    inst.is_active ? "bg-blue-500/10 border-blue-500/20 text-blue-500 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20" : "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-blue-500/10 hover:text-blue-500 hover:border-blue-500/20"
                                )}
                                title={inst.is_active ? "Dormant" : "Awaken"}
                            >
                                <Power className="h-4 w-4" />
                            </button>
                            <button
                                onClick={async () => { if (confirm("Purge Unit Identity?")) { await deleteCollectionInstance(inst.id); onRefresh(); } }}
                                className="p-3 rounded-none bg-red-500/5 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-all cursor-pointer"
                                title="Purge"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </PremiumCard>
            ))}

            {/* Agent Presets with Edit Option */}
            <div className="space-y-3">
                <h3 className="text-sm font-semibold text-text-muted tracking-wide">Presets do Sistema</h3>
                {presets.map((preset) => (
                    <PresetCard key={preset.id} preset={preset} onRefresh={onRefresh} />
                ))}
            </div>

            {/* New Telegram Bot */}
            {showNewBot ? (
                <PremiumCard className="p-8 border-2 border-dashed border-blue-500/30 bg-blue-500/5 rounded-none">
                    <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3 uppercase tracking-tighter">
                        <Plus className="h-6 w-6 text-blue-500" /> New Telegram Bot Instance
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField label="Bot Unit Identity" value={newBotName} onChange={setNewBotName} placeholder="ex: IgnoBot-Primary-Registry" />
                        <InputField label="Cryptographic Bot Token" value={newBotKey} onChange={setNewBotKey} placeholder="123456:ABC-DEF..." />
                    </div>
                    <div className="flex items-center gap-4 mt-8">
                        <button onClick={handleCreateBot} disabled={saving || !newBotName.trim()} className="px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-none transition-all disabled:opacity-50 cursor-pointer">
                            {saving ? "Synchronizing..." : "Initialize Bot Unit"}
                        </button>
                        <button onClick={() => setShowNewBot(false)} className="px-8 py-4 bg-navy-950 border border-white/5 hover:bg-white/5 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-none transition-all cursor-pointer">
                            Abort
                        </button>
                    </div>
                </PremiumCard>
            ) : (
                <button onClick={() => setShowNewBot(true)} className="w-full p-8 border border-dashed border-white/5 rounded-none hover:border-blue-500/30 transition-all group cursor-pointer bg-navy-950/20">
                    <div className="flex items-center justify-center gap-4 text-secondary-gray-600 group-hover:text-blue-500 transition-colors">
                        <Plus className="h-6 w-6" />
                        <span className="text-[11px] font-black uppercase tracking-[0.3em]">Initialize New Telegram Unit</span>
                    </div>
                </button>
            )}
        </div>
    );
}

function PresetCard({ preset, onRefresh }: { preset: any; onRefresh: () => void }) {
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({
        bot_link: preset.bot_link || "",
        telegram_bot_username: preset.telegram_bot_username || "",
        whatsapp_support_number: preset.whatsapp_support_number || "",
    });
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            await saveAgentPreset({
                id: preset.id,
                ...form
            });
            setEditing(false);
            onRefresh();
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    return (
        <PremiumCard className="p-0 border-l-2 border-l-brand-500 bg-navy-950/20 border-white/5 hover:bg-white/5 transition-all rounded-none overflow-hidden">
            {editing ? (
                <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <h4 className="text-[13px] font-black text-white uppercase tracking-widest leading-none">{preset.name}</h4>
                        <button onClick={() => setEditing(false)} className="p-2 hover:bg-white/5 rounded-none transition-colors text-secondary-gray-600 hover:text-white">
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <InputField
                        label="Unified Bot Link (t.me/)"
                        value={form.bot_link}
                        onChange={(v) => setForm({ ...form, bot_link: v })}
                        placeholder="https://t.me/UnitAlpha"
                    />
                    <div className="grid grid-cols-2 gap-6">
                        <InputField
                            label="Operational Alias (@)"
                            value={form.telegram_bot_username}
                            onChange={(v) => setForm({ ...form, telegram_bot_username: v })}
                            placeholder="UnitAlphaBot"
                        />
                        <InputField
                            label="WhatsApp Liaison"
                            value={form.whatsapp_support_number}
                            onChange={(v) => setForm({ ...form, whatsapp_support_number: v })}
                            placeholder="5511999999999"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-6 py-3 bg-brand-500 text-white text-[10px] font-black uppercase tracking-widest rounded-none hover:bg-brand-600 disabled:opacity-50 transition-all"
                        >
                            {saving ? "Synchronizing..." : "Update Protocol"}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="p-6 flex items-center justify-between gap-6">
                    <div className="min-w-0">
                        <div className="flex items-center gap-3">
                            <p className="text-[13px] font-black text-white uppercase tracking-widest leading-none">{preset.name}</p>
                            <button onClick={() => setEditing(true)} className="p-2 hover:bg-white/5 rounded-none cursor-pointer text-secondary-gray-600 hover:text-white transition-all">
                                <Settings className="h-4 w-4" />
                            </button>
                        </div>
                        {preset.bot_link ? (
                            <a href={preset.bot_link} target="_blank" rel="noreferrer" className="text-[10px] font-black text-brand-500 hover:text-brand-400 transition-colors flex items-center gap-2 mt-2 uppercase tracking-widest">
                                {preset.bot_link} <ArrowUpRight className="h-3 w-3" />
                            </a>
                        ) : (
                            <p className="text-[10px] font-black text-amber-500/60 mt-2 uppercase tracking-widest italic">Protocol Missing Link</p>
                        )}
                        {preset.telegram_bot_username && <p className="text-[10px] font-black text-secondary-gray-600 mt-1 uppercase tracking-widest">@{preset.telegram_bot_username}</p>}
                    </div>
                    <div className="flex items-center gap-6 shrink-0">
                        <div className="text-right hidden sm:block">
                            <p className="text-[9px] font-black text-secondary-gray-700 uppercase tracking-widest mb-1">Context Integrity</p>
                            <p className="text-[11px] font-black text-white uppercase tracking-tighter">{preset.preserve_context ? "Operational" : "Detached"}</p>
                        </div>
                        <StatusBadge active={preset.is_active} />
                    </div>
                </div>
            )}
        </PremiumCard>
    );
}

function MonitorTab({ usage, aiSettings, onRefresh }: { usage: any[]; aiSettings: Record<string, string>; onRefresh: () => void }) {
    const maxTokens = Math.max(...usage.map((u) => u.tokens), 1);

    const platformColors: Record<string, string> = {
        whatsapp: "bg-green-500",
        telegram: "bg-blue-500",
    };

    return (
        <div className="space-y-8">
            {/* Tokens Section */}
            <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <StatCard icon={<Brain />} color="amber" label="Total Tokens" value={usage.reduce((a, b) => a + b.tokens, 0).toLocaleString()} sub="consumidos" />
                    <StatCard icon={<Activity />} color="amber" label="Canais Ativos" value={usage.length} sub="com consumo" />
                    <StatCard icon={<AlertTriangle />} color="amber" label="Top Consumidor" value={usage[0]?.name || "—"} sub={usage[0] ? `${usage[0].tokens.toLocaleString()} tokens` : ""} />
                </div>

                <PremiumCard className="p-8 bg-navy-950/20 border border-white/5 rounded-none">
                    <h3 className="text-xl font-black text-white mb-8 flex items-center gap-3 uppercase tracking-tighter">
                        <Brain className="h-6 w-6 text-amber-500" />
                        Channel Ingestion Invariant Metrics
                    </h3>

                    {usage.length === 0 ? (
                        <div className="text-center py-16 bg-navy-950/40 border border-dashed border-white/5 rounded-none">
                            <Brain className="h-12 w-12 text-secondary-gray-700 mx-auto mb-4 opacity-50" />
                            <p className="text-white font-black uppercase tracking-widest text-[11px]">No Ingestion Recorded</p>
                            <p className="text-secondary-gray-600 text-[9px] mt-2 uppercase tracking-widest leading-loose">Metrics will populate upon first protocol execution.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {usage.map((item, i) => (
                                <div key={i} className="group">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span className={cn(
                                                "px-2 py-1 rounded-none text-[8px] font-black uppercase tracking-[0.2em] border",
                                                item.platform === "whatsapp"
                                                    ? "bg-green-500/10 text-green-500 border-green-500/20"
                                                    : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                            )}>
                                                {item.platform === "whatsapp" ? "WA" : "TG"}
                                            </span>
                                            <span className="text-[11px] font-black text-white truncate uppercase tracking-widest">{item.name}</span>
                                        </div>
                                        <span className="text-[10px] font-mono font-black text-secondary-gray-500 tabular-nums shrink-0">
                                            {item.tokens.toLocaleString()} TOKENS
                                        </span>
                                    </div>
                                    <div className="h-1 bg-white/5 rounded-none overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(item.tokens / maxTokens) * 100}%` }}
                                            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: i * 0.1 }}
                                            className={cn(
                                                "h-full",
                                                item.platform === "whatsapp" ? "bg-green-500" : "bg-blue-500"
                                            )}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </PremiumCard>
            </div>

            {/* AI Config Section */}
            <div className="space-y-8">
                <div className="flex items-center justify-between bg-navy-950/40 p-6 border border-white/5 rounded-none">
                    <h2 className="text-xl font-black text-white tracking-widest flex items-center gap-4 uppercase">
                        <Settings className="h-6 w-6 text-brand-500" />
                        Neural Protocol Keys
                    </h2>
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-secondary-gray-600 px-4 py-1.5 border border-white/5 rounded-none">
                        Core Override
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <AIKeyCard
                        title="Google Gemini"
                        configKey="GOOGLE_API_KEY"
                        currentValue={aiSettings.GOOGLE_API_KEY}
                        onSave={onRefresh}
                    />
                    <AIKeyCard
                        title="OpenAI"
                        configKey="OPENAI_API_KEY"
                        currentValue={aiSettings.OPENAI_API_KEY}
                        onSave={onRefresh}
                    />
                    <AIKeyCard
                        title="Anthropic"
                        configKey="ANTHROPIC_API_KEY"
                        currentValue={aiSettings.ANTHROPIC_API_KEY}
                        onSave={onRefresh}
                    />
                    <AIKeyCard
                        title="Groq"
                        configKey="GROQ_API_KEY"
                        currentValue={aiSettings.GROQ_API_KEY}
                        onSave={onRefresh}
                    />
                    <div className="md:col-span-2">
                        <AIKeyCard
                            title="Lovable AI Gateway"
                            configKey="LOVABLE_API_KEY"
                            currentValue={aiSettings.LOVABLE_API_KEY}
                            onSave={onRefresh}
                            description="Chave mestra usada como fallback quando o provedor não tem chave específica."
                        />
                    </div>
                </div>

                <PremiumCard className="p-8 bg-navy-950/20 border border-blue-500/20 rounded-none group hover:bg-navy-950/40 transition-all">
                    <div className="flex items-start gap-5">
                        <div className="h-12 w-12 rounded-sm bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0 mt-0.5">
                            <Shield className="h-6 w-6 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-[13px] font-black text-white uppercase tracking-widest">Protocol Guard: Neural Safety</p>
                            <p className="text-[11px] text-secondary-gray-500 mt-2 uppercase tracking-widest leading-loose">
                                All keys are encrypted at rest and masked during transmission.
                                <strong className="text-brand-500 ml-2"> Operational Note:</strong> Global overrides impact every neural-processed batch within the sovereignty.
                            </p>
                        </div>
                    </div>
                </PremiumCard>
            </div>
        </div>
    );
}

function AIKeyCard({ title, configKey, currentValue, onSave, description }: {
    title: string;
    configKey: string;
    currentValue: string;
    onSave: () => void;
    description?: string;
}) {
    const [value, setValue] = useState("");
    const [showKey, setShowKey] = useState(false);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSave = async () => {
        if (!value.trim()) return;
        setSaving(true);
        try {
            await saveAISetting(configKey, value.trim());
            setValue("");
            setSuccess(true);
            onSave();
            setTimeout(() => setSuccess(false), 3000);
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    return (
        <PremiumCard className="p-6 space-y-6 bg-navy-950/20 border border-white/5 rounded-none group hover:bg-navy-950/40 transition-all">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-[13px] font-black text-white uppercase tracking-widest leading-none">{title}</h3>
                    {description && <p className="text-[9px] font-black text-secondary-gray-700 mt-2 uppercase tracking-widest leading-none">{description}</p>}
                </div>
                <div className={cn(
                    "px-3 py-1 rounded-none text-[9px] font-black uppercase tracking-[0.2em] border",
                    currentValue ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
                )}>
                    {currentValue ? "OPERATIONAL" : "PENDING"}
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-[0.2em] text-secondary-gray-600 px-1">
                    <span>{currentValue ? "Active Protocol ID" : "Initialize Key"}</span>
                </div>
                <div className="relative">
                    <input
                        type={showKey ? "text" : "password"}
                        value={value || (showKey ? "" : currentValue)}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder={currentValue || "Input Identity Key..."}
                        className="w-full bg-navy-950 border border-white/5 rounded-none px-4 py-4 pr-24 text-[13px] font-black text-white tracking-widest placeholder:text-secondary-gray-800 focus:border-brand-500/50 outline-none transition-all font-mono"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                        <button
                            onClick={() => setShowKey(!showKey)}
                            className="p-2.5 text-secondary-gray-600 hover:text-white transition-colors cursor-pointer rounded-none hover:bg-white/5"
                        >
                            {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!value || saving}
                            className={cn(
                                "p-2.5 rounded-none transition-all cursor-pointer",
                                success ? "bg-green-500 text-white" : "bg-brand-500 text-white hover:bg-brand-400 disabled:opacity-0 disabled:scale-95"
                            )}
                        >
                            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : success ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                        </button>
                    </div>
                </div>
            </div>
        </PremiumCard>
    );
}

// ─── Tab 5: Gestão de Mensagens (Templates) ───

function MessagesTab({ templates, globalTemplateSettings, onRefresh }: { templates: any[]; globalTemplateSettings: Record<string, string>; onRefresh: () => void }) {
    const [showNew, setShowNew] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [mappingSaving, setMappingSaving] = useState(false);

    const handleSync = async () => {
        setSyncing(true);
        try {
            const res = await syncMetaTemplates();
            if (res.success) {
                alert(`Sincronização concluída! ${res.count} templates processados.`);
                onRefresh();
            }
        } catch (e: any) {
            alert(e.message || "Erro ao sincronizar templates");
        } finally {
            setSyncing(false);
        }
    };

    const handleUpdateMapping = async (key: string, value: string) => {
        setMappingSaving(true);
        try {
            await saveAISetting(key, value);
            onRefresh();
        } catch (e) {
            console.error(e);
        } finally {
            setMappingSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <StatCard icon={<MessageSquare />} color="blue" label="Templates Ativos" value={templates.filter(t => t.is_active).length} sub="configurados" />
                <StatCard icon={<Globe />} color="blue" label="Idiomas" value={new Set(templates.map(t => t.language)).size} sub="suportados" />
            </div>

            <PremiumCard className="p-8 bg-navy-950/20 border-l-2 border-l-brand-500 rounded-none group hover:bg-navy-950/40 transition-all">
                <h3 className="text-[11px] font-black text-secondary-gray-500 uppercase tracking-[0.3em] mb-8 flex items-center gap-3 px-1">
                    <Shield className="h-4 w-4 text-brand-500" /> WhatsApp Meta Dispatch Protocols
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        { label: "Executive Summary", key: "META_TEMPLATE_SUMMARY", icon: <MessageSquare className="h-4 w-4" /> },
                        { label: "Critical Alert", key: "META_TEMPLATE_ALERT", icon: <AlertTriangle className="h-4 w-4" /> },
                        { label: "Neural Insight", key: "META_TEMPLATE_INSIGHT", icon: <Brain className="h-4 w-4" /> },
                    ].map((item) => (
                        <div key={item.key} className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary-gray-700 flex items-center gap-2 px-1">
                                {item.icon} {item.label}
                            </label>
                            <select
                                value={globalTemplateSettings[item.key] || ""}
                                onChange={(e) => handleUpdateMapping(item.key, e.target.value)}
                                disabled={mappingSaving}
                                className="w-full bg-navy-950 border border-white/5 rounded-none px-4 py-4 text-[11px] font-black text-white tracking-widest focus:border-brand-500/50 outline-none transition-all cursor-pointer hover:bg-white/5 appearance-none"
                            >
                                <option value="" className="bg-navy-950">UNLINKED</option>
                                {templates
                                    .filter(t => t.platform === 'meta')
                                    .map(t => (
                                        <option key={t.id} value={t.name} className="bg-navy-950">{t.name} [{t.language}]</option>
                                    ))
                                }
                            </select>
                        </div>
                    ))}
                </div>
                {mappingSaving && <p className="text-[9px] text-brand-500 font-black uppercase tracking-[0.3em] mt-6 animate-pulse px-1">Synchronizing Sovereignty Protocol...</p>}
            </PremiumCard>

            <div className="flex items-center justify-between bg-navy-950/40 p-6 border border-white/5 rounded-none">
                <h2 className="text-xl font-black text-white tracking-widest flex items-center gap-4 uppercase">
                    <MessageSquare className="h-6 w-6 text-brand-500" />
                    Message Registry
                </h2>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSync}
                        disabled={syncing}
                        className="flex items-center gap-3 px-6 py-3 bg-navy-950 border border-white/5 hover:bg-white/5 text-secondary-gray-500 hover:text-white text-[11px] font-black uppercase tracking-widest rounded-none transition-all cursor-pointer disabled:opacity-50"
                    >
                        <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
                        {syncing ? "Synching Meta..." : "Sync Meta Protocols"}
                    </button>
                    {!showNew && (
                        <button
                            onClick={() => setShowNew(true)}
                            className="flex items-center gap-3 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white text-[11px] font-black uppercase tracking-widest rounded-none transition-all cursor-pointer shadow-lg shadow-brand-500/10"
                        >
                            <Plus className="h-4 w-4" /> New Protocol
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {showNew && (
                    <TemplateCard config={null} isNew onRefresh={() => { setShowNew(false); onRefresh(); }} onCancel={() => setShowNew(false)} />
                )}
                {templates.map((tmpl) => (
                    <TemplateCard key={tmpl.id} config={tmpl} onRefresh={onRefresh} />
                ))}

                {templates.length === 0 && !showNew && (
                    <div className="text-center py-24 bg-navy-950/20 border-2 border-dashed border-white/5 rounded-none">
                        <MessageSquare className="h-12 w-12 text-secondary-gray-700 mx-auto mb-4 opacity-50" />
                        <p className="text-white font-black uppercase tracking-widest text-[11px]">No Message Templates Detected</p>
                        <p className="text-secondary-gray-600 text-[9px] mt-2 uppercase tracking-widest leading-loose max-w-sm mx-auto">Initialize Meta or Evolution protocols to begin automated dispatch operations.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function TemplateCard({ config, isNew, onRefresh, onCancel }: { config: any; isNew?: boolean; onRefresh: () => void; onCancel?: () => void }) {
    const [form, setForm] = useState({
        name: config?.name || "",
        platform: config?.platform || "meta",
        category: config?.category || "MARKETING",
        language: config?.language || "pt_BR",
        content: config?.content || "",
        is_active: config?.is_active ?? true,
    });
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!form.name.trim()) return;
        setSaving(true);
        try {
            await saveWhatsAppTemplate({ id: config?.id, ...form });
            onRefresh();
        } catch (e) { console.error(e); }
        finally { setSaving(false); }
    };

    const handleDelete = async () => {
        if (!config?.id || !confirm("Remover este template?")) return;
        await deleteWhatsAppTemplate(config.id);
        onRefresh();
    };

    return (
        <PremiumCard className={cn(
            "p-8 bg-navy-950/20 border border-white/5 rounded-none group hover:bg-navy-950/40 transition-all",
            isNew ? "border-2 border-dashed border-brand-500/30" : ""
        )}>
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-5">
                    <div className="h-14 w-14 rounded-sm bg-brand-500/10 flex items-center justify-center border border-brand-500/20">
                        <MessageSquare className="h-7 w-7 text-brand-500" />
                    </div>
                    <div>
                        <h3 className="text-[13px] font-black text-white uppercase tracking-widest leading-none">
                            {isNew ? "Initialize New Message Protocol" : form.name}
                        </h3>
                        <div className="flex items-center gap-4 mt-3">
                            <span className={cn(
                                "text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-none border",
                                form.platform === 'meta' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                            )}>
                                {form.platform} INTERFACE
                            </span>
                            {!isNew && <StatusBadge active={form.is_active} />}
                        </div>
                    </div>
                </div>
                {!isNew && (
                    <button onClick={handleDelete} className="p-3 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-all cursor-pointer rounded-none">
                        <Trash2 className="h-5 w-5" />
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <InputField label="Protocol Identifier" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="daily_summary_alpha" />

                <div className="space-y-3">
                    <label className="text-[9px] font-black text-secondary-gray-600 uppercase tracking-[0.2em] px-1">Infrastructure Platform</label>
                    <select
                        value={form.platform}
                        onChange={(e) => setForm({ ...form, platform: e.target.value as any })}
                        className="w-full bg-navy-950 border border-white/5 rounded-none px-4 py-4 text-[11px] font-black text-white tracking-widest focus:border-brand-500/50 outline-none transition-all appearance-none"
                    >
                        <option value="meta" className="bg-navy-950">META OFFICIAL UNIT</option>
                        <option value="evolution" className="bg-navy-950">EVOLUTION API UNIT</option>
                    </select>
                </div>

                <InputField label="Category Manifest" value={form.category} onChange={(v) => setForm({ ...form, category: v })} placeholder="MARKETING_A1" />
                <InputField label="Language Locale" value={form.language} onChange={(v) => setForm({ ...form, language: v })} placeholder="PT_BR_UTF8" />
            </div>

            <div className="mt-8 space-y-3">
                <label className="text-[9px] font-black text-secondary-gray-600 uppercase tracking-[0.2em] px-1">Protocol Content Payload / JSON Schema</label>
                <textarea
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    placeholder='{"payload": {"v": 1.0, "components": [...]}}'
                    className="w-full h-40 bg-navy-950 border border-white/5 rounded-none px-6 py-6 text-[13px] font-black text-white tracking-widest placeholder:text-secondary-gray-800 focus:border-brand-500/50 outline-none transition-all font-mono leading-loose resize-none"
                />
            </div>

            <div className="flex items-center gap-4 mt-8 pt-8 border-t border-white/5">
                <button
                    onClick={handleSave}
                    disabled={saving || !form.name.trim()}
                    className="flex-1 sm:flex-none px-12 py-4 bg-brand-500 hover:bg-brand-600 text-white text-[11px] font-black uppercase tracking-[0.3em] rounded-none transition-all shadow-xl shadow-brand-500/10 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                    {saving ? <RefreshCw className="h-4 w-4 animate-spin inline mr-3" /> : <Save className="h-4 w-4 inline mr-3" />}
                    {saving ? "Synchronizing..." : "Authorize Protocol"}
                </button>
                {isNew && onCancel && (
                    <button onClick={onCancel} className="px-12 py-4 bg-navy-950 border border-white/5 hover:bg-white/5 text-white text-[11px] font-black uppercase tracking-[0.3em] rounded-none transition-all cursor-pointer">
                        Abort Initialization
                    </button>
                )}
            </div>
        </PremiumCard>
    );
}

// ─── Tab 6: Prompts (System) ───

const PROMPT_DEFINITIONS = [
    {
        id: "PROMPT_SUMMARY_SYSTEM",
        label: "Executive Logic",
        description: "Neural core for high-density summary generation and mapping.",
        placeholder: "Initialize Executive Persona Alpha... (Define operational constraints)",
        icon: <Brain className="h-5 w-5 text-brand-500" />
    },
    {
        id: "PROMPT_ALERT_SYSTEM",
        label: "Anomaly Detection",
        description: "Protocol core for heuristic risk identification and triage.",
        placeholder: "Analyze batch ingestions for non-compliance... (Define tripwires)",
        icon: <Shield className="h-5 w-5 text-amber-500" />
    },
    {
        id: "PROMPT_INSIGHT_SYSTEM",
        label: "Behavioral Analytics",
        description: "Psychometric engine for extraction of unit interactions.",
        placeholder: "Detect cognitive behavioral patterns... (Define analytical focus)",
        icon: <Lightbulb className="h-5 w-5 text-blue-500" />
    },
    {
        id: "TELEGRAM_BOT_LINK",
        label: "TG Unit Liaison",
        description: "Global bot invariant used for unit onboarding (t.me/unit).",
        placeholder: "t.me/unit_id",
        icon: <Send className="h-5 w-5 text-secondary-gray-500" />
    }
];

function PromptsTab({ aiSettings, onRefresh }: { aiSettings: Record<string, string>; onRefresh: () => void }) {
    const [selectedPromptId, setSelectedPromptId] = useState<string>("PROMPT_SUMMARY_SYSTEM");
    const [localValue, setLocalValue] = useState("");
    const [saving, setSaving] = useState(false);

    // Sync local value when selection or settings change
    useEffect(() => {
        setLocalValue(aiSettings[selectedPromptId] || "");
    }, [selectedPromptId, aiSettings]);

    const activeDef = PROMPT_DEFINITIONS.find(p => p.id === selectedPromptId) || PROMPT_DEFINITIONS[0];

    const handleSave = async () => {
        console.log(`[PromptsTab] Saving ${selectedPromptId}:`, localValue.length);
        setSaving(true);
        try {
            const result = await saveAISetting(selectedPromptId, localValue, activeDef.description);
            console.log("[PromptsTab] Save result:", result);
            onRefresh();
            alert(`${activeDef.label} atualizado com sucesso!`);
        } catch (e: any) {
            alert("Erro ao salvar: " + e.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 max-w-7xl mx-auto h-[calc(100vh-250px)] min-h-[600px]">
            {/* Sidebar List */}
            <div className="md:col-span-4 bg-navy-950/20 border border-white/5 rounded-none p-4 overflow-y-auto">
                <h3 className="text-[10px] font-black text-secondary-gray-600 uppercase tracking-[0.3em] mb-6 px-4">Neural Protocol Inventory</h3>
                <div className="space-y-3">
                    {PROMPT_DEFINITIONS.map((def) => (
                        <button
                            key={def.id}
                            onClick={() => setSelectedPromptId(def.id)}
                            className={cn(
                                "w-full text-left p-5 rounded-none border transition-all group relative overflow-hidden",
                                selectedPromptId === def.id
                                    ? "bg-white/5 border-brand-500/30"
                                    : "bg-transparent border-transparent hover:bg-white/5"
                            )}
                        >
                            <div className="flex items-start gap-4 z-10 relative">
                                <div className={cn(
                                    "p-3 rounded-none transition-all shadow-md",
                                    selectedPromptId === def.id ? "bg-navy-950 border border-white/10 scale-105" : "bg-navy-950/40"
                                )}>
                                    {def.icon}
                                </div>
                                <div className="min-w-0">
                                    <h4 className={cn(
                                        "text-[12px] font-black uppercase tracking-widest leading-none",
                                        selectedPromptId === def.id ? "text-white" : "text-secondary-gray-500 group-hover:text-white"
                                    )}>
                                        {def.label}
                                    </h4>
                                    <p className="text-secondary-gray-700 text-[9px] mt-2 uppercase tracking-widest line-clamp-2 leading-relaxed font-bold">
                                        {def.description}
                                    </p>
                                </div>
                            </div>
                            {selectedPromptId === def.id && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-500" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Editor */}
            <div className="md:col-span-8 h-full">
                <PremiumCard className="h-full flex flex-col p-8 bg-navy-950/20 border border-white/5 rounded-none group hover:bg-navy-950/40 transition-all">
                    <div className="flex items-center justify-between border-b border-white/5 pb-8 mb-8">
                        <div className="flex items-center gap-5">
                            <div className="h-14 w-14 rounded-none bg-brand-500/10 flex items-center justify-center border border-brand-500/20 shadow-xl shadow-brand-500/5">
                                {activeDef.icon}
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{activeDef.label}</h2>
                                <p className="text-[9px] font-black text-secondary-gray-700 uppercase tracking-[0.3em] mt-2 opacity-80">{activeDef.id}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-12 py-4 bg-brand-500 hover:bg-brand-600 text-white text-[11px] font-black uppercase tracking-[0.3em] rounded-none transition-all shadow-xl shadow-brand-500/10 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                        >
                            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {saving ? "Synchronizing..." : "Update Protocol"}
                        </button>
                    </div>

                    <div className="flex-1 min-h-0 relative group">
                        <textarea
                            value={localValue}
                            onChange={(e) => setLocalValue(e.target.value)}
                            className="w-full h-full bg-navy-950 border border-white/5 rounded-none px-8 py-8 text-[13px] font-black text-white tracking-widest placeholder:text-secondary-gray-800 focus:border-brand-500/50 outline-none transition-all leading-loose resize-none font-mono"
                            placeholder={activeDef.placeholder}
                        />
                        <div className="absolute bottom-6 right-6 bg-brand-500 text-white px-4 py-2 rounded-none text-[10px] font-black pointer-events-none opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 uppercase tracking-widest">
                            {localValue.length} LOGS
                        </div>
                    </div>

                    <div className="mt-8 flex items-center gap-4 p-6 bg-navy-950/40 border border-white/5 rounded-none">
                        <div className="h-10 w-10 rounded-none bg-brand-500/5 flex items-center justify-center shrink-0 border border-brand-500/10">
                            <Info className="h-5 w-5 text-brand-500" />
                        </div>
                        <p className="text-[10px] text-secondary-gray-500 uppercase tracking-widest leading-loose font-bold">
                            This instruction defines the <strong className="text-white font-black">Global Invariant</strong> for this neural task. Specificity increases protocol integrity.
                        </p>
                    </div>
                </PremiumCard>
            </div>
        </div>
    );
}

// ─── Shared Components ───

function StatCard({ icon, color, label, value, sub }: { icon: ReactNode; color: string; label: string; value: string | number; sub: string }) {
    const colorMap: Record<string, string> = {
        green: "bg-green-500/10 text-green-500 border-green-500/20",
        emerald: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
        blue: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        amber: "bg-amber-500/10 text-amber-500 border-amber-500/20",
        brand: "bg-brand-500/10 text-brand-500 border-brand-500/20",
    };

    return (
        <PremiumCard className="p-0 border border-white/5 rounded-sm overflow-hidden bg-navy-950/20">
            <div className="p-5 flex items-center gap-4 transition-colors hover:bg-white/5">
                <div className={cn(
                    "h-10 w-10 flex items-center justify-center rounded-sm border flex-shrink-0",
                    colorMap[color] || colorMap.brand
                )}>
                    <div className="h-4 w-4 overflow-hidden flex items-center justify-center">
                        {icon}
                    </div>
                </div>
                <div className="min-w-0">
                    <p className="text-[9px] font-black text-secondary-gray-600 uppercase tracking-widest mb-1">{label}</p>
                    <div className="flex items-baseline gap-2 mt-0.5">
                        <p className="text-2xl font-black text-white leading-none tabular-nums tracking-tight uppercase">{value}</p>
                        <span className="text-[9px] font-black text-secondary-gray-500 uppercase tracking-widest leading-none">{sub}</span>
                    </div>
                </div>
            </div>
        </PremiumCard>
    );
}

function StatusBadge({ active }: { active: boolean }) {
    return (
        <div className={cn(
            "flex items-center gap-1.5 px-3 py-1 rounded-none border text-[9px] font-black uppercase tracking-widest w-fit",
            active ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
        )}>
            <div className={cn("h-1.5 w-1.5 bg-current", active ? "animate-pulse" : "")} />
            {active ? "Operational" : "Offline"}
        </div>
    );
}

function InputField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
    return (
        <div className="space-y-2">
            <label className="text-[9px] font-black text-secondary-gray-600 uppercase tracking-[0.2em] px-1">{label}</label>
            <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-navy-950/40 border border-white/5 rounded-sm px-4 py-3 text-[11px] font-black text-white tracking-widest placeholder:text-secondary-gray-700 focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/10 outline-none transition-all"
            />
        </div>
    );
}
