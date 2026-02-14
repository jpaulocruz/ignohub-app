"use client";

import { useState, useMemo } from "react";
import {
    AlertTriangle,
    Zap,
    Users,
    Calendar,
    Database,
    CheckCircle2,
    Archive,
    Share2,
    MessageSquare,
    Info,
    Check,
    ShieldAlert,
    BarChart3
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { markAsReadAction, archiveItemAction } from "@/app/(dashboard)/inbox/actions";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { motion } from "framer-motion";

interface InboxDetailViewProps {
    item: any;
    onUpdate: () => void;
}

export function InboxDetailView({ item, onUpdate }: InboxDetailViewProps) {
    const [checklist, setChecklist] = useState<Record<string, boolean>>({});
    const [archiving, setArchiving] = useState(false);

    const toggleCheck = (index: number) => {
        setChecklist(prev => ({ ...prev, [index]: !prev[index] }));
    };

    const handleArchive = async () => {
        setArchiving(true);
        await archiveItemAction(item.id, item.source);
        onUpdate();
        setArchiving(false);
    };

    const handleShare = () => {
        const text = `*IgnoHub Intelligence Report*\n\n*Tipo:* ${item.source.toUpperCase()}\n*Título:* ${item.title}\n*Grupo:* ${item.group_name}\n\n${item.summary || item.summary_text || item.insight_text}\n\n_Gerado por IgnoHub AI_`;
        navigator.clipboard.writeText(text);
        alert("Copiado para o WhatsApp!");
    };

    const renderAlertView = () => (
        <div className="space-y-10">
            {/* Risk Score */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="flex-1 w-full space-y-3">
                    <h4 className="text-[10px] font-black text-secondary-gray-500 uppercase tracking-widest">Gravidade do Incidente</h4>
                    <div className="h-4 w-full bg-navy-900 rounded-full overflow-hidden flex border border-white/5 p-1">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{
                                width: item.severity === "high" ? "90%" : item.severity === "medium" ? "50%" : "20%"
                            }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className={cn(
                                "h-full rounded-full transition-all shadow-lg",
                                item.severity === "high" ? "bg-red-500 shadow-red-500/30" :
                                    item.severity === "medium" ? "bg-amber-500 shadow-amber-500/30" : "bg-green-500 shadow-green-500/30"
                            )}
                        />
                    </div>
                </div>
                <div className={cn(
                    "px-8 py-5 rounded-3xl border flex flex-col items-center justify-center min-w-[120px] shadow-premium",
                    item.severity === "high" ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-navy-900 border-white/5 text-secondary-gray-500"
                )}>
                    <span className="text-3xl font-black">{item.score || (item.severity === "high" ? "9.2" : "4.5")}</span>
                    <span className="text-[10px] font-black uppercase tracking-tight">PH-Score</span>
                </div>
            </div>

            {/* Evidence */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-black text-secondary-gray-500 uppercase tracking-widest">
                    <ShieldAlert className="h-3 w-3" />
                    Evidência Primária
                </div>
                <div className="bg-navy-900/50 border border-white/5 rounded-3xl p-8 font-medium text-sm text-secondary-gray-300 leading-relaxed italic shadow-inner">
                    "{item.evidence_excerpt || "Captura de dados processada pela IA. Nenhuma evidência textual direta disponível."}"
                </div>
            </div>

            {/* Recommended Actions */}
            <div className="space-y-6">
                <h4 className="text-[10px] font-black text-secondary-gray-500 uppercase tracking-widest">Protocolo de Resposta</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(item.recommended_actions || ["Notificar Admin", "Monitorar Usuário", "Extrair Relatório"]).map((action: string, idx: number) => (
                        <button
                            key={idx}
                            onClick={() => toggleCheck(idx)}
                            className={cn(
                                "flex items-center gap-4 p-5 rounded-2xl border transition-all text-left group",
                                checklist[idx]
                                    ? "bg-green-500/10 border-green-500/20 text-green-500"
                                    : "bg-navy-900/50 border-white/5 text-secondary-gray-500 hover:border-brand-500/30 hover:text-white"
                            )}
                        >
                            <div className={cn(
                                "h-6 w-6 rounded-lg border flex items-center justify-center transition-all shrink-0",
                                checklist[idx] ? "bg-green-500 border-green-500 text-navy-900" : "bg-transparent border-secondary-gray-600 group-hover:border-brand-500"
                            )}>
                                {checklist[idx] && <Check className="h-4 w-4 stroke-[4]" />}
                            </div>
                            <span className="text-sm font-bold">{action}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderSummaryView = () => (
        <div className="space-y-10">
            {/* Markdown Text */}
            <div className="space-y-4">
                <h4 className="text-[10px] font-black text-secondary-gray-500 uppercase tracking-widest">Sumário Executivo (IA)</h4>
                <div className="prose prose-invert prose-indigo max-w-none glass-card rounded-[32px] p-10 text-secondary-gray-300 font-medium leading-relaxed shadow-premium">
                    <ReactMarkdown>{item.summary_text || item.summary}</ReactMarkdown>
                </div>
            </div>

            {/* Highlights Grid */}
            {item.highlights && Object.keys(item.highlights).length > 0 && (
                <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-secondary-gray-500 uppercase tracking-widest">Pontos de Destaque</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(item.highlights).map(([key, value]: [string, any]) => (
                            <PremiumCard key={key} className="p-6 transition-all hover:translate-y-[-2px] hover:border-brand-500/20 group">
                                <div className="flex flex-col gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500 group-hover:bg-brand-500 group-hover:text-white transition-all">
                                        <Zap className="h-5 w-5" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase text-brand-400 tracking-wider">{key}</p>
                                        <p className="text-lg font-bold text-white leading-tight">
                                            {typeof value === "object" ? JSON.stringify(value) : value}
                                        </p>
                                    </div>
                                </div>
                            </PremiumCard>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    const renderInsightView = () => (
        <div className="space-y-10">
            {/* Author Behavior Analysis */}
            <PremiumCard className="p-8 border-l-4 border-l-green-500">
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-3xl bg-green-500/10 flex items-center justify-center text-green-500 border border-green-500/20">
                        <Users className="h-10 w-10" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-secondary-gray-500 uppercase tracking-widest">Identificador do Membro</p>
                        <h3 className="text-2xl font-bold text-white font-mono break-all leading-none">{item.author_hash}</h3>
                        <div className="flex gap-2 pt-2">
                            <span className="px-3 py-1 bg-green-500/10 rounded-full text-[9px] font-black text-green-500 border border-green-500/20 uppercase">Destaque</span>
                            <span className="px-3 py-1 bg-navy-900 rounded-full text-[9px] font-black text-secondary-gray-500 border border-white/5 uppercase">Regra: {item.role || "MEMBER"}</span>
                        </div>
                    </div>
                </div>
            </PremiumCard>

            <div className="space-y-4">
                <h4 className="text-[10px] font-black text-secondary-gray-500 uppercase tracking-widest">Análise Comportamental</h4>
                <div className="glass-card rounded-[32px] p-10 text-white font-bold leading-relaxed text-xl relative shadow-premium border-l-4 border-l-brand-500">
                    <MessageSquare className="absolute -left-3 top-10 h-8 w-8 text-brand-500 opacity-20" />
                    {item.insight_text || item.summary}
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-navy-800">
            {/* Header */}
            <div className="p-8 border-b border-white/5 space-y-4 bg-navy-800/50 sticky top-0 z-10 backdrop-blur-xl">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "w-14 h-14 rounded-2xl flex items-center justify-center border shadow-lg",
                            item.source === "alert" ? "bg-red-500/10 border-red-500/20 text-red-500" :
                                item.source === "summary" ? "bg-brand-500/10 border-brand-500/20 text-brand-500" :
                                    "bg-green-500/10 border-green-500/20 text-green-500"
                        )}>
                            {item.source === "alert" && <AlertTriangle className="h-7 w-7" />}
                            {item.source === "summary" && <Zap className="h-7 w-7" />}
                            {item.source === "insight" && <Users className="h-7 w-7" />}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-black text-white uppercase tracking-widest bg-navy-900 px-2 py-0.5 rounded border border-white/5">
                                    {item.source === "alert" ? "Relatório de Incidente" :
                                        item.source === "summary" ? "Monitoramento Ativo" : "Inteligência Social"}
                                </span>
                            </div>
                            <p className="text-xs text-secondary-gray-500 font-bold">
                                {item.group_name} <span className="mx-2 text-white/10">|</span> {new Date(item.created_at).toLocaleString("pt-BR")}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-secondary-gray-500 text-[10px] font-black uppercase tracking-widest bg-navy-900 px-4 py-2 rounded-full border border-white/5 shadow-inner">
                        <Calendar className="h-4 w-4 text-brand-500" />
                        {new Date(item.created_at).toLocaleDateString("pt-BR")}
                    </div>
                </div>
                <h2 className="text-4xl font-black text-white tracking-tight leading-tight max-w-2xl">
                    {item.title}
                </h2>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-navy-900/20">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                >
                    {item.source === "alert" && renderAlertView()}
                    {item.source === "summary" && renderSummaryView()}
                    {item.source === "insight" && renderInsightView()}
                </motion.div>
            </div>

            {/* Footer Actions */}
            <div className="p-8 border-t border-white/5 bg-navy-800/80 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <button
                        onClick={handleArchive}
                        disabled={archiving}
                        className="flex-1 md:flex-none flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-navy-900 border border-white/5 text-secondary-gray-500 hover:text-white hover:border-white/10 transition-all font-bold text-sm shadow-inner"
                    >
                        <Archive className="h-4 w-4" />
                        Arquivar
                    </button>
                    <button
                        onClick={async () => {
                            await markAsReadAction(item.id, item.source);
                            onUpdate();
                        }}
                        className="flex-1 md:flex-none flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-navy-900 border border-white/5 text-secondary-gray-500 hover:text-white hover:border-white/10 transition-all font-bold text-sm shadow-inner"
                    >
                        <CheckCircle2 className="h-4 w-4" />
                        Resolver
                    </button>
                </div>
                <button
                    onClick={handleShare}
                    className="w-full md:w-auto flex items-center justify-center gap-3 px-10 py-4 rounded-2xl bg-brand-500 text-white hover:bg-brand-600 transition-all font-black text-sm shadow-lg shadow-brand-500/20 active:scale-95"
                >
                    <Share2 className="h-4 w-4" />
                    Exportar Insight
                </button>
            </div>
        </div>
    );
}
