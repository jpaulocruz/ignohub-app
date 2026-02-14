"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
    Calendar,
    User,
    MessageSquareText,
    ChevronLeft,
    Globe,
    Zap,
    Users,
    Activity,
    ShieldCheck,
    TrendingUp
} from "lucide-react";
import Link from "next/link";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function GroupPage() {
    const params = useParams();
    const groupId = params.id as string;
    const [group, setGroup] = useState<any>(null);
    const [summaries, setSummaries] = useState<any[]>([]);
    const [insights, setInsights] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const supabase = createClient();

    useEffect(() => {
        if (!groupId) return;

        async function fetchGroupData() {
            try {
                setLoading(true);

                const { data: groupData } = await supabase
                    .from("groups")
                    .select("*")
                    .eq("id", groupId)
                    .single();

                const { data: summariesData } = await supabase
                    .from("summaries")
                    .select("*")
                    .eq("group_id", groupId)
                    .order("created_at", { ascending: false });

                const { data: insightsData } = await supabase
                    .from("member_insights")
                    .select("*")
                    .eq("group_id", groupId)
                    .order("created_at", { ascending: false });

                setGroup(groupData);
                setSummaries(summariesData || []);
                setInsights(insightsData || []);
            } catch (err) {
                console.error("[GroupPage] Error fetching data:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchGroupData();
    }, [groupId]);

    if (loading) {
        return (
            <div className="space-y-10 animate-pulse pb-12">
                <div className="h-4 w-32 bg-navy-800 rounded-full" />
                <div className="h-16 w-3/4 bg-navy-800 rounded-2xl" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <div key={i} className="h-32 bg-navy-800 rounded-premium" />)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 h-96 bg-navy-800 rounded-premium" />
                    <div className="h-96 bg-navy-800 rounded-premium" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-12 bg-navy-900 min-h-screen">
            <header className="space-y-4">
                <Link
                    href="/dashboard"
                    className="group inline-flex items-center gap-2 text-secondary-gray-500 hover:text-white transition-all mb-2 font-bold text-[10px] uppercase tracking-[0.2em]"
                >
                    <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    Voltar ao Painel
                </Link>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center border shadow-lg",
                                group?.platform === 'whatsapp' ? "bg-green-500/10 border-green-500/20 text-green-500" : "bg-blue-500/10 border-blue-500/20 text-blue-500"
                            )}>
                                {group?.platform === 'whatsapp' ? <span className="font-black text-xs">WA</span> : <span className="font-black text-xs">TG</span>}
                            </div>
                            <h1 className="text-5xl font-black text-white tracking-tighter leading-none">{group?.name}</h1>
                        </div>
                        <p className="text-secondary-gray-500 font-medium text-lg">
                            Inteligência ativa em <span className="text-white font-bold capitalize">{group?.platform}</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-3 bg-navy-800 border border-white/5 rounded-2xl px-6 py-3 shadow-inner">
                        <Activity className="h-4 w-4 text-brand-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-secondary-gray-500">Monitorando em tempo real</span>
                    </div>
                </div>
            </header>

            {/* Stats Quick View */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <PremiumCard className="p-6 border-l-4 border-l-brand-500">
                    <p className="text-[10px] font-black text-secondary-gray-500 uppercase tracking-widest mb-1">Membro Ativo</p>
                    <p className="text-2xl font-bold text-white">Hunter AI</p>
                </PremiumCard>
                <PremiumCard className="p-6 border-l-4 border-l-green-500">
                    <p className="text-[10px] font-black text-secondary-gray-500 uppercase tracking-widest mb-1">Total Insights</p>
                    <p className="text-2xl font-bold text-white">{insights.length}</p>
                </PremiumCard>
                <PremiumCard className="p-6 border-l-4 border-l-amber-500">
                    <p className="text-[10px] font-black text-secondary-gray-500 uppercase tracking-widest mb-1">Alertas (7d)</p>
                    <p className="text-2xl font-bold text-white">--</p>
                </PremiumCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-8">
                    <section className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-500 border border-brand-500/20">
                                <MessageSquareText className="h-4 w-4" />
                            </div>
                            <h2 className="text-2xl font-black text-white tracking-tight">Cronologia de Inteligência</h2>
                        </div>

                        <div className="space-y-6">
                            {summaries.length === 0 ? (
                                <div className="py-20 text-center bg-navy-800/30 rounded-premium border border-white/5 border-dashed">
                                    <p className="text-secondary-gray-600 font-bold italic tracking-tight">Nenhum resumo gerado para este grupo ainda.</p>
                                </div>
                            ) : (
                                <div className="relative space-y-6">
                                    {/* Timeline line */}
                                    <div className="absolute left-[39px] top-6 bottom-6 w-[2px] bg-white/5 hidden md:block" />

                                    {summaries.map((s, idx) => (
                                        <motion.div
                                            key={s.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                        >
                                            <PremiumCard className="overflow-hidden p-0 group hover:border-brand-500/20 transition-all duration-500">
                                                <div className="bg-navy-900/50 p-6 border-b border-white/5 flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-500 group-hover:bg-brand-500 group-hover:text-white transition-all shadow-inner">
                                                            <Zap className="h-5 w-5" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-secondary-gray-500 leading-none mb-1">Resumo Periódico</p>
                                                            <p className="text-sm font-bold text-white">
                                                                {new Date(s.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className="text-[10px] font-mono text-secondary-gray-600 uppercase tracking-widest bg-navy-950 px-3 py-1 rounded-lg border border-white/5">
                                                        {new Date(s.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <div className="p-8">
                                                    <div className="prose prose-invert prose-indigo max-w-none text-secondary-gray-400 font-medium leading-relaxed">
                                                        {s.summary_text}
                                                    </div>
                                                </div>
                                                <div className="px-8 py-4 bg-navy-900/20 flex gap-4 items-center border-t border-white/5">
                                                    <button className="text-[9px] font-black uppercase text-brand-500 tracking-[0.2em] hover:text-brand-400">Ver Discussões Relacionadas</button>
                                                    <span className="text-white/10">|</span>
                                                    <button className="text-[9px] font-black uppercase text-secondary-gray-600 tracking-[0.2em] hover:text-white">Gerar PDF</button>
                                                </div>
                                            </PremiumCard>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                <aside className="space-y-10">
                    <section className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500 border border-green-500/20">
                                <Users className="h-4 w-4" />
                            </div>
                            <h2 className="text-2xl font-black text-white tracking-tight">Perfis em Destaque</h2>
                        </div>

                        <div className="space-y-4">
                            {insights.length === 0 ? (
                                <div className="py-20 text-center bg-navy-800/30 rounded-premium border border-white/5 border-dashed">
                                    <p className="text-secondary-gray-600 font-bold italic tracking-tight">Sem insights disponíveis.</p>
                                </div>
                            ) : (
                                insights.map((i, idx) => (
                                    <motion.div
                                        key={i.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: idx * 0.05 }}
                                    >
                                        <PremiumCard className="p-6 space-y-4 border-l-4 border-l-brand-500/50 hover:border-l-brand-500 transition-all bg-navy-800/20 group">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-2xl bg-navy-900 flex items-center justify-center text-[10px] font-black text-brand-500 uppercase shadow-inner border border-white/5">
                                                        {i.role.substring(0, 2)}
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-secondary-gray-500 leading-none mb-1">Comportamento</p>
                                                        <p className="text-xs font-black text-white uppercase tracking-widest">{i.role}</p>
                                                    </div>
                                                </div>
                                                <TrendingUp className="h-4 w-4 text-green-500 opacity-20 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                            <div className="bg-navy-900/50 p-4 rounded-2xl border border-white/5 italic">
                                                <p className="text-sm text-secondary-gray-400 leading-relaxed">
                                                    "{i.insight_text}"
                                                </p>
                                            </div>
                                            <div className="text-[9px] font-bold text-secondary-gray-600 uppercase text-right tracking-[0.2em]">
                                                Detetado: {new Date(i.created_at).toLocaleDateString()}
                                            </div>
                                        </PremiumCard>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </section>

                    {/* Group Health / Stats */}
                    <PremiumCard className="p-8 space-y-6 bg-gradient-to-br from-navy-800 to-navy-900 border border-white/5 shadow-2xl">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase text-brand-500 tracking-[0.3em]">Saúde da Comunidade</p>
                            <h3 className="text-2xl font-black text-white">Status Sentinel</h3>
                        </div>
                        <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-secondary-gray-500">
                                    <span>Engajamento</span>
                                    <span className="text-white">88%</span>
                                </div>
                                <div className="h-2 w-full bg-navy-950 rounded-full overflow-hidden border border-white/5">
                                    <div className="h-full w-[88%] bg-brand-500 shadow-[0_0_10px_rgba(78,89,255,0.4)] rounded-full" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-secondary-gray-500">
                                    <span>Segurança</span>
                                    <span className="text-white">Estável</span>
                                </div>
                                <div className="h-2 w-full bg-navy-950 rounded-full overflow-hidden border border-white/5">
                                    <div className="h-full w-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)] rounded-full" />
                                </div>
                            </div>
                        </div>
                        <Link href="/groups" className="block text-center pt-4 text-[10px] font-black uppercase text-secondary-gray-600 hover:text-white tracking-[0.2em] transition-colors">
                            Gerenciar Conexões →
                        </Link>
                    </PremiumCard>
                </aside>
            </div>
        </div>
    );
}
