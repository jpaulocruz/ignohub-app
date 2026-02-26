"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOrganization } from "@/hooks/use-organization";
import { useRouter } from "next/navigation";
import {
    MessageSquare,
    Send,
    ArrowRight,
    ArrowLeft,
    CheckCircle2,
    Rocket,
    Sparkles,
    ExternalLink,
    Copy,
    Check,
    Radio,
    Zap,
    Loader2,
} from "lucide-react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { getOnboardingData, registerGroup, checkGroupSignal } from "./actions";
import { useTranslations } from "next-intl";

type Platform = "whatsapp" | "telegram" | null;

interface OnboardingData {
    whatsappConfig: {
        id: string;
        display_number: string | null;
        phone_number_id: string;
    } | null;
    botLink: string | null;
}

const STEP_KEYS = ["step_platform", "step_setup", "step_verify", "step_done"];

function ProgressBar({ step, t }: { step: number; t: (key: string) => string }) {
    return (
        <div className="flex items-center gap-0 mb-8 max-w-sm mx-auto">
            {STEP_KEYS.map((key, i) => (
                <div key={key} className="flex-1 flex flex-col items-center gap-1.5">
                    <div className="relative w-full">
                        <div className="h-1 bg-muted rounded-full overflow-hidden shadow-inner">
                            <motion.div
                                className={i <= step ? "h-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" : "h-full bg-transparent"}
                                initial={{ width: "0%" }}
                                animate={{ width: i <= step ? "100%" : "0%" }}
                                transition={{ duration: 0.6, ease: "easeOut" }}
                            />
                        </div>
                    </div>
                    <span className={`text-[10px] font-bold tracking-tight uppercase ${i <= step ? "text-primary" : "text-muted-foreground/60"}`}>
                        {t(key)}
                    </span>
                </div>
            ))}
        </div>
    );
}

function StepPlatform({ onSelect, t }: { onSelect: (p: Platform) => void; t: (key: string) => string }) {
    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-8">
            <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    <Sparkles className="h-3.5 w-3.5" />
                    {t('step_setup')}
                </div>
                <h1 className="text-2xl font-semibold text-foreground">{t('choose_platform')}</h1>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    {t('choose_platform_desc')}
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
                <motion.button
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onSelect("whatsapp")}
                    className="group p-6 rounded-xl bg-card border border-border hover:border-green-500/40 hover:bg-green-50/50 dark:hover:bg-green-900/10 transition-all text-left cursor-pointer"
                >
                    <div className="space-y-4">
                        <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <MessageSquare className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-foreground">WhatsApp</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">Business API</p>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 font-medium">
                            {t('continue')} <ArrowRight className="h-3.5 w-3.5" />
                        </div>
                    </div>
                </motion.button>

                <motion.button
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onSelect("telegram")}
                    className="group p-6 rounded-xl bg-card border border-border hover:border-sky-500/40 hover:bg-sky-50/50 dark:hover:bg-sky-900/10 transition-all text-left cursor-pointer"
                >
                    <div className="space-y-4">
                        <div className="h-10 w-10 rounded-lg bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
                            <Send className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-foreground">Telegram</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">Group / Supergroup</p>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-sky-600 dark:text-sky-400 font-medium">
                            {t('continue')} <ArrowRight className="h-3.5 w-3.5" />
                        </div>
                    </div>
                </motion.button>
            </div>
        </motion.div>
    );
}

function StepInstruction({
    platform, data, groupName, setGroupName, groupDescription, setGroupDescription,
    onNext, onBack, error, t,
}: {
    platform: Platform; data: OnboardingData; groupName: string; setGroupName: (v: string) => void;
    groupDescription: string; setGroupDescription: (v: string) => void;
    onNext: () => void; onBack: () => void; error: string | null; t: (key: string) => string;
}) {
    const [copied, setCopied] = useState(false);
    const isWhatsApp = platform === "whatsapp";
    const number = data.whatsappConfig?.display_number || data.whatsappConfig?.phone_number_id || "—";
    const botLink = data.botLink || "";

    const handleCopy = () => {
        navigator.clipboard.writeText(number);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6 max-w-xl mx-auto">
            <div className="text-center space-y-2">
                <Badge variant="secondary" className="gap-1.5">
                    {isWhatsApp ? <MessageSquare className="h-3 w-3" /> : <Send className="h-3 w-3" />}
                    {isWhatsApp ? "WhatsApp" : "Telegram"}
                </Badge>
                <h1 className="text-2xl font-semibold text-foreground">{t('configure_community')}</h1>
            </div>

            <PremiumCard className="p-5 space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="groupName">{t('community_name')}</Label>
                    <div className="rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                        <span className="font-semibold">Important:</span> {t('community_name_warning')}
                    </div>
                    <Input
                        id="groupName"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        placeholder={t('community_name_placeholder')}
                        className={error ? "border-destructive" : ""}
                    />
                    {error && <p className="text-xs text-destructive">{error}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="desc">{t('description_optional')}</Label>
                    <Textarea
                        id="desc"
                        value={groupDescription}
                        onChange={(e) => setGroupDescription(e.target.value)}
                        placeholder={t('description_placeholder')}
                        rows={3}
                        className="resize-none"
                    />
                </div>

                <div className="pt-2 border-t border-border space-y-3">
                    <p className="text-sm font-medium text-foreground">{t('setup_instructions')}</p>

                    {isWhatsApp ? (
                        <div className="space-y-3">
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                                <span className="text-xs font-mono font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded mt-0.5 shrink-0">1</span>
                                <div className="flex-1 space-y-2">
                                    <p className="text-xs text-muted-foreground">{t('wa_step1')}</p>
                                    <div className="flex items-center gap-2">
                                        <code className="flex-1 text-sm font-mono text-foreground bg-muted px-3 py-1.5 rounded border">{number}</code>
                                        <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={handleCopy}>
                                            {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                                <span className="text-xs font-mono font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded mt-0.5 shrink-0">2</span>
                                <p className="text-xs text-muted-foreground">{t('wa_step2_prefix')}<span className="font-semibold text-foreground">{t('wa_step2_bold')}</span>{t('wa_step2_suffix')}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {[
                                {
                                    step: "1", content: botLink ? (
                                        <div className="flex items-center gap-2">
                                            <Button variant="outline" size="sm" asChild className="gap-1.5 h-7 text-xs">
                                                <a href={botLink.startsWith("http") ? botLink : `https://${botLink}`} target="_blank" rel="noopener noreferrer">
                                                    <ExternalLink className="h-3 w-3" /> {t('tg_open_bot')}
                                                </a>
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { navigator.clipboard.writeText(botLink); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
                                                {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                                            </Button>
                                        </div>
                                    ) : <p className="text-xs text-amber-600 dark:text-amber-400">{t('tg_bot_not_configured')}</p>, label: t('tg_step1')
                                },
                                { step: "2", label: t('tg_step2') },
                                { step: "3", label: t('tg_step3') },
                            ].map((item, idx) => (
                                <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                                    <span className="text-xs font-mono font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded mt-0.5 shrink-0">{item.step}</span>
                                    <div className="space-y-1.5">
                                        <p className="text-xs text-muted-foreground">{item.label}</p>
                                        {item.content}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </PremiumCard>

            <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={onBack} className="gap-2">
                    <ArrowLeft className="h-4 w-4" /> {t('back')}
                </Button>
                <Button onClick={onNext} disabled={!groupName.trim()} className="gap-2">
                    {t('continue')} <ArrowRight className="h-4 w-4" />
                </Button>
            </div>
        </motion.div>
    );
}

function StepListening({ groupId, externalId, onConnected, onBack, t }: {
    groupId: string | null; externalId: string | null; onConnected: () => void; onBack: () => void; t: (key: string) => string;
}) {
    const [seconds, setSeconds] = useState(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [copied, setCopied] = useState(false);

    const poll = useCallback(async () => {
        if (!groupId) return;
        try {
            const result = await checkGroupSignal(groupId);
            if (result.connected) onConnected();
        } catch (e) {
            console.error("Polling error:", e);
        }
    }, [groupId, onConnected]);

    useEffect(() => {
        if (!groupId) return;
        intervalRef.current = setInterval(() => { poll(); setSeconds(s => s + 3); }, 3000);
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [groupId, poll]);

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

    const handleCopyCode = () => {
        if (externalId) { navigator.clipboard.writeText(externalId); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6 max-w-sm mx-auto text-center">
            <div className="space-y-2">
                <Badge variant="secondary" className="gap-1.5">
                    <Radio className="h-3 w-3 animate-pulse text-amber-500" />
                    {t('listening')}
                </Badge>
                <h1 className="text-2xl font-semibold text-foreground">{t('verification')}</h1>
                <p className="text-sm text-muted-foreground">
                    {t('verification_desc')}
                </p>
            </div>

            <PremiumCard className="p-6 space-y-5">
                <div className="space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('verification_code')}</p>
                    <div className="flex items-center gap-2">
                        <code className="flex-1 text-3xl font-mono font-black text-primary text-center bg-primary/5 border border-primary/20 rounded-xl py-4 tracking-[0.2em] shadow-inner animate-signal-glow">
                            {externalId || "—"}
                        </code>
                        <Button variant="outline" size="icon" onClick={handleCopyCode} className="h-14 w-12 shrink-0 border-primary/20 hover:bg-primary/5">
                            {copied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5 text-primary" />}
                        </Button>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-4 py-4">
                    <div className="relative">
                        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                            <Radio className="h-10 w-10 text-primary animate-signal-glow" />
                        </div>
                        <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ring-pulse" />
                        <div className="absolute inset-0 rounded-full border border-primary/20 animate-ring-pulse [animation-delay:1s]" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest animate-pulse">
                            {t('listening')}
                        </p>
                        <p className="text-sm font-mono font-medium text-muted-foreground">
                            {formatTime(seconds)}
                        </p>
                    </div>
                </div>
            </PremiumCard>

            <Button variant="ghost" onClick={onBack} className="gap-2 mx-auto">
                <ArrowLeft className="h-4 w-4" /> {t('back')}
            </Button>
        </motion.div>
    );
}

function StepWelcome({ t }: { t: (key: string) => string }) {
    const router = useRouter();
    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-sm mx-auto text-center">
            <div className="space-y-2">
                <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {t('connected_badge')}
                </motion.div>
                <h1 className="text-2xl font-semibold text-foreground">{t('all_set')}</h1>
                <p className="text-sm text-muted-foreground">{t('all_set_desc')}</p>
            </div>

            <PremiumCard className="p-6">
                <div className="flex flex-col items-center gap-5">
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Rocket className="h-8 w-8 text-primary" />
                    </motion.div>
                    <div className="space-y-2 w-full">
                        {[
                            { icon: Zap, label: t('feature_summaries'), color: "text-primary" },
                            { icon: Zap, label: t('feature_alerts'), color: "text-destructive" },
                            { icon: Zap, label: t('feature_insights'), color: "text-sky-500" },
                        ].map(({ icon: Icon, label, color }) => (
                            <div key={label} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50">
                                <Icon className={`h-4 w-4 ${color} shrink-0`} />
                                <p className="text-sm text-foreground">{label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </PremiumCard>

            <Button onClick={() => router.push("/dashboard")} className="w-full gap-2">
                {t('go_dashboard')} <ArrowRight className="h-4 w-4" />
            </Button>
        </motion.div>
    );
}

export default function OnboardingPage() {
    const { organization, loading: orgLoading } = useOrganization();
    const t = useTranslations("onboarding");
    const [step, setStep] = useState(0);
    const [platform, setPlatform] = useState<Platform>(null);
    const [groupName, setGroupName] = useState("");
    const [groupDescription, setGroupDescription] = useState("");
    const [groupId, setGroupId] = useState<string | null>(null);
    const [data, setData] = useState<OnboardingData | null>(null);
    const [loading, setLoading] = useState(true);
    const [registering, setRegistering] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [externalId, setExternalId] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const d = await getOnboardingData();
                setData(d);
            } catch (e: any) {
                console.error("Onboarding data fetch error:", e);
                setError(e.message || "Failed to load onboarding data.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handlePlatformSelect = (p: Platform) => { setPlatform(p); setStep(1); };

    const handleStartListening = async () => {
        if (!organization || !data || !platform) return;
        setRegistering(true);
        setError(null);
        const result = await registerGroup({ name: groupName, description: groupDescription, platform, organizationId: organization.id });
        if (result.error) { setError(result.error); setRegistering(false); return; }
        if (result.groupId) { setGroupId(result.groupId); setExternalId(result.externalId); setStep(2); }
        setRegistering(false);
    };

    if (loading || orgLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            <ProgressBar step={step} t={t} />
            <AnimatePresence mode="wait">
                {step === 0 && <StepPlatform key="platform" onSelect={handlePlatformSelect} t={t} />}
                {step === 1 && data && (
                    <StepInstruction key="instruction" platform={platform} data={data} groupName={groupName} setGroupName={setGroupName} groupDescription={groupDescription} setGroupDescription={setGroupDescription} onNext={handleStartListening} onBack={() => setStep(0)} error={error} t={t} />
                )}
                {step === 2 && <StepListening key="listening" groupId={groupId} externalId={externalId} onConnected={() => setStep(3)} onBack={() => setStep(1)} t={t} />}
                {step === 3 && <StepWelcome key="welcome" t={t} />}
            </AnimatePresence>

            {registering && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
                    <PremiumCard className="p-8 text-center space-y-3 max-w-xs">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                        <p className="text-sm text-muted-foreground">{t('registering')}</p>
                    </PremiumCard>
                </div>
            )}
        </div>
    );
}
