"use client";

import { useEffect, useState } from "react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { SentimentChart } from "@/components/ui/sentiment-chart";
import { useOrganization } from "@/hooks/use-organization";
import { createClient } from "@/lib/supabase/client";
import {
    AlertTriangle,
    Smile,
    TrendingUp,
    Zap,
    Users,
    Activity,
    ChevronRight,
    MessageCircle,
    BarChart3
} from "lucide-react";
import Link from "next/link";
import { SummaryDetailModal } from "@/components/dashboard/summary-detail-modal";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
    const { organization, loading: orgLoading } = useOrganization();
    const [analytics, setAnalytics] = useState<any[]>([]);
    const [alerts, setAlerts] = useState<any[]>([]);
    const [summaries, setSummaries] = useState<any[]>([]);
    const [memberInsights, setMemberInsights] = useState<any[]>([]);
    const [messageVolume, setMessageVolume] = useState(0);
    const [loading, setLoading] = useState(true);
    const [selectedSummary, setSelectedSummary] = useState<any>(null);

    const supabase = createClient();

    useEffect(() => {
        if (!organization) return;

        async function fetchData() {
            try {
                setLoading(true);

                // Fetch Analytics for Chart
                const { data: analyticsData } = await (supabase as any)
                    .from("group_analytics")
                    .select("*")
                    .eq("organization_id", organization!.id)
                    .order("period_start", { ascending: true });

                // Fetch Active Alerts
                const { data: alertsData } = await (supabase as any)
                    .from("alerts")
                    .select("*")
                    .eq("organization_id", organization!.id)
                    .eq("status", "open");

                // Fetch Recent Summaries
                const { data: summariesData } = await (supabase as any)
                    .from("summaries")
                    .select("*")
                    .eq("organization_id", organization!.id)
                    .order("created_at", { ascending: false })
                    .limit(3);

                // Fetch Member Insights
                const { data: insightsData } = await (supabase as any)
                    .from("member_insights")
                    .select("*")
                    .eq("organization_id", organization!.id)
                    .order("created_at", { ascending: false })
                    .limit(5);

                // Fetch Message Volume
                const { data: volumeData } = await (supabase as any)
                    .from("message_batches")
                    .select("message_count")
                    .eq("organization_id", organization!.id)
                    .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

                const totalVolume = volumeData?.reduce((acc: number, curr: any) => acc + (curr.message_count || 0), 0) || 0;

                setAnalytics(analyticsData || []);
                setAlerts(alertsData || []);
                setSummaries(summariesData || []);
                setMemberInsights(insightsData || []);
                setMessageVolume(totalVolume);
            } catch (err) {
                console.error("[Dashboard] Error fetching data:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [organization]);

    if (orgLoading || loading) {
        return (
            <div className="space-y-8 animate-pulse">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-32 rounded-3xl bg-navy-800" />
                    ))}
                </div>
                <div className="h-96 w-full bg-navy-800 rounded-3xl" />
            </div>
        );
    }

    const avgSentiment = analytics.length
        ? Math.round(analytics.reduce((acc, curr) => acc + curr.sentiment_score, 0) / analytics.length)
        : 0;

    const chartData = analytics.map(a => ({
        date: new Date(a.period_start).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        score: a.sentiment_score
    }));

    // Stagger animation variant
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-8"
        >
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Estatísticas Gerais</h1>
                    <p className="text-secondary-gray-600 font-medium">Acompanhe a saúde e o engajamento de suas comunidades.</p>
                </div>
                <Link
                    href="/groups"
                    className="flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 px-6 rounded-2xl transition-all shadow-lg shadow-brand-500/20 active:scale-95"
                >
                    <Users className="h-5 w-5" />
                    Gerenciar Canais
                </Link>
            </header>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <PremiumCard className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-full bg-secondary-gray-400/10 flex items-center justify-center">
                            <Smile className="h-7 w-7 text-brand-500" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-secondary-gray-500">Sentimento Global</p>
                            <h3 className="text-2xl font-bold text-white">{avgSentiment}%</h3>
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", avgSentiment > 70 ? "bg-green-500" : "bg-yellow-500")} />
                        <span className="text-[10px] font-bold text-secondary-gray-600 uppercase tracking-wider">
                            {avgSentiment > 70 ? "Clima Positivo" : "Atenção Necessária"}
                        </span>
                    </div>
                </PremiumCard>

                <PremiumCard className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-full bg-red-500/10 flex items-center justify-center">
                            <AlertTriangle className="h-7 w-7 text-red-500" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-secondary-gray-500">Alertas Abertos</p>
                            <h3 className="text-2xl font-bold text-white">{alerts.length}</h3>
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                        <Zap className="h-3 w-3 text-red-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-secondary-gray-600 uppercase tracking-wider">Prioridade Alta</span>
                    </div>
                </PremiumCard>

                <PremiumCard className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-full bg-green-500/10 flex items-center justify-center">
                            <Activity className="h-7 w-7 text-green-500" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-secondary-gray-500">Volume 24h</p>
                            <h3 className="text-2xl font-bold text-white">{messageVolume.toLocaleString()}</h3>
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                        <MessageCircle className="h-3 w-3 text-green-500" />
                        <span className="text-[10px] font-bold text-secondary-gray-600 uppercase tracking-wider">Mensagens Processadas</span>
                    </div>
                </PremiumCard>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Evolution Chart */}
                <div className="lg:col-span-2 space-y-6">
                    <PremiumCard className="p-8">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                <BarChart3 className="h-5 w-5 text-brand-500" />
                                Evolução do Sentimento
                            </h3>
                            <div className="flex gap-2">
                                <button className="px-3 py-1 bg-navy-900 rounded-lg text-xs font-bold text-brand-500 border border-white/5">Geral</button>
                            </div>
                        </div>
                        <div className="h-[300px] w-full">
                            <SentimentChart data={chartData} />
                        </div>
                    </PremiumCard>

                    {/* Recent Activity / Summaries */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-white flex items-center gap-3 ml-2">
                            <Zap className="h-5 w-5 text-brand-500" />
                            Insights Recentes
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                            {summaries.length === 0 ? (
                                <PremiumCard variant="transparent" className="p-12 text-center border-2 border-dashed border-white/5">
                                    <p className="text-secondary-gray-600 font-medium italic">Nenhum insight disponível no momento.</p>
                                </PremiumCard>
                            ) : (
                                summaries.map((s) => (
                                    <motion.div key={s.id} whileHover={{ x: 5 }}>
                                        <PremiumCard className="p-6 hover:bg-navy-800/80 transition-all cursor-pointer group">
                                            <div className="flex items-start justify-between gap-6">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] font-black text-brand-400 uppercase tracking-widest bg-brand-500/10 px-2 py-1 rounded">Resumo IA</span>
                                                        <span className="text-[10px] font-medium text-secondary-gray-600">
                                                            {new Date(s.created_at).toLocaleString("pt-BR")}
                                                        </span>
                                                    </div>
                                                    <p className="text-secondary-gray-300 text-sm font-medium leading-relaxed line-clamp-2">
                                                        {s.summary_text}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => setSelectedSummary(s)}
                                                    className="h-10 w-10 flex items-center justify-center rounded-xl bg-navy-900 border border-white/5 text-secondary-gray-600 group-hover:text-brand-500 group-hover:border-brand-500/30 transition-all"
                                                >
                                                    <ChevronRight className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </PremiumCard>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Metrics */}
                <div className="space-y-8">
                    {/* Member Insights */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-3 ml-2">
                            <Users className="h-5 w-5 text-brand-500" />
                            Participação Ativa
                        </h3>
                        <PremiumCard className="p-6">
                            <div className="space-y-6">
                                {memberInsights.length === 0 ? (
                                    <p className="text-center py-12 text-secondary-gray-600 text-sm italic font-medium">Nenhum destaque detectado.</p>
                                ) : (
                                    memberInsights.map((member, i) => (
                                        <div key={member.id} className="flex items-start gap-4 transition-all hover:translate-x-1 group">
                                            <div className="w-10 h-10 rounded-xl bg-navy-900 flex items-center justify-center border border-white/5 text-brand-500 font-bold text-xs shrink-0 group-hover:border-brand-500/30">
                                                {i + 1}
                                            </div>
                                            <div className="space-y-1 overflow-hidden">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-white font-mono">{member.author_hash.slice(0, 8)}</span>
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                                                        member.role === "influencer" ? "bg-brand-500/20 text-brand-400" : "bg-navy-900 text-secondary-gray-600"
                                                    )}>
                                                        {member.role || "MEMBER"}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-secondary-gray-500 font-medium leading-tight line-clamp-2">
                                                    {member.insight_text}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </PremiumCard>
                    </div>

                    {/* Active Alerts List */}
                    {alerts.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-3 ml-2">
                                <AlertTriangle className="h-5 w-5 text-red-500" />
                                Alertas do Período
                            </h3>
                            <div className="space-y-3">
                                {alerts.map(a => (
                                    <PremiumCard key={a.id} className="p-5 border-l-4 border-l-red-500">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[9px] font-black text-red-500 uppercase tracking-widest bg-red-500/10 px-2 py-0.5 rounded">
                                                {a.severity}
                                            </span>
                                            <span className="text-[9px] font-bold text-secondary-gray-600">
                                                {new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <h4 className="text-sm font-bold text-white leading-tight">{a.title}</h4>
                                    </PremiumCard>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {selectedSummary && (
                <SummaryDetailModal
                    summary={selectedSummary}
                    onClose={() => setSelectedSummary(null)}
                />
            )}
        </motion.div>
    );
}
