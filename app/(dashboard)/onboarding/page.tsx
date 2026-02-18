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
    Headphones,
    CheckCircle2,
    Rocket,
    Sparkles,
    ExternalLink,
    Copy,
    Check,
    Radio,
    Zap,
} from "lucide-react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { getOnboardingData, registerGroup, checkGroupSignal } from "./actions";

type Platform = "whatsapp" | "telegram" | null;

interface OnboardingData {
    whatsappConfig: {
        id: string;
        display_number: string | null;
        phone_number_id: string;
    } | null;
    botLink: string | null;
}

const STEPS = ["Plataforma", "Instrução", "Sinal", "Pronto"];

function ProgressBar({ step }: { step: number }) {
    return (
        <div className="flex items-center gap-2 w-full max-w-md mx-auto mb-10">
            {STEPS.map((label, i) => (
                <div key={label} className="flex-1 flex flex-col items-center gap-1.5">
                    <div className="w-full h-1.5 rounded-full overflow-hidden bg-white/5">
                        <motion.div
                            className={`h-full rounded-full ${i <= step
                                ? "bg-gradient-to-r from-emerald-500 to-cyan-400"
                                : "bg-white/5"
                                }`}
                            initial={{ width: "0%" }}
                            animate={{ width: i <= step ? "100%" : "0%" }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                        />
                    </div>
                    <span
                        className={`text-[10px] font-bold uppercase tracking-wider ${i <= step ? "text-emerald-400" : "text-secondary-gray-600"
                            }`}
                    >
                        {label}
                    </span>
                </div>
            ))}
        </div>
    );
}

function StepPlatform({
    onSelect,
}: {
    onSelect: (p: Platform) => void;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="space-y-8"
        >
            <div className="text-center space-y-3">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-wider">
                    <Sparkles className="h-3.5 w-3.5" />
                    Conectar Grupo
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                    Qual plataforma seu grupo usa?
                </h1>
                <p className="text-secondary-gray-400 text-sm max-w-md mx-auto">
                    Escolha onde o Agno vai monitorar e proteger sua comunidade.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-2xl mx-auto">
                <motion.button
                    whileHover={{ scale: 1.03, y: -4 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onSelect("whatsapp")}
                    className="group relative p-8 rounded-3xl bg-navy-800 border border-white/5 hover:border-green-500/30 transition-all duration-300 text-left cursor-pointer"
                >
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative space-y-4">
                        <div className="h-14 w-14 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                            <MessageSquare className="h-7 w-7 text-green-500" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white">WhatsApp</h3>
                            <p className="text-sm text-secondary-gray-400 mt-1">
                                Grupos do WhatsApp Business API
                            </p>
                        </div>
                        <div className="flex items-center gap-1.5 text-green-400 text-xs font-bold">
                            Selecionar <ArrowRight className="h-3.5 w-3.5" />
                        </div>
                    </div>
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.03, y: -4 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onSelect("telegram")}
                    className="group relative p-8 rounded-3xl bg-navy-800 border border-white/5 hover:border-sky-500/30 transition-all duration-300 text-left cursor-pointer"
                >
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-sky-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative space-y-4">
                        <div className="h-14 w-14 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                            <Send className="h-7 w-7 text-sky-500" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white">Telegram</h3>
                            <p className="text-sm text-secondary-gray-400 mt-1">
                                Grupos e supergrupos do Telegram
                            </p>
                        </div>
                        <div className="flex items-center gap-1.5 text-sky-400 text-xs font-bold">
                            Selecionar <ArrowRight className="h-3.5 w-3.5" />
                        </div>
                    </div>
                </motion.button>
            </div>
        </motion.div>
    );
}

function StepInstruction({
    platform,
    data,
    groupName,
    setGroupName,
    groupDescription,
    setGroupDescription,
    onNext,
    onBack,
    error,
}: {
    platform: Platform;
    data: OnboardingData;
    groupName: string;
    setGroupName: (v: string) => void;
    groupDescription: string;
    setGroupDescription: (v: string) => void;
    onNext: () => void;
    onBack: () => void;
    error: string | null;
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
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="space-y-8 max-w-xl mx-auto"
        >
            <div className="text-center space-y-3">
                <div
                    className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${isWhatsApp
                        ? "bg-green-500/10 border border-green-500/20 text-green-400"
                        : "bg-sky-500/10 border border-sky-500/20 text-sky-400"
                        }`}
                >
                    {isWhatsApp ? (
                        <MessageSquare className="h-3.5 w-3.5" />
                    ) : (
                        <Send className="h-3.5 w-3.5" />
                    )}
                    {isWhatsApp ? "WhatsApp" : "Telegram"}
                </div>
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                    Configure seu grupo
                </h1>
            </div>

            <PremiumCard className="p-6 space-y-5">
                {/* Group name input */}
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-secondary-gray-400 uppercase tracking-wider block mb-2">
                            Nome do Grupo
                        </label>

                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3 mb-3">
                            <div className="mt-0.5 text-amber-500">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
                            </div>
                            <p className="text-sm text-amber-200">
                                <span className="font-bold">CRÍTICO:</span> O nome deve ser <span className="underline decoration-amber-500 font-black">EXATAMENTE</span> igual ao nome do grupo no WhatsApp (incluindo emojis e espaços). Sem isso, as mensagens não serão vinculadas.
                            </p>
                        </div>

                        <input
                            type="text"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            placeholder="Ex: Comunidade Premium 2025"
                            className={`w-full bg-navy-950 border rounded-xl px-4 py-3 text-white placeholder:text-secondary-gray-600 focus:outline-none focus:border-emerald-500/50 transition-colors text-sm ${error ? "border-red-500/50" : "border-white/10"
                                }`}
                        />
                        {error && (
                            <p className="text-red-400 text-sm font-semibold mt-2 flex items-center gap-1.5">
                                <span className="block h-1.5 w-1.5 rounded-full bg-red-500" />
                                {error}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="text-xs font-bold text-secondary-gray-400 uppercase tracking-wider block mb-2">
                            Objetivo da Comunidade
                        </label>
                        <textarea
                            value={groupDescription}
                            onChange={(e) => setGroupDescription(e.target.value)}
                            placeholder="Descreva o objetivo da comunidade para ajudar a IA a gerar insights melhores..."
                            rows={3}
                            className="w-full bg-navy-950 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-secondary-gray-600 focus:outline-none focus:border-emerald-500/50 transition-colors text-sm resize-none"
                        />
                    </div>
                </div>

                {/* Platform-specific instructions */}
                <div className="space-y-4">
                    <label className="text-xs font-bold text-secondary-gray-400 uppercase tracking-wider">
                        Instruções
                    </label>

                    {isWhatsApp ? (
                        <div className="p-5 rounded-2xl bg-navy-950 border border-green-500/10 space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0 mt-0.5">
                                    <span className="text-sm font-black text-green-500">1</span>
                                </div>
                                <div>
                                    <p className="text-sm text-white font-semibold">
                                        Adicione este número ao seu grupo:
                                    </p>
                                    <div className="mt-2 flex items-center gap-2">
                                        <code className="px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 font-mono text-sm font-bold">
                                            {number}
                                        </code>
                                        <button
                                            onClick={handleCopy}
                                            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                                        >
                                            {copied ? (
                                                <Check className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <Copy className="h-4 w-4 text-secondary-gray-500" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0 mt-0.5">
                                    <span className="text-sm font-black text-green-500">2</span>
                                </div>
                                <p className="text-sm text-white font-semibold">
                                    Promova-o a <span className="text-green-400">Admin</span> do grupo.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="p-5 rounded-2xl bg-navy-950 border border-sky-500/10 space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="h-8 w-8 rounded-lg bg-sky-500/10 flex items-center justify-center shrink-0 mt-0.5">
                                    <span className="text-sm font-black text-sky-500">1</span>
                                </div>
                                <div>
                                    <p className="text-sm text-white font-semibold">
                                        Clique para abrir o Bot:
                                    </p>
                                    {botLink ? (
                                        <a
                                            href={botLink.startsWith("http") ? botLink : `https://${botLink}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-sky-500/10 border border-sky-500/20 rounded-lg text-sky-400 text-sm font-bold hover:bg-sky-500/20 transition-colors"
                                        >
                                            <ExternalLink className="h-3.5 w-3.5" />
                                            {botLink}
                                        </a>
                                    ) : (
                                        <p className="text-sm text-secondary-gray-500 mt-1">
                                            Nenhum bot configurado.
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="h-8 w-8 rounded-lg bg-sky-500/10 flex items-center justify-center shrink-0 mt-0.5">
                                    <span className="text-sm font-black text-sky-500">2</span>
                                </div>
                                <p className="text-sm text-white font-semibold">
                                    Adicione-o ao seu grupo como{" "}
                                    <span className="text-sky-400">Admin</span>.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </PremiumCard>

            <div className="flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-secondary-gray-400 hover:text-white hover:bg-white/5 transition-colors text-sm font-semibold cursor-pointer"
                >
                    <ArrowLeft className="h-4 w-4" /> Voltar
                </button>
                <button
                    onClick={onNext}
                    disabled={!groupName.trim()}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                    Continuar <ArrowRight className="h-4 w-4" />
                </button>
            </div>
        </motion.div>
    );
}

function StepListening({
    groupId,
    externalId,
    onConnected,
    onBack,
}: {
    groupId: string | null;
    externalId: string | null;
    onConnected: () => void;
    onBack: () => void;
}) {
    const [seconds, setSeconds] = useState(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [copied, setCopied] = useState(false);

    const poll = useCallback(async () => {
        if (!groupId) return;
        const result = await checkGroupSignal(groupId);
        if (result.connected) {
            onConnected();
        }
    }, [groupId, onConnected]);

    useEffect(() => {
        if (!groupId) return;

        intervalRef.current = setInterval(() => {
            poll();
            setSeconds((s) => s + 3);
        }, 3000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [groupId, poll]);

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec.toString().padStart(2, "0")}`;
    };

    const handleCopyCode = () => {
        if (externalId) {
            navigator.clipboard.writeText(externalId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="space-y-8 max-w-lg mx-auto text-center"
        >
            <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-black uppercase tracking-wider">
                    <Radio className="h-3.5 w-3.5" />
                    Aguardando Identificação
                </div>
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                    Envie o código no grupo
                </h1>
                <p className="text-secondary-gray-400 text-sm max-w-sm mx-auto">
                    Para confirmar que o grupo é seu, envie a mensagem abaixo no grupo onde o bot é Admin.
                </p>
            </div>

            <PremiumCard className="p-8 space-y-6">
                {/* Verification Code Display */}
                <div className="bg-navy-950 border border-white/10 rounded-xl p-4 flex flex-col items-center gap-3">
                    <span className="text-xs font-bold text-secondary-gray-500 uppercase tracking-wider">Seu Código de Verificação</span>
                    <div className="flex items-center gap-3">
                        <code className="text-2xl font-mono font-black text-emerald-400 tracking-wider">
                            {externalId || "..."}
                        </code>
                        <button
                            onClick={handleCopyCode}
                            className="p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer text-secondary-gray-400 hover:text-white"
                            title="Copiar código"
                        >
                            {copied ? <Check className="h-5 w-5 text-emerald-500" /> : <Copy className="h-5 w-5" />}
                        </button>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-6">
                    {/* Pulse animation */}
                    <div className="relative">
                        <div className="h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                            <Headphones className="h-8 w-8 text-emerald-400" />
                        </div>
                        <motion.div
                            className="absolute inset-0 rounded-full border-2 border-emerald-500/30"
                            animate={{ scale: [1, 1.4, 1.4], opacity: [0.6, 0, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                        />
                    </div>

                    <div className="space-y-1">
                        <p className="text-secondary-gray-500 text-xs font-bold uppercase tracking-wider">
                            Aguardando mensagem...
                        </p>
                        <p className="text-xl font-mono font-black text-white tabular-nums">
                            {formatTime(seconds)}
                        </p>
                    </div>
                </div>
            </PremiumCard>

            <button
                onClick={onBack}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-secondary-gray-400 hover:text-white hover:bg-white/5 transition-colors text-sm font-semibold mx-auto cursor-pointer"
            >
                <ArrowLeft className="h-4 w-4" /> Voltar
            </button>
        </motion.div>
    );
}

function StepWelcome() {
    const router = useRouter();

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8 max-w-lg mx-auto text-center"
        >
            <div className="space-y-3">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-black uppercase tracking-wider"
                >
                    <CheckCircle2 className="h-4 w-4" />
                    Conectado
                </motion.div>
                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                    Tudo pronto! 🎉
                </h1>
                <p className="text-secondary-gray-400 text-sm max-w-sm mx-auto">
                    O Agno está processando seus dados. Você receberá resumos e alertas na
                    sua <span className="text-white font-bold">Central de Inteligência</span> em breve.
                </p>
            </div>

            <PremiumCard className="p-8">
                <div className="flex flex-col items-center gap-6">
                    <motion.div
                        initial={{ rotate: -10, scale: 0.8 }}
                        animate={{ rotate: 0, scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, delay: 0.4 }}
                        className="h-20 w-20 rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center"
                    >
                        <Rocket className="h-10 w-10 text-emerald-400" />
                    </motion.div>

                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-left">
                            <Zap className="h-5 w-5 text-amber-400 shrink-0" />
                            <p className="text-sm text-secondary-gray-300">
                                <span className="text-white font-bold">Resumos automáticos</span>{" "}
                                — compilados por IA ao longo do dia.
                            </p>
                        </div>
                        <div className="flex items-center gap-3 text-left">
                            <Zap className="h-5 w-5 text-red-400 shrink-0" />
                            <p className="text-sm text-secondary-gray-300">
                                <span className="text-white font-bold">Alertas de risco</span>{" "}
                                — detecção automática de conteúdo sensível.
                            </p>
                        </div>
                        <div className="flex items-center gap-3 text-left">
                            <Zap className="h-5 w-5 text-sky-400 shrink-0" />
                            <p className="text-sm text-secondary-gray-300">
                                <span className="text-white font-bold">Insights de membros</span>{" "}
                                — análise de engajamento e sentimento.
                            </p>
                        </div>
                    </div>
                </div>
            </PremiumCard>

            <button
                onClick={() => router.push("/dashboard")}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold text-sm hover:opacity-90 transition-opacity cursor-pointer"
            >
                Ir para o Dashboard <ArrowRight className="h-4 w-4" />
            </button>
        </motion.div>
    );
}

export default function OnboardingPage() {
    const { organization, loading: orgLoading } = useOrganization();
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
        getOnboardingData().then((d) => {
            setData(d);
            setLoading(false);
        });
    }, []);

    const handlePlatformSelect = (p: Platform) => {
        setPlatform(p);
        setStep(1);
    };

    const handleStartListening = async () => {
        if (!organization || !data || !platform) return;
        setRegistering(true);
        setError(null);

        const result = await registerGroup({
            name: groupName,
            description: groupDescription,
            platform,
            organizationId: organization.id,
        });

        if (result.error) {
            setError(result.error);
            setRegistering(false);
            return;
        }

        if (result.groupId) {
            setGroupId(result.groupId);
            setExternalId(result.externalId); // Save external ID
            setStep(2);
        }
        setRegistering(false);
    };

    if (loading || orgLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="h-8 w-8 border-2 border-emerald-500 border-t-transparent rounded-full"
                />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 md:py-14">
            <ProgressBar step={step} />

            <AnimatePresence mode="wait">
                {step === 0 && (
                    <StepPlatform key="platform" onSelect={handlePlatformSelect} />
                )}

                {step === 1 && data && (
                    <StepInstruction
                        key="instruction"
                        platform={platform}
                        data={data}
                        groupName={groupName}
                        setGroupName={setGroupName}
                        groupDescription={groupDescription}
                        setGroupDescription={setGroupDescription}
                        onNext={handleStartListening}
                        onBack={() => setStep(0)}
                        error={error}
                    />
                )}

                {step === 2 && (
                    <StepListening
                        key="listening"
                        groupId={groupId}
                        externalId={externalId}
                        onConnected={() => setStep(3)}
                        onBack={() => setStep(1)}
                    />
                )}

                {step === 3 && <StepWelcome key="welcome" />}
            </AnimatePresence>

            {registering && (
                <div className="fixed inset-0 bg-navy-950/80 backdrop-blur-sm flex items-center justify-center z-50">
                    <PremiumCard className="p-8 text-center space-y-4 max-w-xs">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="h-8 w-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto"
                        />
                        <p className="text-sm text-white font-semibold">
                            Registrando grupo...
                        </p>
                    </PremiumCard>
                </div>
            )}
        </div>
    );
}
