"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
    Lightbulb
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

type TabId = "collection" | "official" | "telegram" | "monitor" | "messages" | "prompts";

const TABS: { id: TabId; label: string; icon: React.ReactNode; color: string }[] = [
    { id: "collection", label: "WhatsApp Collection", icon: <QrCode className="h-4 w-4" />, color: "green" },
    { id: "official", label: "WhatsApp Official", icon: <Send className="h-4 w-4" />, color: "emerald" },
    { id: "messages", label: "Gestão de Mensagens", icon: <MessageSquare className="h-4 w-4" />, color: "brand" },
    { id: "telegram", label: "Telegram", icon: <Bot className="h-4 w-4" />, color: "blue" },
    { id: "prompts", label: "Prompts do Sistema", icon: <Brain className="h-4 w-4" />, color: "pink" },
    { id: "monitor", label: "Monitor IA", icon: <Activity className="h-4 w-4" />, color: "amber" },
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

    const tabColorMap: Record<string, string> = {
        green: "bg-green-500", emerald: "bg-emerald-500", blue: "bg-blue-500", amber: "bg-amber-500", brand: "bg-brand-500", pink: "bg-pink-500",
    };

    return (
        <div className="space-y-8 pb-20">
            <header className="space-y-2">
                <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-brand-500/10 text-brand-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-brand-500/20">
                        Painel Super Admin
                    </span>
                </div>
                <h1 className="text-5xl font-black text-white tracking-tighter leading-none">Gestão de Assets</h1>
                <p className="text-secondary-gray-500 font-medium text-lg">
                    Canais de coleta, credenciais de entrega e consumo de IA.
                </p>
            </header>

            {/* Tab Navigation */}
            <div className="flex gap-1 p-1.5 bg-navy-900/50 rounded-2xl border border-white/5 overflow-x-auto">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${activeTab === tab.id
                            ? "bg-navy-800 text-white shadow-lg border border-white/10"
                            : "text-secondary-gray-500 hover:text-white hover:bg-navy-800/50"
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                        {activeTab === tab.id && (
                            <div className={`h-1.5 w-1.5 rounded-full ${tabColorMap[tab.color]} animate-pulse`} />
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.2 }}
                >
                    {loading ? <LoadingSkeleton /> : (
                        <>
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
                        </>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

// ─── Loading Skeleton ───

function LoadingSkeleton() {
    return (
        <div className="space-y-4">
            {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-navy-900/50 rounded-2xl animate-pulse border border-white/5" />
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
            case "open": return { bg: "bg-green-500/10", text: "text-green-500", border: "border-green-500/20", label: "Conectado" };
            case "connecting": return { bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/20", label: "Conectando..." };
            case "qr_ready": return { bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/20", label: "Aguardando QR" };
            default: return { bg: "bg-red-500/10", text: "text-red-500", border: "border-red-500/20", label: "Desconectado" };
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
                        className={`p-2 hover:bg-white/5 rounded-lg transition-colors ${configStatus === "missing" ? "hidden" : ""}`}
                    >
                        <ArrowLeft className="h-5 w-5 text-secondary-gray-400" />
                    </button>
                    <h2 className="text-xl font-bold text-white">Configuração Evolution API</h2>
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
                            <label className="text-sm font-medium text-secondary-gray-400">URL da API</label>
                            <div className="relative">
                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-gray-500" />
                                <input
                                    type="text"
                                    value={configForm.url}
                                    onChange={(e) => setConfigForm(prev => ({ ...prev, url: e.target.value }))}
                                    placeholder="https://api.seudominio.com"
                                    className="w-full bg-navy-900/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-secondary-gray-600 focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all outline-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-secondary-gray-400">Global API Key</label>
                            <div className="relative">
                                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-gray-500" />
                                <input
                                    type="text"
                                    value={configForm.apiKey}
                                    onChange={(e) => setConfigForm(prev => ({ ...prev, apiKey: e.target.value }))}
                                    placeholder="Ex: 44299384-..."
                                    className="w-full bg-navy-900/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-secondary-gray-600 focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all outline-none"
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
                            className="bg-white/5 hover:bg-white/10 text-white font-bold py-3 px-6 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                        >
                            Testar Conexão
                        </button>
                        <button
                            onClick={handleSaveConfig}
                            disabled={saving || !configForm.url || !configForm.apiKey}
                            className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {saving ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
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

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                    {connTest.message && connTest.status !== "idle" && (
                        <div className={`px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-bold ${connTest.status === "success" ? "bg-green-500/10 text-green-500" : connTest.status === "error" ? "bg-red-500/10 text-red-500" : "bg-blue-500/10 text-blue-500"}`}>
                            {connTest.status === "testing" && <RefreshCw className="h-3 w-3 animate-spin" />}
                            {connTest.message}
                        </div>
                    )}
                    <button
                        onClick={handleTestConnection}
                        disabled={connTest.status === "testing"}
                        className="p-2.5 bg-navy-900/80 hover:bg-navy-800 text-secondary-gray-400 hover:text-white rounded-xl border border-white/5 hover:border-white/10 transition-all cursor-pointer"
                        title="Testar Conexão API"
                    >
                        <Activity className={`h-4 w-4 ${connTest.status === "testing" ? "animate-pulse" : ""}`} />
                    </button>
                    <button
                        onClick={() => setEditingConfig(true)}
                        className="p-2.5 bg-navy-900/80 hover:bg-navy-800 text-secondary-gray-400 hover:text-white rounded-xl border border-white/5 hover:border-white/10 transition-all cursor-pointer"
                        title="Configurações da API"
                    >
                        <Settings className="h-4 w-4" />
                    </button>
                    <button
                        onClick={handleSync}
                        disabled={syncing}
                        className="flex items-center gap-2 px-4 py-2.5 bg-navy-900/80 hover:bg-navy-800 text-sm font-bold text-secondary-gray-400 hover:text-white rounded-xl border border-white/5 hover:border-white/10 transition-all cursor-pointer disabled:opacity-50"
                    >
                        <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
                        {syncing ? "Sincronizando..." : "Sincronizar"}
                    </button>
                </div>
            </div>

            {/* Instance List */}
            <div className="space-y-4">
                {instances.map((inst) => {
                    const statusInfo = getStatusColor(inst.status);
                    return (
                        <PremiumCard key={inst.id} className="p-5">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className={`h-12 w-12 rounded-xl ${statusInfo.bg} flex items-center justify-center border ${statusInfo.border} shrink-0`}>
                                        <QrCode className={`h-6 w-6 ${statusInfo.text}`} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-lg font-black text-white truncate">{inst.instance_name}</p>
                                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                                            {/* Connection State Badge */}
                                            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${statusInfo.bg} border ${statusInfo.border}`}>
                                                <div className={`h-1.5 w-1.5 rounded-full ${statusInfo.text.replace("text-", "bg-")} ${inst.status === "open" ? "animate-pulse" : ""}`} />
                                                <span className={`text-[10px] font-black uppercase ${statusInfo.text}`}>{statusInfo.label}</span>
                                            </div>
                                            <span className="text-xs font-bold text-secondary-gray-500">
                                                {inst.groups_count ?? 0} grupo{(inst.groups_count ?? 0) !== 1 ? "s" : ""}
                                            </span>
                                            {inst.instance_key && (
                                                <span className="text-[10px] font-mono text-secondary-gray-600">
                                                    ID: {inst.instance_key.slice(0, 12)}...
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    {/* Connect / Generate QR */}
                                    {inst.status !== "open" && (
                                        <button
                                            onClick={() => handleConnect(inst)}
                                            className="p-2.5 rounded-xl bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors cursor-pointer"
                                            title="Gerar QR Code"
                                        >
                                            <QrCode className="h-4 w-4" />
                                        </button>
                                    )}
                                    {/* View existing QR */}
                                    {inst.qr_code_base64 && inst.status !== "open" && (
                                        <button
                                            onClick={() => handleOpenQr(inst)}
                                            className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors cursor-pointer"
                                            title="Ver QR Code (Atualizar)"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </button>
                                    )}
                                    <button
                                        onClick={async () => {
                                            await setSystemBot(inst.id, "admin_collection_instances");
                                            onRefresh();
                                        }}
                                        className={`p-2.5 rounded-xl transition-colors cursor-pointer ${inst.is_system_bot ? "bg-brand-500/20 text-brand-500" : "bg-white/5 text-secondary-gray-500 hover:text-brand-500 hover:bg-brand-500/5"}`}
                                        title={inst.is_system_bot ? "Bot do Sistema Ativo" : "Definir como Bot do Sistema"}
                                    >
                                        <Star className={`h-4 w-4 ${inst.is_system_bot ? "fill-current" : ""}`} />
                                    </button>
                                    <button
                                        onClick={() => handleToggle(inst.id, inst.is_active)}
                                        className={`p-2.5 rounded-xl transition-colors cursor-pointer ${inst.is_active ? "bg-green-500/10 text-green-500 hover:bg-red-500/10 hover:text-red-500" : "bg-red-500/10 text-red-500 hover:bg-green-500/10 hover:text-green-500"}`}
                                        title={inst.is_active ? "Desativar" : "Ativar"}
                                    >
                                        <Power className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(inst)}
                                        className="p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors cursor-pointer"
                                        title="Remover da Evolution + DB"
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
                <PremiumCard className="p-6 border-2 border-dashed border-green-500/20">
                    <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                        <Plus className="h-5 w-5 text-green-500" /> Nova Instância Evolution
                    </h3>
                    <p className="text-sm text-secondary-gray-500 mb-4">
                        A instância será criada na Evolution API com recebimento de mensagens de grupos ativado automaticamente.
                    </p>
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-secondary-gray-500 mb-1.5 block">Nome da Instância</label>
                        <input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="ex: ignohub-collection-01"
                            className="w-full max-w-md bg-navy-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-secondary-gray-600 focus:border-green-500/50 focus:outline-none transition-colors"
                            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                        />
                        <p className="text-xs text-secondary-gray-600 mt-1.5">Use letras minúsculas, números e hífens. Ex: meu-bot-01</p>
                    </div>
                    <div className="flex items-center gap-3 mt-5">
                        <button
                            onClick={handleCreate}
                            disabled={saving || !newName.trim()}
                            className="px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-2"
                        >
                            {saving ? (
                                <><RefreshCw className="h-4 w-4 animate-spin" /> Criando na Evolution...</>
                            ) : (
                                <><Plus className="h-4 w-4" /> Criar Instância</>
                            )}
                        </button>
                        <button
                            onClick={() => { setShowNewForm(false); setError(null); }}
                            className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-secondary-gray-400 text-sm font-bold rounded-xl transition-colors cursor-pointer"
                        >
                            Cancelar
                        </button>
                    </div>
                </PremiumCard>
            ) : (
                <button
                    onClick={() => setShowNewForm(true)}
                    className="w-full p-5 border-2 border-dashed border-white/10 rounded-2xl hover:border-green-500/30 transition-colors group cursor-pointer"
                >
                    <div className="flex items-center justify-center gap-3 text-secondary-gray-500 group-hover:text-green-500 transition-colors">
                        <Plus className="h-5 w-5" />
                        <span className="text-sm font-bold">Criar Nova Instância Evolution</span>
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
                            className="bg-navy-900 border border-white/10 rounded-3xl p-8 max-w-sm w-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-black text-white">QR Code</h3>
                                <button onClick={handleCloseQrModal} className="p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
                                    <X className="h-5 w-5 text-secondary-gray-400" />
                                </button>
                            </div>

                            <p className="text-sm font-bold text-secondary-gray-400 mb-4">{qrModal.name}</p>

                            {qrModal.state === "open" ? (
                                <div className="text-center py-8">
                                    <div className="h-16 w-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
                                        <Check className="h-8 w-8 text-green-500" />
                                    </div>
                                    <p className="text-lg font-black text-green-500">Conectado!</p>
                                    <p className="text-sm text-secondary-gray-500 mt-2">WhatsApp vinculado com sucesso.</p>
                                    <p className="text-xs text-secondary-gray-600 mt-1">Mensagens de grupos estão sendo coletadas.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="bg-white rounded-2xl p-6 flex items-center justify-center min-h-[250px]">
                                        {qrModal.loading ? (
                                            <div className="py-8 text-center">
                                                <RefreshCw className="h-8 w-8 text-navy-900 animate-spin mx-auto mb-3" />
                                                <p className="text-navy-900 font-bold text-sm">Gerando novo QR Code...</p>
                                            </div>
                                        ) : qrModal.error ? (
                                            <div className="text-center py-8">
                                                <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-3" />
                                                <p className="text-red-500 font-bold text-sm">{qrModal.error}</p>
                                                <button
                                                    onClick={() => qrModal.name && qrModal.dbId && handleOpenQr({ instance_name: qrModal.name, id: qrModal.dbId, status: qrModal.state })}
                                                    className="mt-4 px-4 py-2 bg-navy-900 text-white text-xs font-bold rounded-lg hover:bg-navy-800 transition-colors"
                                                >
                                                    Tentar Novamente
                                                </button>
                                            </div>
                                        ) : qrModal.qr ? (
                                            <img src={qrModal.qr.startsWith("data:") ? qrModal.qr : `data:image/png;base64,${qrModal.qr}`} alt="QR Code" className="w-full h-auto" />
                                        ) : (
                                            <div className="py-8 text-center">
                                                <p className="text-gray-500 text-sm">Nenhum QR Code disponível.</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-center gap-2 mt-4">
                                        <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                                        <p className="text-xs text-secondary-gray-500">
                                            Aguardando escaneamento... (verificando a cada 5s)
                                        </p>
                                    </div>

                                    <p className="text-xs text-secondary-gray-600 text-center mt-2">
                                        Abra o WhatsApp → Menu → Aparelhos conectados → Conectar
                                    </p>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Info Card */}
            <PremiumCard className="p-5 bg-gradient-to-r from-green-500/5 to-transparent border-green-500/10">
                <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/20 shrink-0 mt-0.5">
                        <Shield className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-white">Configuração Automática</p>
                        <p className="text-xs text-secondary-gray-500 mt-1">
                            Ao criar uma instância, as seguintes configurações são aplicadas automaticamente:
                            <strong className="text-green-400"> groupsIgnore: false</strong> (mensagens de grupo ativadas),
                            <strong className="text-amber-400"> rejectCall: true</strong>,
                            <strong className="text-secondary-gray-400"> alwaysOnline: true</strong>.
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
                    className="w-full p-5 border-2 border-dashed border-white/10 rounded-2xl hover:border-emerald-500/30 transition-colors group cursor-pointer"
                >
                    <div className="flex items-center justify-center gap-3 text-secondary-gray-500 group-hover:text-emerald-500 transition-colors">
                        <Plus className="h-5 w-5" />
                        <span className="text-sm font-bold">Cadastrar Novo Número Meta</span>
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
        <PremiumCard className={`p-6 ${isNew ? "border-2 border-dashed border-emerald-500/20" : ""}`}>
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                        <Shield className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-white">
                            {isNew ? "Novo Número" : (config.display_number || config.phone_number_id)}
                        </h3>
                        {!isNew && <StatusBadge active={config.is_active} />}
                    </div>
                </div>
                {!isNew && (
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-secondary-gray-500 bg-navy-950 px-3 py-1.5 rounded-lg border border-white/5">
                            {groupCount} grupos
                        </span>
                        <button
                            onClick={async () => {
                                if (!config?.id) return;
                                await setSystemBot(config.id, "admin_outbound_meta");
                                onRefresh();
                            }}
                            className={`p-2 rounded-xl transition-colors cursor-pointer ${config?.is_system_bot ? "bg-brand-500/20 text-brand-500" : "bg-white/5 text-secondary-gray-500 hover:text-brand-500 hover:bg-brand-500/5"}`}
                            title={config?.is_system_bot ? "Bot do Sistema Ativo" : "Definir como Bot do Sistema"}
                        >
                            <Star className={`h-4 w-4 ${config?.is_system_bot ? "fill-current" : ""}`} />
                        </button>
                        <button onClick={handleToggle} className={`p-2 rounded-xl transition-colors cursor-pointer ${config.is_active ? "bg-green-500/10 text-green-500 hover:bg-red-500/10 hover:text-red-500" : "bg-red-500/10 text-red-500 hover:bg-green-500/10 hover:text-green-500"}`}>
                            <Power className="h-4 w-4" />
                        </button>
                        <button onClick={handleDelete} className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors cursor-pointer">
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="Phone Number ID" value={form.phone_number_id} onChange={(v) => setForm({ ...form, phone_number_id: v })} placeholder="123456789" />
                <InputField label="WABA ID" value={form.waba_id} onChange={(v) => setForm({ ...form, waba_id: v })} placeholder="1234567890" />
                <InputField label="Display Number" value={form.display_number} onChange={(v) => setForm({ ...form, display_number: v })} placeholder="+55 11 99999-0000" />
                <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-secondary-gray-500 mb-1.5 block">Access Token</label>
                    <div className="relative">
                        <input
                            type={showToken ? "text" : "password"}
                            value={form.access_token}
                            onChange={(e) => setForm({ ...form, access_token: e.target.value })}
                            placeholder="EAAxxxxxxx..."
                            className="w-full bg-navy-950 border border-white/10 rounded-xl px-4 py-3 pr-12 text-sm text-white placeholder:text-secondary-gray-600 focus:border-emerald-500/50 focus:outline-none transition-colors font-mono"
                        />
                        <button onClick={() => setShowToken(!showToken)} className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-gray-500 hover:text-white cursor-pointer">
                            {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>
            </div>

            {config?.verify_token && (
                <div className="mt-4 flex items-center gap-3 p-3 bg-navy-950 rounded-xl border border-white/5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-secondary-gray-500">Verify Token:</span>
                    <code className="text-xs text-white font-mono flex-1">{config.verify_token}</code>
                    <button onClick={copyVerifyToken} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
                        {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-secondary-gray-500" />}
                    </button>
                </div>
            )}

            <div className="flex items-center gap-3 mt-5">
                <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50 cursor-pointer">
                    {saving ? "Salvando..." : "Salvar"}
                </button>
                {isNew && onCancel && (
                    <button onClick={onCancel} className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-secondary-gray-400 text-sm font-bold rounded-xl transition-colors cursor-pointer">
                        Cancelar
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
                <PremiumCard key={inst.id} className="p-5">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                            <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0">
                                <Bot className="h-6 w-6 text-blue-500" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-lg font-black text-white truncate">{inst.instance_name}</p>
                                <div className="flex items-center gap-3 mt-1">
                                    <StatusBadge active={inst.is_active} />
                                    <span className="text-xs font-bold text-secondary-gray-500">{inst.groups_count} grupos</span>
                                </div>
                                {inst.instance_key && (
                                    <p className="text-xs text-secondary-gray-600 font-mono mt-1 truncate">Token: ••••{inst.instance_key.slice(-8)}</p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={async () => { await toggleCollectionStatus(inst.id, inst.is_active); onRefresh(); }}
                                className={`p-2.5 rounded-xl transition-colors cursor-pointer ${inst.is_active ? "bg-blue-500/10 text-blue-500 hover:bg-red-500/10 hover:text-red-500" : "bg-red-500/10 text-red-500 hover:bg-blue-500/10 hover:text-blue-500"}`}
                            >
                                <Power className="h-4 w-4" />
                            </button>
                            <button
                                onClick={async () => { if (confirm("Remover?")) { await deleteCollectionInstance(inst.id); onRefresh(); } }}
                                className="p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors cursor-pointer"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </PremiumCard>
            ))}

            {/* Agent Presets with bot_link */}
            {presets.filter((p) => p.bot_link || p.telegram_bot_username).length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-sm font-black text-secondary-gray-400 uppercase tracking-widest">Presets com Bot Link</h3>
                    {presets.filter((p) => p.bot_link || p.telegram_bot_username).map((preset) => (
                        <PremiumCard key={preset.id} className="p-4 border-l-4 border-l-blue-500/50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-bold text-white">{preset.name}</p>
                                    {preset.bot_link && <p className="text-xs text-blue-400 font-mono mt-0.5">{preset.bot_link}</p>}
                                    {preset.telegram_bot_username && <p className="text-xs text-secondary-gray-500 mt-0.5">@{preset.telegram_bot_username}</p>}
                                </div>
                                <StatusBadge active={preset.is_active} />
                            </div>
                        </PremiumCard>
                    ))}
                </div>
            )}

            {/* New Telegram Bot */}
            {showNewBot ? (
                <PremiumCard className="p-6 border-2 border-dashed border-blue-500/20">
                    <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                        <Plus className="h-5 w-5 text-blue-500" /> Novo Bot Telegram
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="Nome do Bot" value={newBotName} onChange={setNewBotName} placeholder="ex: IgnoBot Principal" />
                        <InputField label="Bot Token" value={newBotKey} onChange={setNewBotKey} placeholder="123456:ABC-DEF..." />
                    </div>
                    <div className="flex items-center gap-3 mt-5">
                        <button onClick={handleCreateBot} disabled={saving || !newBotName.trim()} className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50 cursor-pointer">
                            {saving ? "Salvando..." : "Criar Bot"}
                        </button>
                        <button onClick={() => setShowNewBot(false)} className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-secondary-gray-400 text-sm font-bold rounded-xl transition-colors cursor-pointer">
                            Cancelar
                        </button>
                    </div>
                </PremiumCard>
            ) : (
                <button onClick={() => setShowNewBot(true)} className="w-full p-5 border-2 border-dashed border-white/10 rounded-2xl hover:border-blue-500/30 transition-colors group cursor-pointer">
                    <div className="flex items-center justify-center gap-3 text-secondary-gray-500 group-hover:text-blue-500 transition-colors">
                        <Plus className="h-5 w-5" />
                        <span className="text-sm font-bold">Adicionar Bot Telegram</span>
                    </div>
                </button>
            )}
        </div>
    );
}

// ─── Tab 4: Monitor IA ───

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

                <PremiumCard className="p-6">
                    <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2">
                        <Brain className="h-5 w-5 text-amber-500" />
                        Consumo de Tokens por Canal
                    </h3>

                    {usage.length === 0 ? (
                        <div className="text-center py-12">
                            <Brain className="h-12 w-12 text-secondary-gray-700 mx-auto mb-3" />
                            <p className="text-secondary-gray-500 font-bold">Nenhum consumo registrado</p>
                            <p className="text-secondary-gray-600 text-sm mt-1">Os dados aparecerão após o processamento dos primeiros batches.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {usage.map((item, i) => (
                                <div key={i} className="group">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${item.platform === "whatsapp"
                                                ? "bg-green-500/10 text-green-500 border border-green-500/20"
                                                : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                                                }`}>
                                                {item.platform === "whatsapp" ? "WA" : "TG"}
                                            </span>
                                            <span className="text-sm font-bold text-white truncate">{item.name}</span>
                                        </div>
                                        <span className="text-xs font-black text-secondary-gray-400 tabular-nums shrink-0">
                                            {item.tokens.toLocaleString()} tokens
                                        </span>
                                    </div>
                                    <div className="h-2.5 bg-navy-950 rounded-full overflow-hidden border border-white/5">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(item.tokens / maxTokens) * 100}%` }}
                                            transition={{ duration: 0.8, delay: i * 0.05 }}
                                            className={`h-full rounded-full ${platformColors[item.platform] || "bg-amber-500"}`}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </PremiumCard>
            </div>

            {/* AI Config Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                        <Settings className="h-6 w-6 text-brand-500" />
                        Configuração de IA (Global)
                    </h2>
                    <span className="text-[10px] font-black uppercase tracking-widest text-secondary-gray-500 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                        System Settings
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

                <PremiumCard className="p-5 bg-gradient-to-r from-blue-500/5 to-transparent border-blue-500/10">
                    <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0 mt-0.5">
                            <Shield className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white">Segurança das Chaves</p>
                            <p className="text-xs text-secondary-gray-500 mt-1">
                                As chaves são armazenadas de forma segura e mascaradas na interface.
                                <strong className="text-white"> Dica:</strong> As chaves são salvas globalmente e afetam todos os resumos automáticos do sistema.
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
        <PremiumCard className="p-6 space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-black text-white">{title}</h3>
                    {description && <p className="text-[10px] text-secondary-gray-500 mt-0.5">{description}</p>}
                </div>
                <div className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter ${currentValue ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                    {currentValue ? "Configurado" : "Pendente"}
                </div>
            </div>

            <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-secondary-gray-600">
                    <span>{currentValue ? "Chave Atual" : "Nova Chave"}</span>
                </div>
                <div className="relative group">
                    <input
                        type={showKey ? "text" : "password"}
                        value={value || (showKey ? "" : currentValue)}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder={currentValue || "Insira a chave..."}
                        className="w-full bg-navy-950 border border-white/5 rounded-xl px-4 py-3 pr-24 text-sm text-white placeholder:text-secondary-gray-700 focus:border-brand-500/30 focus:outline-none transition-all font-mono"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <button
                            onClick={() => setShowKey(!showKey)}
                            className="p-2 text-secondary-gray-500 hover:text-white transition-colors cursor-pointer"
                        >
                            {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!value || saving}
                            className={`p-2 rounded-lg transition-all ${success ? "bg-green-500 text-white" : "bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-0 disabled:scale-95 cursor-pointer"}`}
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

            <PremiumCard className="p-6">
                <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-brand-500" /> Configuração de Disparos (Meta)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { label: "Resumo", key: "META_TEMPLATE_SUMMARY", icon: <MessageSquare className="h-3 w-3" /> },
                        { label: "Alerta", key: "META_TEMPLATE_ALERT", icon: <AlertTriangle className="h-3 w-3" /> },
                        { label: "Insight", key: "META_TEMPLATE_INSIGHT", icon: <Brain className="h-3 w-3" /> },
                    ].map((item) => (
                        <div key={item.key}>
                            <label className="text-[10px] font-black uppercase tracking-widest text-secondary-gray-500 mb-2 block flex items-center gap-1.5">
                                {item.icon} {item.label}
                            </label>
                            <select
                                value={globalTemplateSettings[item.key] || ""}
                                onChange={(e) => handleUpdateMapping(item.key, e.target.value)}
                                disabled={mappingSaving}
                                className="w-full bg-navy-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-secondary-gray-300 focus:border-brand-500/50 outline-none transition-all cursor-pointer hover:border-white/20"
                            >
                                <option value="">Não definido</option>
                                {templates
                                    .filter(t => t.platform === 'meta')
                                    .map(t => (
                                        <option key={t.id} value={t.name}>{t.name} ({t.language})</option>
                                    ))
                                }
                            </select>
                        </div>
                    ))}
                </div>
                {mappingSaving && <p className="text-[10px] text-brand-500 font-bold mt-2 animate-pulse">Salvando configurações...</p>}
            </PremiumCard>

            <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-brand-500" /> Templates WhatsApp
                </h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleSync}
                        disabled={syncing}
                        className="flex items-center gap-2 px-4 py-2 bg-navy-900/80 hover:bg-navy-800 text-secondary-gray-400 hover:text-white text-xs font-bold rounded-xl border border-white/5 hover:border-white/10 transition-all cursor-pointer disabled:opacity-50"
                    >
                        <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
                        {syncing ? "Sincronizando..." : "Sincronizar com Meta"}
                    </button>
                    {!showNew && (
                        <button
                            onClick={() => setShowNew(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                        >
                            <Plus className="h-4 w-4" /> Novo Template
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
                    <div className="text-center py-20 bg-navy-900/30 rounded-3xl border border-white/5 border-dashed">
                        <MessageSquare className="h-12 w-12 text-secondary-gray-700 mx-auto mb-3" />
                        <p className="text-secondary-gray-500 font-bold">Nenhum template cadastrado</p>
                        <p className="text-secondary-gray-600 text-sm mt-1">Adicione templates Meta ou Evolution para automatizar disparos.</p>
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
        <PremiumCard className={`p-6 ${isNew ? "border-2 border-dashed border-brand-500/20" : ""}`}>
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-brand-500/10 flex items-center justify-center border border-brand-500/20">
                        <MessageSquare className="h-5 w-5 text-brand-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-white">
                            {isNew ? "Novo Template" : form.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${form.platform === 'meta' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                                {form.platform}
                            </span>
                            {!isNew && <StatusBadge active={form.is_active} />}
                        </div>
                    </div>
                </div>
                {!isNew && (
                    <button onClick={handleDelete} className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors cursor-pointer">
                        <Trash2 className="h-4 w-4" />
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <InputField label="Nome do Template" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="daily_summary" />

                <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-secondary-gray-500 mb-1.5 block">Plataforma</label>
                    <select
                        value={form.platform}
                        onChange={(e) => setForm({ ...form, platform: e.target.value as any })}
                        className="w-full bg-navy-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-brand-500/50 outline-none"
                    >
                        <option value="meta">Meta Official</option>
                        <option value="evolution">Evolution API</option>
                    </select>
                </div>

                <InputField label="Categoria (Meta)" value={form.category} onChange={(v) => setForm({ ...form, category: v })} placeholder="MARKETING" />
                <InputField label="Idioma" value={form.language} onChange={(v) => setForm({ ...form, language: v })} placeholder="pt_BR" />
            </div>

            <div className="mt-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-secondary-gray-500 mb-1.5 block">Conteúdo / JSON (Opcional)</label>
                <textarea
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    placeholder='{"components": [...] } ou texto puro'
                    className="w-full h-24 bg-navy-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-secondary-gray-600 focus:border-brand-500/50 outline-none transition-colors font-mono"
                />
            </div>

            <div className="flex items-center gap-3 mt-5">
                <button onClick={handleSave} disabled={saving || !form.name} className="px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50 cursor-pointer">
                    {saving ? "Salvando..." : "Salvar Template"}
                </button>
                {isNew && onCancel && (
                    <button onClick={onCancel} className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-secondary-gray-400 text-sm font-bold rounded-xl transition-colors cursor-pointer">
                        Cancelar
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
        label: "Resumo Executivo",
        description: "Prompt do Sistema para gerar resumos de conversas.",
        placeholder: "Você é um assistente executivo... (Defina a persona e regras aqui)",
        icon: <Brain className="h-5 w-5 text-pink-500" />
    },
    {
        id: "PROMPT_ALERT_SYSTEM",
        label: "Análise de Alertas",
        description: "Prompt base para detecção de anomalias (fallback).",
        placeholder: "Analise o texto em busca de riscos... (Defina critérios globais aqui)",
        icon: <Shield className="h-5 w-5 text-yellow-500" />
    },
    {
        id: "PROMPT_INSIGHT_SYSTEM",
        label: "Geração de Insights",
        description: "Prompt para extrair comportamento dos membros.",
        placeholder: "Identifique padrões de comportamento... (Defina foco psicológico aqui)",
        icon: <Lightbulb className="h-5 w-5 text-cyan-500" />
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
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 max-w-6xl mx-auto h-[calc(100vh-200px)] min-h-[500px]">
            {/* Sidebar List */}
            <div className="md:col-span-4 bg-navy-900/50 border border-white/5 rounded-2xl p-4 overflow-y-auto">
                <h3 className="text-sm font-black text-white uppercase tracking-widest px-2 mb-4">Prompts Disponíveis</h3>
                <div className="space-y-2">
                    {PROMPT_DEFINITIONS.map((def) => (
                        <button
                            key={def.id}
                            onClick={() => setSelectedPromptId(def.id)}
                            className={`w-full text-left p-4 rounded-xl border transition-all group relative overflow-hidden ${selectedPromptId === def.id
                                ? "bg-navy-800 border-pink-500/50 shadow-lg"
                                : "bg-navy-950 border-white/5 hover:bg-navy-800 hover:border-white/10"
                                }`}
                        >
                            <div className="flex items-start gap-4 z-10 relative">
                                <div className={`p-2 rounded-lg ${selectedPromptId === def.id ? "bg-white/10" : "bg-black/20"}`}>
                                    {def.icon}
                                </div>
                                <div>
                                    <h4 className={`font-bold text-sm ${selectedPromptId === def.id ? "text-white" : "text-gray-300"}`}>
                                        {def.label}
                                    </h4>
                                    <p className="text-secondary-gray-500 text-xs mt-1 line-clamp-2">
                                        {def.description}
                                    </p>
                                </div>
                            </div>
                            {selectedPromptId === def.id && (
                                <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-pink-500 to-purple-500" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Editor */}
            <div className="md:col-span-8 h-full">
                <PremiumCard className="h-full flex flex-col p-6">
                    <div className="flex items-center justify-between border-b border-white/5 pb-6 mb-6">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-pink-500/10 flex items-center justify-center">
                                {activeDef.icon}
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-white">{activeDef.label}</h2>
                                <p className="text-xs text-secondary-gray-500 font-mono opacity-70">{activeDef.id}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-6 py-2.5 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-pink-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                        >
                            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {saving ? "Salvando..." : "Salvar"}
                        </button>
                    </div>

                    <div className="flex-1 min-h-0 relative group">
                        <textarea
                            value={localValue}
                            onChange={(e) => setLocalValue(e.target.value)}
                            className="w-full h-full bg-navy-950 border border-white/10 rounded-xl px-5 py-4 text-sm text-white placeholder:text-secondary-gray-600 focus:border-pink-500/50 outline-none transition-colors leading-relaxed resize-none font-mono"
                            placeholder={activeDef.placeholder}
                        />
                        <div className="absolute bottom-4 right-4 bg-black/60 text-white px-2 py-1 rounded text-xs backdrop-blur pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                            {localValue.length} caracteres
                        </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-xs text-secondary-gray-500">
                        <Info className="h-3 w-3" />
                        <p>Esta instrução define o comportamento global da IA para este tipo de tarefa.</p>
                    </div>
                </PremiumCard>
            </div>
        </div>
    );
}

// ─── Shared Components ───

function StatCard({ icon, color, label, value, sub }: { icon: React.ReactNode; color: string; label: string; value: string | number; sub: string }) {
    const colorMap: Record<string, string> = {
        green: "bg-green-500/10 text-green-500 border-green-500/20",
        emerald: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
        blue: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        amber: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    };

    return (
        <PremiumCard className="p-5">
            <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${colorMap[color]}`}>
                    {icon}
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-secondary-gray-500">{label}</p>
                    <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-black text-white">{value}</p>
                        <span className="text-xs font-bold text-secondary-gray-500">{sub}</span>
                    </div>
                </div>
            </div>
        </PremiumCard>
    );
}

function StatusBadge({ active }: { active: boolean }) {
    return (
        <div className="flex items-center gap-1.5">
            <div className={`h-2 w-2 rounded-full ${active ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
            <span className={`text-[10px] font-black uppercase ${active ? "text-green-500" : "text-red-500"}`}>
                {active ? "Ativo" : "Inativo"}
            </span>
        </div>
    );
}

function InputField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
    return (
        <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-secondary-gray-500 mb-1.5 block">{label}</label>
            <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-navy-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-secondary-gray-600 focus:border-brand-500/50 focus:outline-none transition-colors"
            />
        </div>
    );
}
