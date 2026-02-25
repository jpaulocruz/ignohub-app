"use client";

import React, { useState, useEffect, useCallback, useRef, ReactNode, ReactElement, cloneElement } from "react";
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
import { useTranslations } from "next-intl";

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

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

const TAB_GROUPS: { title: string; items: { id: TabId; key: string; icon: ReactElement; activeColor: string; activeBg: string; }[] }[] = [
    {
        title: "channels",
        items: [
            { id: "collection", key: "whatsapp_collection", icon: <QrCode className="h-4 w-4" />, activeColor: "text-green-600 dark:text-green-400", activeBg: "bg-green-600/10" },
            { id: "official", key: "whatsapp_official", icon: <Send className="h-4 w-4" />, activeColor: "text-green-600 dark:text-green-400", activeBg: "bg-green-600/10" },
            { id: "telegram", key: "telegram_unit", icon: <Bot className="h-4 w-4" />, activeColor: "text-sky-600 dark:text-sky-400", activeBg: "bg-sky-600/10" },
        ],
    },
    {
        title: "intelligence",
        items: [
            { id: "messages", key: "message_protocol", icon: <MessageSquare className="h-4 w-4" />, activeColor: "text-primary", activeBg: "bg-primary/10" },
            { id: "prompts", key: "neural_prompts", icon: <Brain className="h-4 w-4" />, activeColor: "text-amber-600 dark:text-amber-400", activeBg: "bg-amber-600/10" },
            { id: "monitor", key: "intelligence_monitor", icon: <Activity className="h-4 w-4" />, activeColor: "text-primary", activeBg: "bg-primary/10" },
        ],
    },
];

interface AssetStats {
    presetCounts: Record<string, number>;
    platformCounts: Record<string, number>;
}

interface EvolutionInstance {
    id: string;
    instance_name: string;
    status: string;
    is_active: boolean;
    provider: string;
    groups_count?: number;
    instance_key?: string;
    qr_code_base64?: string;
    is_system_bot?: boolean;
}

interface WhatsAppConfig {
    id: string;
    phone_number_id: string;
    waba_id: string;
    display_number: string;
    access_token_encrypted?: string;
    verify_token?: string;
    is_active: boolean;
    is_system_bot?: boolean;
}

interface AgentPreset {
    id: string;
    name: string;
    bot_link?: string;
    telegram_bot_username?: string;
    whatsapp_support_number?: string;
    is_active: boolean;
    preserve_context?: boolean;
}

interface TokenUsage {
    name: string;
    tokens: number;
    platform: string;
}

interface WhatsAppTemplate {
    id: string;
    name: string;
    platform: string;
    category: string;
    language: string;
    content: string;
    is_active: boolean;
}

export default function AdminAssetsPage() {
    const t = useTranslations("assets");
    const [activeTab, setActiveTab] = useState<TabId>("collection");
    const [outboundMeta, setOutboundMeta] = useState<WhatsAppConfig[]>([]);
    const [instances, setInstances] = useState<EvolutionInstance[]>([]);
    const [presets, setPresets] = useState<AgentPreset[]>([]);
    const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
    const [tokenUsage, setTokenUsage] = useState<TokenUsage[]>([]);
    const [aiSettings, setAiSettings] = useState<Record<string, string>>({});
    const [globalTemplateSettings, setGlobalTemplateSettings] = useState<Record<string, string>>({});
    const [loadStats, setLoadStats] = useState<AssetStats>({ presetCounts: {}, platformCounts: {} });
    const [loading, setLoading] = useState(true);
    const [syncingTemplates, setSyncingTemplates] = useState(false);

    const handleSyncTemplates = async () => {
        setSyncingTemplates(true);
        try {
            const res = await syncMetaTemplates();
            if (res.success) {
                alert(`${t("conected_success")} ${res.count} templates processados.`);
                fetchAll();
            }
        } catch (e: any) {
            alert(e.message || t("connection_failed"));
        } finally {
            setSyncingTemplates(false);
        }
    };

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
            setOutboundMeta((meta || []) as WhatsAppConfig[]);
            setInstances((inst || []) as EvolutionInstance[]);
            setPresets((pres || []) as AgentPreset[]);
            setLoadStats((stats as AssetStats) || { presetCounts: {}, platformCounts: {} });
            setTokenUsage(usage || []);
            setAiSettings(ai || {});
            setTemplates((tmpls || []) as WhatsAppTemplate[]);
            setGlobalTemplateSettings(gTmpls || {});
        } catch (e) {
            console.error("Failed to fetch assets:", e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const evolutionInstances = instances.filter((i) => i.provider === "evolution");
    const telegramInstances = instances.filter((i) => i.provider === "telegram");
    const telegramGroupCount = telegramInstances.reduce((acc, inst) => acc + (inst.groups_count || 0), 0);

    return (
        <div className="space-y-6 pb-12">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    {t('subtitle')}
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabId)} className="w-full">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Section Navigation */}
                    <aside className="lg:w-64 shrink-0">
                        <TabsList className="flex flex-col h-auto bg-transparent border-none gap-6 p-0 items-start">
                            {TAB_GROUPS.map((group) => (
                                <div key={group.title} className="w-full space-y-1">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-2 pb-2">
                                        {t(group.title)}
                                    </p>
                                    <div className="space-y-1">
                                        {group.items.map((tab) => (
                                            <TabsTrigger
                                                key={tab.id}
                                                value={tab.id}
                                                className={cn(
                                                    "w-full justify-start gap-3 h-11 px-3 text-[13px] font-medium transition-all",
                                                    "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:bg-muted/50",
                                                    "data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground data-[state=active]:shadow-sm"
                                                )}
                                            >
                                                <div className={cn(
                                                    "flex items-center justify-center h-8 w-8 rounded-lg shrink-0 transition-colors",
                                                    activeTab === tab.id ? tab.activeBg : "bg-muted/50"
                                                )}>
                                                    {cloneElement(tab.icon as ReactElement<{ className?: string }>, {
                                                        className: cn("h-4 w-4", activeTab === tab.id ? tab.activeColor : "text-muted-foreground/70")
                                                    })}
                                                </div>
                                                {t(tab.key)}
                                            </TabsTrigger>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </TabsList>
                    </aside>

                    {/* Main Content Area */}
                    <main className="flex-1 min-w-0">
                        {loading ? (
                            <LoadingSkeleton />
                        ) : (
                            <div className="relative">
                                <TabsContent value="collection" className="mt-0 focus-visible:ring-0">
                                    <CollectionTab instances={evolutionInstances} loadStats={loadStats} onRefresh={fetchAll} t={t} />
                                </TabsContent>
                                <TabsContent value="official" className="mt-0 focus-visible:ring-0">
                                    <OfficialTab configs={outboundMeta} loadStats={loadStats} onRefresh={fetchAll} t={t} />
                                </TabsContent>
                                <TabsContent value="telegram" className="mt-0 focus-visible:ring-0">
                                    <TelegramTab instances={telegramInstances} presets={presets} loadStats={loadStats} onRefresh={fetchAll} t={t} />
                                </TabsContent>
                                <TabsContent value="messages" className="mt-0 focus-visible:ring-0">
                                    <MessagesTab
                                        templates={templates}
                                        globalTemplateSettings={globalTemplateSettings}
                                        onRefresh={fetchAll}
                                        syncing={syncingTemplates}
                                        handleSync={handleSyncTemplates}
                                        t={t}
                                    />
                                </TabsContent>
                                <TabsContent value="monitor" className="mt-0 focus-visible:ring-0">
                                    <MonitorTab usage={tokenUsage} aiSettings={aiSettings} onRefresh={fetchAll} t={t} />
                                </TabsContent>
                                <TabsContent value="prompts" className="mt-0 focus-visible:ring-0">
                                    <PromptsTab aiSettings={aiSettings} onRefresh={fetchAll} t={t} />
                                </TabsContent>
                            </div>
                        )}
                    </main>
                </div>
            </Tabs>
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

function CollectionTab({ instances, loadStats, onRefresh, t }: { instances: any[]; loadStats: any; onRefresh: () => void, t: any }) {
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
                    error: t("qr_not_available")
                }));
            }
        } catch (e) {
            setQrModal(prev => ({
                ...prev,
                loading: false,
                error: t("connection_failed")
            }));
        }
    };

    const handleCreate = async () => {
        if (!newName.trim()) return;
        setSaving(true);
        setError(null);
        try {
            const result = await createEvolutionInstance(newName.trim());

            if (result.error) {
                setError(result.error);
                return;
            }

            const instanceId = result.instance?.id || "";
            setNewName("");
            setShowNewForm(false);
            onRefresh();

            // Open QR modal if we got a QR from creation
            if (result.qr) {
                setQrModal({ open: true, qr: result.qr, name: newName, dbId: instanceId, state: "qr_ready" });
                startPolling(newName.trim(), instanceId);
            }
        } catch (e: any) {
            setError(e.message || t("connection_failed"));
        } finally {
            setSaving(false);
        }
    };

    const handleConnect = async (inst: any) => {
        setError(null);
        try {
            const result = await connectEvolutionInstance(inst.instance_name, inst.id);
            if (result.error) {
                setError(result.error);
                return;
            }
            if (result.qr) {
                setQrModal({ open: true, qr: result.qr, name: inst.instance_name, dbId: inst.id, state: "qr_ready" });
                startPolling(inst.instance_name, inst.id);
            } else {
                setError(t("qr_not_available"));
                onRefresh();
            }
        } catch (e: any) {
            setError(e.message || t("connection_failed"));
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
            if (result.error) {
                setError(result.error);
            } else {
                onRefresh();
            }
        } catch (e: any) {
            setError(e.message || t("connection_failed"));
        } finally {
            setSyncing(false);
        }
    };

    const handleDelete = async (inst: any) => {
        if (!confirm(`Remover instância "${inst.instance_name}"? Isso a desconecta da Evolution API também.`)) return;
        try {
            const result = await deleteEvolutionInstance(inst.id, inst.instance_name);
            if ((result as any).error) {
                setError((result as any).error);
            } else {
                onRefresh();
            }
        } catch (e: any) {
            setError(e.message || t("connection_failed"));
        }
    };

    const handleToggle = async (id: string, active: boolean) => {
        const result = await toggleCollectionStatus(id, active);
        if (result.error) {
            setError(result.error);
        } else {
            onRefresh();
        }
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
        setConnTest({ status: "testing", message: t("testing_connection") });
        try {
            const res = await testEvolutionConnection();
            if (res.success) {
                setConnTest({ status: "success", message: t("connection_ok", { count: res.count, duration: res.duration }) });
                setTimeout(() => setConnTest({ status: "idle", message: "" }), 5000);
            } else {
                setConnTest({ status: "error", message: res.error || t("connection_failed") });
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
            const result = await saveEvolutionConfig(cleanUrl, configForm.apiKey.trim());

            if (result.error) {
                setError(result.error);
            } else {
                await checkConfig();
                setEditingConfig(false);
                onRefresh(); // Refresh instances with new config
            }
        } catch (e: any) {
            setError(e.message || t("connection_failed"));
        } finally {
            setSaving(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "open": return { bg: "bg-green-500/10", text: "text-green-500", border: "border-green-500/20", label: t("status_open") };
            case "connecting": return { bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/20", label: t("status_connecting") };
            case "qr_ready": return { bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/20", label: t("status_qr_ready") };
            default: return { bg: "bg-red-500/10", text: "text-red-500", border: "border-red-500/20", label: t("status_dormant") };
        }
    };

    if (configStatus === "loading") {
        return (
            <div className="flex items-center justify-center p-12">
                <RefreshCw className="h-6 w-6 text-primary animate-spin" />
            </div>
        );
    }

    if (configStatus === "missing" || editingConfig) {
        return (
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-center gap-3 mb-6">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingConfig(false)}
                        disabled={configStatus === "missing"}
                        className={cn(configStatus === "missing" && "hidden")}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h2 className="text-xl font-bold tracking-tight">{t("evolution_config_title")}</h2>
                </div>

                <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3">
                            <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <p className="text-sm text-blue-300 font-medium">{t("credentials_needed")}</p>
                                <p className="text-xs text-blue-400/80">
                                    {t("credentials_desc")}
                                </p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("url_api")}</Label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        value={configForm.url}
                                        onChange={(e) => setConfigForm(prev => ({ ...prev, url: e.target.value }))}
                                        placeholder="https://api.seudominio.com"
                                        className="pl-9 h-11"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("global_api_key")}</Label>
                                <div className="relative">
                                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        value={configForm.apiKey}
                                        onChange={(e) => setConfigForm(prev => ({ ...prev, apiKey: e.target.value }))}
                                        placeholder="Ex: 44299384-..."
                                        className="pl-9 h-11"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Connection Test Feedback */}
                        {connTest.message && (
                            <div className={cn(
                                "p-3 rounded-lg flex items-center gap-2 text-sm",
                                connTest.status === "success" ? "bg-green-500/10 text-green-500" :
                                    connTest.status === "error" ? "bg-red-500/10 text-red-500" : "bg-blue-500/10 text-blue-500"
                            )}>
                                {connTest.status === "testing" && <RefreshCw className="h-4 w-4 animate-spin" />}
                                {connTest.status === "success" && <Check className="h-4 w-4" />}
                                {connTest.status === "error" && <AlertTriangle className="h-4 w-4" />}
                                <span className="text-xs font-medium">{connTest.message}</span>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex justify-end gap-3 pt-2">
                        <Button
                            variant="outline"
                            onClick={handleTestConnection}
                            disabled={connTest.status === "testing" || !configForm.url || !configForm.apiKey}
                            className="h-10 px-6"
                        >
                            {t("test_connection")}
                        </Button>
                        <Button
                            onClick={handleSaveConfig}
                            disabled={saving || !configForm.url || !configForm.apiKey}
                            className="h-10 px-6 gap-2"
                        >
                            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {saving ? t("saving") : t("save_configuration")}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Error Banner */}
            {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                        <p className="text-[13px] font-medium text-destructive">{error}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setError(null)} className="h-7 w-7 text-destructive hover:bg-destructive/10">
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}

            {/* Header / Actions Row */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1 w-full">
                    <StatCard icon={<QrCode className="h-4 w-4" />} color="green" label={t("instances_evolution")} value={instances.length} sub={t("configuradas")} />
                    <StatCard icon={<Smartphone className="h-4 w-4" />} color="green" label={t("connected")} value={instances.filter(i => i.status === "open").length} sub={`${t("de")} ${instances.length}`} />
                    <StatCard icon={<Activity className="h-4 w-4" />} color="green" label={t("groups_whatsapp")} value={loadStats.platformCounts?.whatsapp || 0} sub={t("collecting_messages")} />
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={handleTestConnection}
                                    disabled={connTest.status === "testing"}
                                    className="h-10 w-10"
                                >
                                    <Activity className={cn("h-4 w-4", connTest.status === "testing" && "animate-pulse")} />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Testar Conexão API</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setEditingConfig(true)}
                                    className="h-10 w-10"
                                >
                                    <Settings className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Configurações da API</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <Button
                        variant="outline"
                        onClick={handleSync}
                        disabled={syncing}
                        className="h-10 gap-2 text-muted-foreground hover:text-foreground"
                    >
                        <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />
                        {syncing ? t("syncing") : t("sync")}
                    </Button>

                    <Button
                        onClick={() => setShowNewForm(true)}
                        className="h-10 gap-2 shadow-sm"
                    >
                        <Plus className="h-4 w-4" />
                        {t("add_instance")}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {instances.map((inst) => {
                    const statusInfo = getStatusColor(inst.status);
                    return (
                        <Card key={inst.id} className="group relative overflow-hidden border-border/40 hover:border-primary/30 transition-all bg-card/30 backdrop-blur-sm">
                            <div className={cn("absolute top-0 left-0 w-1 h-full",
                                inst.status === "open" ? "bg-green-500" :
                                    inst.status === "connecting" ? "bg-amber-500" : "bg-muted"
                            )} />
                            <CardHeader className="p-4 pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-bold tracking-tight uppercase truncate pr-4">
                                        {inst.instance_name}
                                    </CardTitle>
                                    <Badge variant="outline" className={cn("h-5 text-[10px] font-bold uppercase tracking-widest", statusInfo.bg, statusInfo.text, statusInfo.border)}>
                                        <div className={cn("h-1 w-1 rounded-full bg-current mr-1.5", inst.status === "open" && "animate-pulse")} />
                                        {statusInfo.label}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-0 space-y-3">
                                <div className="flex items-center gap-4 text-[11px] text-muted-foreground font-medium">
                                    <div className="flex items-center gap-1.5">
                                        <MessageSquare className="h-3.5 w-3.5 opacity-60" />
                                        <span>{(inst.groups_count ?? 0) === 1 ? t("unit_synced", { count: inst.groups_count ?? 0 }) : t("units_synced", { count: inst.groups_count ?? 0 })}</span>
                                    </div>
                                    {inst.instance_key && (
                                        <div className="font-mono opacity-60 tracking-tight">
                                            ID: {inst.instance_key.slice(0, 8)}...
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                            <CardFooter className="p-4 pt-0 flex items-center justify-between border-t border-border/5 metadata-footer">
                                <div className="flex items-center gap-1">
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    disabled={inst.status === "open"}
                                                    onClick={() => handleConnect(inst)}
                                                    className="h-8 w-8 text-muted-foreground hover:text-green-500 hover:bg-green-500/10"
                                                >
                                                    <QrCode className="h-3.5 w-3.5" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>{t("protocol_link_qr")}</TooltipContent>
                                        </Tooltip>

                                        {inst.qr_code_base64 && inst.status !== "open" && (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleOpenQr(inst)}
                                                        className="h-8 w-8 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10"
                                                    >
                                                        <Eye className="h-3.5 w-3.5" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>{t("inspect_qr")}</TooltipContent>
                                            </Tooltip>
                                        )}

                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={async () => {
                                                        await setSystemBot(inst.id, "admin_collection_instances");
                                                        onRefresh();
                                                    }}
                                                    className={cn(
                                                        "h-8 w-8",
                                                        inst.is_system_bot ? "text-primary hover:bg-primary/10" : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                                                    )}
                                                >
                                                    <Star className={cn("h-3.5 w-3.5", inst.is_system_bot && "fill-current")} />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>{inst.is_system_bot ? t("system_core_active") : t("map_to_system_core")}</TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>

                                <div className="flex items-center gap-1">
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className="flex items-center mr-2">
                                                    <Switch
                                                        checked={inst.is_active}
                                                        onCheckedChange={() => handleToggle(inst.id, inst.is_active)}
                                                        className="scale-75"
                                                    />
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent>{inst.is_active ? t("terminate_protocol") : t("initialize_protocol")}</TooltipContent>
                                        </Tooltip>

                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(inst)}
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>{t("purge_identity")}</TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>

            {/* New Instance Form */}
            {showNewForm ? (
                <Card className="border-2 border-dashed border-green-500/30 bg-green-500/5 overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-xl font-bold flex items-center gap-3 uppercase tracking-tight">
                            <Plus className="h-6 w-6 text-green-500" /> {t("new_registry_unit")}
                        </CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-background/50 p-3 border border-border/40 rounded-sm">
                            {t("unit_identity_desc")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">{t("unit_identity")}</Label>
                            <Input
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="ex: unit-alpha-registry"
                                className="max-w-md bg-background/50 border-border/40 focus:border-green-500/50"
                                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex items-center gap-3">
                        <Button
                            onClick={handleCreate}
                            disabled={saving || !newName.trim()}
                            className="bg-green-600 hover:bg-green-700 h-10 px-8 flex items-center gap-3 uppercase text-[10px] font-bold tracking-widest"
                        >
                            {saving ? (
                                <><RefreshCw className="h-4 w-4 animate-spin" /> {t("syncing")}</>
                            ) : (
                                <><Plus className="h-4 w-4" /> {t("initialize_unit")}</>
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => { setShowNewForm(false); setError(null); }}
                            className="h-10 px-8 uppercase text-[10px] font-bold tracking-widest"
                        >
                            {t("abort")}
                        </Button>
                    </CardFooter>
                </Card>
            ) : (
                <Button
                    variant="outline"
                    onClick={() => setShowNewForm(true)}
                    className="w-full h-24 border-dashed border-border/60 hover:border-green-500/50 hover:bg-green-500/5 transition-all group flex flex-col gap-2"
                >
                    <Plus className="h-6 w-6 text-muted-foreground group-hover:text-green-500 transition-colors" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground group-hover:text-green-500 transition-colors">{t("initialize_new_unit")}</span>
                </Button>
            )}

            {/* QR Code Modal with Auto-Polling */}
            <Dialog open={qrModal.open} onOpenChange={(open) => !open && handleCloseQrModal()}>
                <DialogContent className="max-w-sm rounded-2xl p-0 overflow-hidden border-border/40">
                    <DialogHeader className="p-6 pb-0">
                        <DialogTitle className="text-xl font-bold">{t("qr_code_title")}</DialogTitle>
                        <DialogDescription className="text-sm font-medium">{qrModal.name}</DialogDescription>
                    </DialogHeader>

                    <div className="p-6">
                        {qrModal.state === "open" ? (
                            <div className="text-center py-8">
                                <div className="h-16 w-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
                                    <Check className="h-8 w-8 text-green-500" />
                                </div>
                                <p className="text-lg font-bold text-green-600 dark:text-green-500">{t("conected_success")}</p>
                                <p className="text-sm text-muted-foreground mt-2">{t("whatsapp_linked_success")}</p>
                                <p className="text-xs text-muted-foreground mt-1">{t("messages_collecting")}</p>
                            </div>
                        ) : (
                            <>
                                <div className="bg-white rounded-xl p-6 flex items-center justify-center min-h-[250px] border border-border/10">
                                    {qrModal.loading ? (
                                        <div className="py-8 text-center">
                                            <RefreshCw className="h-8 w-8 text-muted-foreground animate-spin mx-auto mb-3" />
                                            <p className="text-muted-foreground font-medium text-sm">{t("generating_qr")}</p>
                                        </div>
                                    ) : qrModal.error ? (
                                        <div className="text-center py-8">
                                            <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-3" />
                                            <p className="text-destructive font-medium text-sm">{qrModal.error}</p>
                                            <Button
                                                variant="outline"
                                                onClick={() => qrModal.name && qrModal.dbId && handleOpenQr({ instance_name: qrModal.name, id: qrModal.dbId, status: qrModal.state })}
                                                className="mt-4"
                                            >
                                                {t("try_again")}
                                            </Button>
                                        </div>
                                    ) : qrModal.qr ? (
                                        <img src={qrModal.qr.startsWith("data:") ? qrModal.qr : `data:image/png;base64,${qrModal.qr}`} alt="QR Code" className="w-full h-auto rounded-lg" />
                                    ) : (
                                        <div className="py-8 text-center">
                                            <p className="text-muted-foreground text-sm">{t("qr_not_available")}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-center gap-2 mt-6">
                                    <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                                    <p className="text-xs text-muted-foreground">
                                        {t("waiting_scan")}
                                    </p>
                                </div>

                                <p className="text-[10px] text-muted-foreground text-center mt-3 font-semibold uppercase tracking-wider">
                                    {t("scan_instructions")}
                                </p>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Info Card */}
            <Card className="border-green-500/20 bg-green-500/5">
                <CardContent className="p-5 flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center border border-green-500/20 shrink-0 mt-0.5">
                        <Shield className="h-5 w-5 text-green-600 dark:text-green-500" />
                    </div>
                    <div>
                        <p className="text-sm font-bold uppercase tracking-tight">{t("auto_config")}</p>
                        <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed font-medium">
                            {t("auto_config_desc")}
                            <strong className="text-green-600 dark:text-green-400"> groupsIgnore: false</strong>,
                            <strong className="text-amber-600 dark:text-amber-400"> rejectCall: true</strong>,
                            <span className="text-foreground"> alwaysOnline: true</span>.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// ─── Tab 2: WhatsApp Official (Meta) ───

function OfficialTab({ configs, loadStats, onRefresh, t }: { configs: WhatsAppConfig[]; loadStats: AssetStats; onRefresh: () => void, t: any }) {
    const [showNew, setShowNew] = useState(false);
    const whatsappGroupCount = loadStats.platformCounts?.whatsapp || 0;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <StatCard icon={<Shield />} color="emerald" label={t("meta_numbers")} value={configs.length} sub={t("configuradas")} />
                <StatCard icon={<Send />} color="emerald" label={t("active_shots")} value={whatsappGroupCount} sub={t("groups_receiving")} />
            </div>

            {configs.map((config) => (
                <OutboundMetaCard key={config.id} config={config} groupCount={whatsappGroupCount} onRefresh={onRefresh} t={t} />
            ))}

            {showNew ? (
                <OutboundMetaCard config={null} isNew groupCount={0} onRefresh={() => { onRefresh(); setShowNew(false); }} onCancel={() => setShowNew(false)} t={t} />
            ) : (
                <Button
                    variant="outline"
                    onClick={() => setShowNew(true)}
                    className="w-full h-24 border-dashed border-border/60 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group flex flex-col gap-2"
                >
                    <Plus className="h-6 w-6 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground group-hover:text-emerald-500 transition-colors">{t("authorize_meta_protocol")}</span>
                </Button>
            )}
        </div>
    );
}

function OutboundMetaCard({ config, isNew, groupCount, onRefresh, onCancel, t }: {
    config: WhatsAppConfig | null; isNew?: boolean; groupCount: number; onRefresh: () => void; onCancel?: () => void; t: any;
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
    const [error, setError] = useState<string | null>(null);

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            const res = await saveWhatsAppConfig({ id: config?.id, ...form });
            if (res.error) {
                setError(res.error);
            } else {
                onRefresh();
            }
        } catch (e: any) {
            console.error(e);
            setError(e.message || "Erro ao salvar configuração.");
        }
        finally { setSaving(false); }
    };

    const handleDelete = async () => {
        if (!config?.id || !confirm(t("connection_failed"))) return;
        setError(null);
        try {
            const res = await deleteWhatsAppConfig(config.id);
            if (res.error) {
                setError(res.error);
            } else {
                onRefresh();
            }
        } catch (e: any) {
            setError(e.message || "Erro ao excluir configuração.");
        }
    };

    const handleToggle = async () => {
        if (!config?.id) return;
        setError(null);
        try {
            const res = await toggleWhatsAppStatus(config.id, config.is_active);
            if (res.error) {
                setError(res.error);
            } else {
                onRefresh();
            }
        } catch (e: any) {
            setError(e.message || "Erro ao alterar status.");
        }
    };

    const copyVerifyToken = () => {
        navigator.clipboard.writeText(form.verify_token);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Card className={cn(
            "overflow-hidden border-border/40 transition-all bg-card/30 backdrop-blur-sm",
            isNew && "border-primary/50 border-dashed"
        )}>
            <CardHeader className="p-6 pb-4 flex flex-row items-center justify-between border-b border-border/5">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                        <Shield className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div>
                        <CardTitle className="text-sm font-bold tracking-tight uppercase">
                            {isNew ? t("new_meta_protocol") : (config?.display_number || config?.phone_number_id)}
                        </CardTitle>
                        <div className="flex items-center gap-3 mt-1.5">
                            {!isNew && <StatusBadge active={config?.is_active || false} t={t} />}
                        </div>
                    </div>
                </div>

                {!isNew && (
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={async () => {
                                if (!config?.id) return;
                                setError(null);
                                const result = await setSystemBot(config.id, "admin_outbound_meta");
                                if (result?.error) setError(result.error);
                                else onRefresh();
                            }}
                            className={cn(
                                "h-8 w-8",
                                config?.is_system_bot ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                            )}
                            title={config?.is_system_bot ? "System Core Active" : "Map to System Core"}
                        >
                            <Star className={cn("h-4 w-4", config?.is_system_bot ? "fill-current" : "")} />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleToggle}
                            className={cn(
                                "h-8 w-8",
                                config?.is_active ? "text-green-500 hover:text-red-500 bg-green-500/10 hover:bg-red-500/10" : "text-red-500 hover:text-green-500 bg-red-500/10 hover:bg-green-500/10"
                            )}
                        >
                            <Power className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleDelete}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </CardHeader>

            <CardContent className="p-6 space-y-6">
                {error && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                            <p className="text-xs font-semibold text-destructive">{error}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setError(null)} className="h-6 w-6 text-destructive hover:bg-destructive/10">
                            <X className="h-3 w-3" />
                        </Button>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField label="Phone Number ID" value={form.phone_number_id} onChange={(v) => setForm({ ...form, phone_number_id: v })} placeholder="123456789" />
                    <InputField label="WABA ID" value={form.waba_id} onChange={(v) => setForm({ ...form, waba_id: v })} placeholder="1234567890" />
                    <InputField label="Display Number" value={form.display_number} onChange={(v) => setForm({ ...form, display_number: v })} placeholder="+55 11 99999-0000" />
                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">{t("cryptographic_token")}</Label>
                        <div className="relative">
                            <Input
                                type={showToken ? "text" : "password"}
                                value={form.access_token}
                                onChange={(e) => setForm({ ...form, access_token: e.target.value })}
                                placeholder="EAAxxxxxxx..."
                                className="bg-background/50 border-border/40 focus:border-primary/50 pr-12 font-mono h-10 text-sm"
                            />
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowToken(!showToken)}
                                className="absolute right-1 top-1 text-muted-foreground hover:text-foreground h-8 w-8"
                            >
                                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                </div>

                {config?.verify_token && (
                    <div className="flex items-center gap-4 p-4 bg-muted/30 border border-border/40 rounded-lg group">
                        <div className="flex flex-col gap-1 min-w-0">
                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{t("protocol_verify_token")}</span>
                            <code className="text-[11px] text-primary font-mono font-bold tracking-tight truncate max-w-sm uppercase">{config.verify_token}</code>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={copyVerifyToken}
                            className="ml-auto h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10 border border-transparent hover:border-primary/20"
                        >
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                    </div>
                )}
            </CardContent>

            <CardFooter className="p-6 pt-0 flex items-center gap-3">
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 sm:flex-none h-10 px-8 flex items-center gap-3 uppercase text-[10px] font-bold tracking-widest bg-emerald-600 hover:bg-emerald-700"
                >
                    {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {saving ? t("syncing") : t("authorize_registry")}
                </Button>
                {isNew && onCancel && (
                    <Button
                        variant="outline"
                        onClick={onCancel}
                        className="h-10 px-8 uppercase text-[10px] font-bold tracking-widest"
                    >
                        {t("abort")}
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}

// ─── Tab 3: Telegram ───

function TelegramTab({ instances, presets, loadStats, onRefresh, t }: { instances: any[]; presets: AgentPreset[]; loadStats: AssetStats; onRefresh: () => void, t: any }) {
    const [showNewBot, setShowNewBot] = useState(false);
    const [newBotName, setNewBotName] = useState("");
    const [newBotKey, setNewBotKey] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCreateBot = async () => {
        if (!newBotName.trim()) return;
        setSaving(true);
        setError(null);
        try {
            const result = await saveCollectionInstance({ provider: "telegram", instance_name: newBotName, instance_key: newBotKey || undefined });
            if (result.error) {
                setError(result.error);
            } else {
                setNewBotName("");
                setNewBotKey("");
                setShowNewBot(false);
                onRefresh();
            }
        } catch (e: any) {
            console.error(e);
            setError(e.message || "Erro ao criar bot.");
        }
        finally { setSaving(false); }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard icon={<Bot className="h-4 w-4" />} color="blue" label={t("bots_telegram")} value={instances.length} sub={t("configuradas")} />
                <StatCard icon={<Globe className="h-4 w-4" />} color="blue" label={t("active_groups")} value={instances.reduce((acc, inst) => acc + (inst.groups_count || 0), 0)} sub={t("monitored")} />
                <StatCard icon={<Activity className="h-4 w-4" />} color="blue" label={t("linked_presets")} value={presets.length} sub={t("configuradas")} />
            </div>

            {/* Existing Telegram Instances */}
            {instances.map((inst) => (
                <Card key={inst.id} className="overflow-hidden border-border/40 transition-all bg-card/30 backdrop-blur-sm hover:border-sky-500/40 group">
                    <CardContent className="p-6 flex items-center justify-between gap-6">
                        <div className="flex items-center gap-5 min-w-0">
                            <div className="h-12 w-12 rounded-sm bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0">
                                <Bot className="h-6 w-6 text-blue-500" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-bold tracking-tight uppercase truncate">{inst.instance_name}</p>
                                <div className="flex items-center gap-3 mt-1.5">
                                    <StatusBadge active={inst.is_active || false} t={t} />
                                    <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest bg-background/50 border-border/40">
                                        {inst.groups_count === 1 ? t("unit_syncs", { count: inst.groups_count }) : t("unit_syncs", { count: inst.groups_count })}
                                    </Badge>
                                </div>
                                {inst.instance_key && (
                                    <p className="text-[10px] text-muted-foreground font-mono mt-2 tracking-tight uppercase">Protocol: ••••{inst.instance_key.slice(-8)}</p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={async () => {
                                    const result = await toggleCollectionStatus(inst.id, inst.is_active || false);
                                    if (result.error) alert(result.error);
                                    else onRefresh();
                                }}
                                className={cn(
                                    "h-10 w-10",
                                    inst.is_active ? "text-green-500 hover:text-red-500 bg-green-500/10 hover:bg-red-500/10" : "text-red-500 hover:text-green-500 bg-red-500/10 hover:bg-green-500/10"
                                )}
                                title={inst.is_active ? "Dormant" : "Awaken"}
                            >
                                <Power className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={async () => {
                                    if (!confirm(t("confirm_delete"))) return;
                                    const result = await deleteCollectionInstance(inst.id);
                                    if (result.error) alert(result.error);
                                    else onRefresh();
                                }}
                                className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}

            {/* Agent Presets with Edit Option */}
            <div className="space-y-3">
                <h3 className="text-sm font-semibold text-text-muted tracking-wide">{t("system_presets")}</h3>
                {presets.map((preset) => (
                    <PresetCard key={preset.id} preset={preset} onRefresh={onRefresh} t={t} />
                ))}
            </div>

            {/* New Telegram Bot */}
            {showNewBot ? (
                <Card className="border-2 border-dashed border-sky-500/30 bg-sky-500/5 overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-xl font-bold flex items-center gap-3 uppercase tracking-tight">
                            <Plus className="h-6 w-6 text-sky-500" /> {t("new_telegram_bot_title")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {error && (
                            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                                    <p className="text-sm text-destructive">{error}</p>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setError(null)} className="h-8 w-8 text-destructive hover:bg-destructive/10">
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField label={t("bot_unit_identity")} value={newBotName} onChange={setNewBotName} placeholder="ex: IgnoBot-Primary-Registry" />
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">{t("cryptographic_bot_token")}</Label>
                                <Input
                                    value={newBotKey}
                                    onChange={(e) => setNewBotKey(e.target.value)}
                                    placeholder="123456:ABC-DEF..."
                                    className="bg-background/50 border-border/40 focus:border-sky-500/50 h-11 font-mono text-[13px]"
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex items-center gap-3">
                        <Button
                            onClick={handleCreateBot}
                            disabled={saving || !newBotName.trim()}
                            className="bg-sky-600 hover:bg-sky-700 h-11 px-8 flex items-center gap-3 uppercase text-[11px] font-bold tracking-widest"
                        >
                            {saving ? (
                                <><RefreshCw className="h-4 w-4 animate-spin" /> {t("syncing")}</>
                            ) : (
                                <>{t("initialize_bot_unit")}</>
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setShowNewBot(false)}
                            className="h-11 px-8 uppercase text-[11px] font-bold tracking-widest"
                        >
                            {t("abort")}
                        </Button>
                    </CardFooter>
                </Card>
            ) : (
                <Button
                    variant="outline"
                    onClick={() => setShowNewBot(true)}
                    className="w-full h-24 border-dashed border-border/60 hover:border-sky-500/50 hover:bg-sky-500/5 transition-all group flex flex-col gap-2"
                >
                    <Plus className="h-6 w-6 text-muted-foreground group-hover:text-sky-500 transition-colors" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground group-hover:text-sky-500 transition-colors">{t("initialize_new_unit")}</span>
                </Button>
            )}
        </div>
    );
}

function PresetCard({ preset, onRefresh, t }: { preset: AgentPreset; onRefresh: () => void, t: any }) {
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({
        bot_link: preset.bot_link || "",
        telegram_bot_username: preset.telegram_bot_username || "",
        whatsapp_support_number: preset.whatsapp_support_number || "",
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            const result = await saveAgentPreset({
                id: preset.id,
                ...form
            });
            if (result.error) {
                setError(result.error);
            } else {
                setEditing(false);
                onRefresh();
            }
        } catch (e: any) {
            console.error(e);
            setError(e.message || "Erro ao atualizar preset.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card className="overflow-hidden border-border/40 transition-all bg-card/30 backdrop-blur-sm group hover:border-sky-500/40 border-l-2 border-l-sky-500">
            {editing ? (
                <CardContent className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-bold tracking-tight uppercase leading-none">{preset.name}</CardTitle>
                        <Button variant="ghost" size="icon" onClick={() => setEditing(false)} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-none flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
                                <p className="text-sm text-red-400 font-black uppercase tracking-widest text-[10px]">{error}</p>
                            </div>
                            <button onClick={() => setError(null)} className="p-1 hover:bg-white/5 rounded-none cursor-pointer">
                                <X className="h-4 w-4 text-red-400" />
                            </button>
                        </div>
                    )}

                    <InputField
                        label={t("unified_bot_link")}
                        value={form.bot_link}
                        onChange={(v) => setForm({ ...form, bot_link: v })}
                        placeholder="https://t.me/UnitAlpha"
                    />
                    <div className="grid grid-cols-2 gap-6">
                        <InputField
                            label={t("operational_alias")}
                            value={form.telegram_bot_username}
                            onChange={(v) => setForm({ ...form, telegram_bot_username: v })}
                            placeholder="UnitAlphaBot"
                        />
                        <InputField
                            label={t("whatsapp_liaison")}
                            value={form.whatsapp_support_number}
                            onChange={(v) => setForm({ ...form, whatsapp_support_number: v })}
                            placeholder="5511999999999"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-sky-600 hover:bg-sky-700 h-10 px-6 uppercase text-[10px] font-bold tracking-widest"
                        >
                            {saving ? t("syncing") : t("update_protocol")}
                        </Button>
                    </div>
                </CardContent>
            ) : (
                <CardContent className="p-6 flex items-center justify-between gap-6">
                    <div className="min-w-0">
                        <div className="flex items-center gap-3">
                            <p className="text-sm font-bold tracking-tight uppercase leading-none">{preset.name}</p>
                            <Button variant="ghost" size="icon" onClick={() => setEditing(true)} className="h-8 w-8 text-muted-foreground hover:text-sky-500 transition-colors">
                                <Settings className="h-4 w-4" />
                            </Button>
                        </div>
                        {preset.bot_link ? (
                            <a href={preset.bot_link} target="_blank" rel="noreferrer" className="text-[11px] font-bold text-sky-500 hover:text-sky-400 transition-colors flex items-center gap-2 mt-2 uppercase tracking-tight">
                                {preset.bot_link} <ArrowUpRight className="h-3 w-3" />
                            </a>
                        ) : (
                            <p className="text-[11px] font-medium text-amber-500/60 mt-2 uppercase tracking-tight italic">{t("protocol_missing_link")}</p>
                        )}
                        {preset.telegram_bot_username && <p className="text-[10px] font-bold text-muted-foreground mt-1.5 uppercase tracking-widest">@{preset.telegram_bot_username}</p>}
                    </div>
                    <div className="flex items-center gap-6 shrink-0">
                        <div className="text-right hidden sm:block">
                            <p className="text-[9px] font-black text-secondary-gray-700 uppercase tracking-widest mb-1">{t("context_integrity")}</p>
                            <p className="text-[11px] font-black text-white uppercase tracking-tighter">{preset.preserve_context ? t("status_open") : t("status_dormant")}</p>
                        </div>
                        <StatusBadge active={preset.is_active || false} t={t} />
                    </div>
                </CardContent>
            )}
        </Card>
    );
}

function MonitorTab({ usage, aiSettings, onRefresh, t }: { usage: TokenUsage[]; aiSettings: Record<string, string>; onRefresh: () => void, t: any }) {
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
                    <StatCard icon={<Brain />} color="amber" label={t("total_tokens")} value={usage.reduce((a, b) => a + b.tokens, 0).toLocaleString()} sub={t("consumidos")} />
                    <StatCard icon={<Activity />} color="amber" label={t("active_channels")} value={usage.length} sub={t("with_consumption")} />
                    <StatCard icon={<AlertTriangle />} color="amber" label={t("top_consumer")} value={usage[0]?.name || "—"} sub={usage[0] ? `${usage[0].tokens.toLocaleString()} tokens` : ""} />
                </div>

                <div className="grid grid-cols-1 gap-6">
                    <Card className="border-border/40 bg-card/30 backdrop-blur-sm overflow-hidden">
                        <CardHeader>
                            <CardTitle className="text-xl font-bold flex items-center gap-3 uppercase tracking-tight">
                                <Brain className="h-6 w-6 text-amber-500" />
                                {t("metrics_title")}
                            </CardTitle>
                        </CardHeader>

                        <CardContent>
                            {usage.length === 0 ? (
                                <div className="text-center py-16 bg-background/40 border border-dashed border-border/40 rounded-lg">
                                    <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                                    <p className="text-sm font-bold uppercase tracking-widest">{t("no_ingestion")}</p>
                                    <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-widest leading-loose">{t("metrics_wait")}</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {usage.map((item, i) => (
                                        <div key={i} className="group">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <Badge variant="outline" className={cn(
                                                        "text-[8px] font-bold uppercase tracking-widest h-5",
                                                        item.platform === "whatsapp"
                                                            ? "bg-green-500/10 text-green-500 border-green-500/20"
                                                            : "bg-sky-500/10 text-sky-500 border-sky-500/20"
                                                    )}>
                                                        {item.platform === "whatsapp" ? "WA" : "TG"}
                                                    </Badge>
                                                    <span className="text-sm font-bold truncate uppercase tracking-tight">{item.name}</span>
                                                </div>
                                                <span className="text-[10px] font-mono font-bold text-muted-foreground tabular-nums shrink-0">
                                                    {item.tokens.toLocaleString()} TOKENS
                                                </span>
                                            </div>
                                            <div className="h-1.5 bg-background/60 rounded-full overflow-hidden border border-border/20">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(item.tokens / maxTokens) * 100}%` }}
                                                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: i * 0.1 }}
                                                    className={cn(
                                                        "h-full rounded-full transition-all shadow-[0_0_8px_rgba(0,0,0,0.2)]",
                                                        item.platform === "whatsapp" ? "bg-green-500" : "bg-sky-500"
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* AI Config Section */}
            <div className="space-y-8">
                <div className="flex items-center justify-between bg-card/30 backdrop-blur-sm p-6 border border-border/40 rounded-lg">
                    <h2 className="text-xl font-bold tracking-tight flex items-center gap-4 uppercase">
                        <Settings className="h-6 w-6 text-primary" />
                        {t("neural_protocol_keys")}
                    </h2>
                    <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-background/50 px-4 py-1.5 border-border/40">
                        {t("core_override")}
                    </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    <AIKeyCard
                        title="X-AI Identity Protocol"
                        configKey="XAI_API_KEY"
                        currentValue={aiSettings.XAI_API_KEY}
                        onSave={onRefresh}
                        description="Grok Neural Fabric Integration"
                        t={t}
                    />
                    <AIKeyCard
                        title="Mistral Core Unit"
                        configKey="MISTRAL_API_KEY"
                        currentValue={aiSettings.MISTRAL_API_KEY}
                        onSave={onRefresh}
                        description="European Neural Architecture"
                        t={t}
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AIKeyCard
                        title="Google Gemini"
                        configKey="GOOGLE_API_KEY"
                        currentValue={aiSettings.GOOGLE_API_KEY}
                        onSave={onRefresh}
                        t={t}
                    />
                    <AIKeyCard
                        title="OpenAI"
                        configKey="OPENAI_API_KEY"
                        currentValue={aiSettings.OPENAI_API_KEY}
                        onSave={onRefresh}
                        t={t}
                    />
                    <AIKeyCard
                        title="Anthropic"
                        configKey="ANTHROPIC_API_KEY"
                        currentValue={aiSettings.ANTHROPIC_API_KEY}
                        onSave={onRefresh}
                        t={t}
                    />
                    <AIKeyCard
                        title="Groq"
                        configKey="GROQ_API_KEY"
                        currentValue={aiSettings.GROQ_API_KEY}
                        onSave={onRefresh}
                        t={t}
                    />
                    <div className="md:col-span-2">
                        <AIKeyCard
                            title="Lovable AI Gateway"
                            configKey="LOVABLE_API_KEY"
                            currentValue={aiSettings.LOVABLE_API_KEY}
                            onSave={onRefresh}
                            description="Chave mestra usada como fallback quando o provedor não tem chave específica."
                            t={t}
                        />
                    </div>
                </div>

                <Card className="border-primary/20 bg-primary/5 group hover:bg-primary/10 transition-colors">
                    <CardContent className="p-8">
                        <div className="flex items-start gap-5">
                            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0 mt-0.5">
                                <Shield className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm font-bold uppercase tracking-tight">{t("protocol_guard_title")}</p>
                                <p className="text-[11px] text-muted-foreground mt-2 uppercase tracking-widest leading-loose">
                                    {t("protocol_guard_desc")}
                                    <strong className="text-primary ml-2"> {t("operational_note")}</strong> {t("operational_note_desc")}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function AIKeyCard({ title, configKey, currentValue, onSave, description, t }: {
    title: string;
    configKey: string;
    currentValue: string;
    onSave: () => void;
    description?: string;
    t: any;
}) {
    const [value, setValue] = useState("");
    const [showKey, setShowKey] = useState(false);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);

    const [error, setError] = useState<string | null>(null);

    const handleSave = async () => {
        if (!value.trim()) return;
        setSaving(true);
        setError(null);
        try {
            const result = await saveAISetting(configKey, value.trim());
            if (result.error) {
                setError(result.error);
            } else {
                setValue("");
                setSuccess(true);
                onSave();
                setTimeout(() => setSuccess(false), 3000);
            }
        } catch (e: any) {
            console.error(e);
            setError(e.message || "Erro ao salvar chave.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card className="overflow-hidden border-border/40 transition-all bg-card/30 backdrop-blur-sm hover:border-primary/40 group">
            <CardHeader className="p-6 pb-4">
                <div className="flex items-start justify-between">
                    <div className="min-w-0">
                        <CardTitle className="text-sm font-bold tracking-tight uppercase leading-none truncate">{title}</CardTitle>
                        {description && <CardDescription className="text-[10px] font-bold text-muted-foreground mt-2 uppercase tracking-tight leading-tight">{description}</CardDescription>}
                    </div>
                    <Badge variant="outline" className={cn(
                        "text-[9px] font-bold uppercase tracking-widest shrink-0 border h-5 px-2",
                        currentValue ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-destructive/10 text-destructive border-destructive/20"
                    )}>
                        {currentValue ? t("status_open").toUpperCase() : t("status_qr_ready").toUpperCase()}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="p-6 pt-0 space-y-4">
                {error && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-center justify-between">
                        <p className="text-[10px] text-destructive font-bold uppercase tracking-widest">{error}</p>
                        <Button variant="ghost" size="icon" onClick={() => setError(null)} className="h-6 w-6 text-destructive hover:bg-destructive/10">
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                )}

                <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em] px-1">
                        {currentValue ? "Active Protocol ID" : t("initialize_unit")}
                    </Label>
                    <div className="relative">
                        <Input
                            type={showKey ? "text" : "password"}
                            value={value || (showKey ? "" : currentValue)}
                            onChange={(e) => setValue(e.target.value)}
                            placeholder={currentValue || "Input Identity Key..."}
                            className="bg-background/50 border-border/40 focus:border-primary/50 pr-24 font-mono h-11 text-[13px]"
                        />
                        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowKey(!showKey)}
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            >
                                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                            <Button
                                size="icon"
                                onClick={handleSave}
                                disabled={saving || !value.trim()}
                                className={cn(
                                    "h-8 w-8 bg-primary hover:bg-primary/90 transition-all",
                                    success ? "bg-green-500 hover:bg-green-600" : ""
                                )}
                            >
                                {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : success ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// ─── Tab 5: Gestão de Mensagens (Templates) ───

function MessagesTab({ templates, globalTemplateSettings, onRefresh, syncing, handleSync, t }: { templates: WhatsAppTemplate[]; globalTemplateSettings: Record<string, string>; onRefresh: () => void; syncing: boolean; handleSync: () => void, t: any }) {
    const [showNew, setShowNew] = useState(false);
    const [mappingSaving, setMappingSaving] = useState(false);

    const handleUpdateMapping = async (key: string, value: string) => {
        setMappingSaving(true);
        try {
            const result = await saveAISetting(key, value);
            if (result.error) alert(result.error);
            else onRefresh();
        } catch (e: any) {
            console.error(e);
            alert(e.message || "Erro ao atualizar mapeamento.");
        } finally {
            setMappingSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <StatCard icon={<MessageSquare className="h-4 w-4" />} color="blue" label={t("active_channels")} value={templates.filter(t => t.is_active).length} sub={t("configuradas")} />
                <StatCard icon={<Globe className="h-4 w-4" />} color="blue" label={t("channels")} value={new Set(templates.map(t => t.language)).size} sub={t("monitored")} />
            </div>

            <Card className="border-border/40 bg-card/30 backdrop-blur-sm overflow-hidden">
                <CardHeader className="p-6 border-b border-border/10">
                    <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5 text-primary" />
                        <div>
                            <CardTitle className="text-sm font-bold uppercase tracking-wider">WhatsApp Meta Dispatch Protocols</CardTitle>
                            <CardDescription className="text-[10px] uppercase tracking-widest mt-0.5">Mapeamento de templates para respostas do sistema</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { label: "Executive Summary", key: "META_TEMPLATE_SUMMARY", icon: <MessageSquare className="h-4 w-4" /> },
                            { label: "Critical Alert", key: "META_TEMPLATE_ALERT", icon: <AlertTriangle className="h-4 w-4" /> },
                            { label: "Neural Insight", key: "META_TEMPLATE_INSIGHT", icon: <Brain className="h-4 w-4" /> },
                        ].map((item) => (
                            <div key={item.key} className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                    {item.icon} {item.label}
                                </Label>
                                <select
                                    value={globalTemplateSettings[item.key] || ""}
                                    onChange={(e) => handleUpdateMapping(item.key, e.target.value)}
                                    disabled={mappingSaving}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all hover:border-primary/50"
                                >
                                    <option value="" className="bg-background text-foreground">{t("unlinked")}</option>
                                    {templates
                                        .filter(t => t.platform === 'meta')
                                        .map(tmpl => (
                                            <option key={tmpl.id} value={tmpl.name} className="bg-background text-foreground">{tmpl.name} [{tmpl.language}]</option>
                                        ))
                                    }
                                </select>
                            </div>
                        ))}
                    </div>
                    {mappingSaving && <p className="text-[10px] text-primary font-bold uppercase tracking-[0.2em] mt-4 animate-pulse">{t("syncing")}</p>}
                </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-1 bg-primary rounded-full" />
                    <h2 className="text-xl font-bold tracking-tight uppercase">Message Registry</h2>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={handleSync}
                        disabled={syncing}
                        className="h-10 gap-2"
                    >
                        <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />
                        {syncing ? t("syncing") : t("sync")}
                    </Button>
                    {!showNew && (
                        <Button
                            onClick={() => setShowNew(true)}
                            className="h-10 gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            {t("initialize_protocol")}
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {showNew && (
                    <TemplateCard config={null} isNew onRefresh={() => { setShowNew(false); onRefresh(); }} onCancel={() => setShowNew(false)} t={t} />
                )}
                {templates.map((tmpl) => (
                    <TemplateCard key={tmpl.id} config={tmpl} onRefresh={onRefresh} t={t} />
                ))}

                {templates.length === 0 && !showNew && (
                    <Card className="border-2 border-dashed border-border/40 bg-card/20 py-24">
                        <CardContent className="flex flex-col items-center justify-center text-center">
                            <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
                            <h3 className="text-sm font-bold uppercase tracking-widest">{t("no_templates")}</h3>
                            <p className="text-[11px] text-muted-foreground mt-2 max-w-sm">{t("unit_identity_desc")}</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}

function TemplateCard({ config, isNew, onRefresh, onCancel, t }: { config: WhatsAppTemplate | null; isNew?: boolean; onRefresh: () => void; onCancel?: () => void, t: any }) {
    const [form, setForm] = useState({
        name: config?.name || "",
        platform: config?.platform || "meta",
        category: config?.category || "MARKETING",
        language: config?.language || "pt_BR",
        content: typeof config?.content === 'string' ? config.content : JSON.stringify(config?.content || "", null, 2),
        is_active: config?.is_active ?? true,
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSave = async () => {
        if (!form.name.trim()) return;
        setSaving(true);
        setError(null);
        try {
            const result = await saveWhatsAppTemplate({ id: config?.id, ...(form as any) });
            if (result.error) {
                setError(result.error);
            } else {
                onRefresh();
            }
        } catch (e: any) {
            console.error(e);
            setError(e.message || "Erro ao salvar template.");
        }
        finally { setSaving(false); }
    };

    const handleDelete = async () => {
        if (!config?.id || !confirm(t("confirm_delete") || "Tem certeza que deseja excluir?")) return;
        setError(null);
        try {
            const result = await deleteWhatsAppTemplate(config.id);
            if (result.error) {
                setError(result.error);
            } else {
                onRefresh();
            }
        } catch (e: any) {
            setError(e.message || "Erro ao excluir template.");
        }
    };

    return (
        <Card className={cn(
            "overflow-hidden border-border/40 transition-all bg-card/30 backdrop-blur-sm",
            isNew && "border-primary/50 border-dashed"
        )}>
            <CardHeader className="p-6 pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                            <MessageSquare className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <CardTitle className="text-sm font-bold tracking-tight uppercase">
                                {isNew ? t("initialize_new_unit") : form.name}
                            </CardTitle>
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="px-2 py-0 h-5 text-[10px] font-bold uppercase tracking-wider">
                                    {form.platform}
                                </Badge>
                                {!isNew && (
                                    <Badge variant={form.is_active ? "default" : "secondary"} className={cn("px-2 py-0 h-5 text-[10px] font-bold uppercase tracking-wider", form.is_active ? "bg-green-500/10 text-green-500 border-green-500/20" : "")}>
                                        {form.is_active ? t("active") : t("inactive")}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                    {!isNew && (
                        <Button variant="ghost" size="icon" onClick={handleDelete} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("protocol_identifier")}</Label>
                        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="daily_summary_alpha" />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("infrastructure_platform")}</Label>
                        <select
                            value={form.platform}
                            onChange={(e) => setForm({ ...form, platform: e.target.value as any })}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all hover:border-primary/50"
                        >
                            <option value="meta" className="bg-background text-foreground">Meta Official</option>
                            <option value="evolution" className="bg-background text-foreground">Evolution API</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("category_manifest")}</Label>
                        <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="MARKETING" />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("language_locale")}</Label>
                        <Input value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} placeholder="pt_BR" />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("protocol_payload")}</Label>
                    <Textarea
                        value={form.content}
                        onChange={(e) => setForm({ ...form, content: e.target.value })}
                        placeholder='{"payload": {"v": 1.0, "components": [...]}}'
                        className="min-h-[160px] bg-background/50 border-border/40 focus:border-primary/50 font-mono resize-none"
                    />
                </div>

                {error && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        <p className="text-xs font-medium text-destructive">{error}</p>
                    </div>
                )}
            </CardContent>
            <CardFooter className="p-6 pt-0 border-t border-border/5 bg-muted/20 flex items-center gap-3">
                <Button
                    onClick={handleSave}
                    disabled={saving || !form.name.trim()}
                    className="h-10 gap-2"
                >
                    {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {saving ? t("saving") : t("authorize_protocol")}
                </Button>
                {isNew && onCancel && (
                    <Button variant="outline" onClick={onCancel} className="h-10">
                        {t("abort_initialization")}
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}

// ─── Tab 6: Prompts (System) ───

const PROMPT_DEFINITIONS = [
    {
        id: "PROMPT_SUMMARY_SYSTEM",
        labelKey: "executive_logic",
        descKey: "executive_logic_desc",
        placeholder: "Initialize Executive Persona Alpha... (Define operational constraints)",
        icon: <Brain className="h-5 w-5 text-brand-500" />
    },
    {
        id: "PROMPT_ALERT_SYSTEM",
        labelKey: "anomaly_detection",
        descKey: "anomaly_detection_desc",
        placeholder: "Analyze batch ingestions for non-compliance... (Define tripwires)",
        icon: <Shield className="h-5 w-5 text-amber-500" />
    },
    {
        id: "PROMPT_INSIGHT_SYSTEM",
        labelKey: "behavioral_analytics",
        descKey: "behavioral_analytics_desc",
        placeholder: "Detect cognitive behavioral patterns... (Define analytical focus)",
        icon: <Lightbulb className="h-5 w-5 text-blue-500" />
    },
    {
        id: "TELEGRAM_BOT_LINK",
        labelKey: "tg_liaison",
        descKey: "tg_liaison_desc",
        placeholder: "t.me/unit_id",
        icon: <Send className="h-5 w-5 text-secondary-gray-500" />
    }
];

function PromptsTab({ aiSettings, onRefresh, t }: { aiSettings: Record<string, string>; onRefresh: () => void, t: any }) {
    const [selectedPromptId, setSelectedPromptId] = useState<string>("PROMPT_SUMMARY_SYSTEM");
    const [localValue, setLocalValue] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Sync local value when selection or settings change
    useEffect(() => {
        setLocalValue(aiSettings[selectedPromptId] || "");
    }, [selectedPromptId, aiSettings]);

    const activeDef = PROMPT_DEFINITIONS.find(p => p.id === selectedPromptId) || PROMPT_DEFINITIONS[0];

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            const result = await saveAISetting(selectedPromptId, localValue, t(activeDef.descKey));
            if (result.error) {
                setError(result.error);
            } else {
                onRefresh();
            }
        } catch (e: any) {
            setError(e.message || t("connection_failed"));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[calc(100vh-220px)] min-h-[600px]">
            {/* Sidebar List */}
            <Card className="md:col-span-4 border-border/40 bg-card/30 backdrop-blur-sm overflow-hidden flex flex-col">
                <CardHeader className="p-4 border-b border-border/10">
                    <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                        {t("neural_protocol_inventory")}
                    </CardTitle>
                </CardHeader>
                <ScrollArea className="flex-1">
                    <div className="p-2 space-y-1">
                        {PROMPT_DEFINITIONS.map((def) => (
                            <button
                                key={def.id}
                                onClick={() => setSelectedPromptId(def.id)}
                                className={cn(
                                    "w-full text-left p-4 rounded-lg transition-all group relative border",
                                    selectedPromptId === def.id
                                        ? "bg-primary/10 border-primary/20"
                                        : "bg-transparent border-transparent hover:bg-muted/50"
                                )}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={cn(
                                        "p-2 rounded-md transition-all",
                                        selectedPromptId === def.id ? "bg-background shadow-sm border" : "bg-muted/30"
                                    )}>
                                        {React.cloneElement(def.icon as React.ReactElement<{ className?: string }>, { className: "h-4 w-4" })}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className={cn(
                                            "text-xs font-bold uppercase tracking-wider leading-none",
                                            selectedPromptId === def.id ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                                        )}>
                                            {t(def.labelKey)}
                                        </h4>
                                        <p className="text-[10px] text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed font-medium">
                                            {t(def.descKey)}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </ScrollArea>
            </Card>

            {/* Main Editor */}
            <Card className="md:col-span-8 border-border/40 bg-card/30 backdrop-blur-sm flex flex-col overflow-hidden">
                <CardHeader className="p-6 border-b border-border/10">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                                {React.cloneElement(activeDef.icon as React.ReactElement<{ className?: string }>, { className: "h-6 w-6" })}
                            </div>
                            <div>
                                <CardTitle className="text-lg font-bold tracking-tight">{t(activeDef.labelKey)}</CardTitle>
                                <CardDescription className="text-[10px] font-mono uppercase tracking-widest mt-0.5 opacity-60">
                                    {activeDef.id}
                                </CardDescription>
                            </div>
                        </div>
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="gap-2 px-6"
                        >
                            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {saving ? t("syncing") : t("update_protocol_btn")}
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="flex-1 p-0 relative">
                    <Textarea
                        value={localValue}
                        onChange={(e) => setLocalValue(e.target.value)}
                        className="w-full h-full bg-transparent p-8 text-[13px] font-medium leading-relaxed font-mono placeholder:text-muted-foreground/30 focus-visible:ring-0 focus-visible:ring-offset-0 border-0 resize-none shadow-none"
                        placeholder={activeDef.placeholder}
                    />
                    <div className="absolute bottom-4 right-4 flex items-center gap-2">
                        <Badge variant="outline" className="bg-background/80 backdrop-blur-sm px-2 py-0 h-6 text-[10px] font-mono border-border/20">
                            {localValue.length} LOGS
                        </Badge>
                    </div>
                </CardContent>

                {error && (
                    <div className="m-6 p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                            <p className="text-xs font-semibold text-destructive">{error}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setError(null)} className="h-6 w-6 text-destructive hover:bg-destructive/10">
                            <X className="h-3 w-3" />
                        </Button>
                    </div>
                )}

                <CardFooter className="p-4 border-t border-border/10 bg-muted/20">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-md bg-primary/5 flex items-center justify-center shrink-0 border border-primary/10">
                            <Info className="h-4 w-4 text-primary" />
                        </div>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider leading-relaxed">
                            {t("protocol_integrity_note")}
                        </p>
                    </div>
                </CardFooter>
            </Card>
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
        <Card className="border-border/40 bg-card/30 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-5 flex items-center gap-4">
                <div className={cn(
                    "h-10 w-10 flex items-center justify-center rounded-lg border flex-shrink-0",
                    colorMap[color] || colorMap.brand
                )}>
                    {icon}
                </div>
                <div className="min-w-0">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
                    <div className="flex items-baseline gap-2 mt-0.5">
                        <p className="text-2xl font-bold tabular-nums tracking-tight">{value}</p>
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">{sub}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function StatusBadge({ active, t }: { active: boolean, t: any }) {
    return active ? (
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 h-6 text-[10px] font-bold uppercase tracking-widest gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            {t("status_open")}
        </Badge>
    ) : (
        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 h-6 text-[10px] font-bold uppercase tracking-widest gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
            {t("status_offline")}
        </Badge>
    );
}

function InputField({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string, type?: string }) {
    return (
        <div className="space-y-2">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">{label}</Label>
            <Input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="bg-background/50 border-border/40 focus:border-primary/50 transition-all h-10 text-sm"
            />
        </div>
    );
}
