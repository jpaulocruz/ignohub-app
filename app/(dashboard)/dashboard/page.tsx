"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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
    BarChart3,
    ArrowRight
} from "lucide-react";
import Link from "next/link";
import { SummaryDetailModal } from "@/components/dashboard/summary-detail-modal";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/dashboard/metric-card";
import { WeeklyActivityChart } from "@/components/dashboard/weekly-activity-chart";
import { DashboardService, DashboardMetrics, WeeklyTrend, GroupOverview } from "@/lib/services/dashboard";

import type { Database } from "@/types/database.types";

type Analytics = Database['public']['Tables']['group_analytics']['Row'];
type Alert = Database['public']['Tables']['alerts']['Row'];
type Summary = Database['public']['Tables']['summaries']['Row'];
type MemberInsight = Database['public']['Tables']['member_insights']['Row'];

export default function DashboardPage() {
    const router = useRouter();
    const { organization, userName, loading: orgLoading } = useOrganization();
    const t = useTranslations("dashboard");
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [weeklyTrends, setWeeklyTrends] = useState<WeeklyTrend[]>([]);
    const [monitoredGroups, setMonitoredGroups] = useState<GroupOverview[]>([]);
    const [topMembers, setTopMembers] = useState<TopMember[]>([]);
    const [aiInsights, setAiInsights] = useState<{ summaries: any[]; alerts: any[] }>({ summaries: [], alerts: [] });
    const [analytics, setAnalytics] = useState<Analytics[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSummary, setSelectedSummary] = useState<Summary | null>(null);

    const supabase = createClient();

    useEffect(() => {
        if (!organization) return;

        async function fetchData() {
            try {
                setLoading(true);
                const service = new DashboardService(supabase);

                const [
                    metricsData,
                    trendsData,
                    groupsData,
                    topMembersData,
                    insightsData,
                    analyticsData
                ] = await Promise.all([
                    service.getMetrics(organization!.id),
                    service.getWeeklyTrends(organization!.id),
                    service.getMonitoredGroups(organization!.id),
                    service.getTopMembers(organization!.id),
                    service.getAIInsights(organization!.id),
                    supabase
                        .from("group_analytics")
                        .select("*")
                        .eq("organization_id", organization!.id)
                        .order("period_start", { ascending: true })
                ]);

                setMetrics(metricsData);
                setWeeklyTrends(trendsData);
                setMonitoredGroups(groupsData);
                setTopMembers(topMembersData);
                setAiInsights(insightsData);
                setAnalytics(analyticsData.data || []);
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
            <div className="space-y-6 pb-16">
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <div className="h-7 w-32 bg-muted rounded-lg animate-pulse" />
                        <div className="h-4 w-56 bg-muted rounded animate-pulse" />
                    </div>
                    <div className="h-9 w-36 bg-muted rounded-lg animate-pulse" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
                    ))}
                </div>
                <div className="h-80 w-full bg-muted rounded-xl animate-pulse" />
            </div>
        );
    }

    const avgSentiment = analytics.length
        ? Math.round(analytics.reduce((acc, curr) => acc + (curr.sentiment_score ?? 0), 0) / analytics.length)
        : 0;

    const chartData = analytics.map(a => ({
        date: new Date(a.period_start).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        score: a.sentiment_score ?? 0
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
        <div className="space-y-8 pb-16">
            {/* Greeting & Quick Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                        {t('title')}, {userName}
                    </h1>
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <p className="text-sm text-muted-foreground">
                            Sua conta está ativa e sendo monitorada em tempo real.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button onClick={() => router.push("/onboarding")} variant="outline" className="gap-2">
                        <Zap className="h-4 w-4" />
                        {t('quick_actions')}
                    </Button>
                    <Link
                        href="/groups"
                        className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium px-4 py-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Users className="h-4 w-4" />
                        {t('view_communities')}
                    </Link>
                </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <MetricCard
                    title={t('total_groups')}
                    value={metrics?.groups.count || 0}
                    growth={metrics?.groups.growth}
                    icon={<Users className="h-4 w-4" />}
                />
                <MetricCard
                    title={t('total_members')}
                    value={metrics?.members.count || 0}
                    growth={metrics?.members.growth}
                    icon={<Activity className="h-4 w-4" />}
                />
                <MetricCard
                    title={t('total_messages')}
                    value={metrics ? (metrics.messages.count > 999 ? `${(metrics.messages.count / 1000).toFixed(1)}K` : metrics.messages.count) : 0}
                    growth={metrics?.messages.growth}
                    icon={<MessageCircle className="h-4 w-4" />}
                />
                <MetricCard
                    title={t('engagement')}
                    value={`${metrics?.engagement.count || 0}%`}
                    growth={metrics?.engagement.growth}
                    icon={<Zap className="h-4 w-4" />}
                />
                <MetricCard
                    title={t('active_alerts')}
                    value={aiInsights.alerts.length}
                    growth={metrics?.alerts.growth}
                    icon={<AlertTriangle className="h-4 w-4" />}
                    className={aiInsights.alerts.length > 0 ? "border-red-200 dark:border-red-900/30" : ""}
                />
            </div>

            {/* Main grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Visualizations Column */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="grid grid-cols-1 gap-8">
                        {/* Weekly Activity */}
                        <PremiumCard className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-lg font-semibold text-foreground">{t('weekly_activity')}</h2>
                                    <p className="text-xs text-muted-foreground mt-0.5">Mensagens e engajamento nas últimas 12 semanas</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-sm bg-primary" />
                                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Mensagens</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-sm bg-[#f0f1ff]" />
                                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Membros</span>
                                    </div>
                                </div>
                            </div>
                            <WeeklyActivityChart data={weeklyTrends} />
                        </PremiumCard>

                        {/* Sentiment Chart */}
                        <PremiumCard className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-sm font-semibold text-foreground">{t('sentiment_trend')}</h2>
                                    <p className="text-xs text-muted-foreground mt-0.5">{t('community_health')}</p>
                                </div>
                                <div className="p-2 bg-green-500/10 text-green-600 rounded-lg">
                                    <Smile className="h-4 w-4" />
                                </div>
                            </div>
                            <SentimentChart data={chartData} />
                        </PremiumCard>
                    </div>

                    {/* Monitored Groups Grid */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-foreground">{t('monitored_groups')}</h2>
                            <Link href="/groups" className="text-xs font-medium text-primary hover:underline">
                                Ver todos os grupos
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {monitoredGroups.slice(0, 4).map((group) => (
                                <PremiumCard key={group.id} className="p-4 hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <h3 className="text-sm font-semibold line-clamp-1">{group.name}</h3>
                                            <div className="flex items-center gap-2">
                                                <span className={cn(
                                                    "text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider",
                                                    group.platform === 'whatsapp' ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                                                )}>
                                                    {group.platform}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {group.messageCount} msg
                                                </span>
                                            </div>
                                        </div>
                                        <div className={cn(
                                            "w-2 h-2 rounded-full",
                                            group.status === 'active' ? "bg-green-500" : "bg-amber-500 animate-pulse"
                                        )} />
                                    </div>
                                    <div className="mt-4 flex items-center justify-between text-[10px] text-muted-foreground">
                                        <span>Última atividade:</span>
                                        <span className="font-medium">
                                            {group.lastActivity ? formatDistanceToNow(new Date(group.lastActivity), { addSuffix: true, locale: ptBR }) : 'N/A'}
                                        </span>
                                    </div>
                                </PremiumCard>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column (AI Insights & Alerts) */}
                <div className="space-y-8">
                    {/* Actionable Insights */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-primary fill-primary/10" />
                            <h2 className="text-lg font-semibold text-foreground">{t('actionable_insights')}</h2>
                        </div>

                        {aiInsights.summaries.length === 0 && aiInsights.alerts.filter(a => a.recommended_actions).length === 0 ? (
                            <PremiumCard className="p-8 text-center border-dashed">
                                <p className="text-sm text-muted-foreground">Otimizando seus dados...</p>
                                <p className="text-[10px] text-muted-foreground mt-1">Insights aparecerão conforme as conversas evoluem.</p>
                            </PremiumCard>
                        ) : (
                            <div className="space-y-3">
                                {aiInsights.alerts.filter(a => a.recommended_actions).slice(0, 3).map((alert, idx) => (
                                    <motion.div
                                        key={alert.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                    >
                                        <PremiumCard className="p-4 border-l-4 border-l-primary hover:bg-accent/30 transition-colors cursor-pointer group">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{t('action_required')}</span>
                                                <span className="text-xs text-muted-foreground">• {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{alert.title}</h3>
                                            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                                                {typeof alert.recommended_actions === 'string' ? alert.recommended_actions : "Analise o comportamento do grupo para manter o engajamento estável."}
                                            </p>
                                        </PremiumCard>
                                    </motion.div>
                                ))}

                                {aiInsights.summaries.slice(0, 2).map((summary, idx) => (
                                    <motion.div
                                        key={summary.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: (idx + 3) * 0.1 }}
                                    >
                                        <PremiumCard
                                            className="p-4 bg-muted/40 border-none shadow-none hover:bg-muted/60 transition-colors cursor-pointer"
                                            onClick={() => setSelectedSummary(summary)}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Resumo IA</span>
                                                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                            </div>
                                            <p className="text-xs text-foreground leading-relaxed line-clamp-3 italic">
                                                "{summary.summary_text}"
                                            </p>
                                        </PremiumCard>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Quick Stats / Mini Alerts */}
                    <PremiumCard className="p-0 overflow-hidden">
                        <div className="p-4 border-b border-border bg-muted/30">
                            <h3 className="text-sm font-bold">Resumo de Atividade</h3>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">{t('most_active_members')}</span>
                                <span className="text-xs font-bold text-primary">Ver todos</span>
                            </div>
                            <div className="space-y-3">
                                {topMembers.length === 0 ? (
                                    <p className="text-[10px] text-muted-foreground italic text-center py-4">{t('no_members')}</p>
                                ) : (
                                    topMembers.map((member, idx) => (
                                        <div key={member.author_hash} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0 text-[11px]">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-foreground">{member.name}</span>
                                                <span className="text-[10px] text-muted-foreground">{member.actions} {t('actions_count', { count: member.actions })}</span>
                                            </div>
                                            <span className={cn(
                                                "px-2 py-0.5 rounded-full font-bold text-[9px] uppercase",
                                                member.impact === 'High' ? "bg-green-500/10 text-green-600" :
                                                    member.impact === 'Medium' ? "bg-blue-500/10 text-blue-600" :
                                                        "bg-muted text-muted-foreground"
                                            )}>
                                                {member.impact === 'High' ? t('high_impact') :
                                                    member.impact === 'Medium' ? t('medium_impact') :
                                                        t('low_impact')}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </PremiumCard>
                </div>
            </div>

            {selectedSummary && (
                <SummaryDetailModal
                    summary={selectedSummary}
                    onClose={() => setSelectedSummary(null)}
                />
            )}
        </div>
    );
}

