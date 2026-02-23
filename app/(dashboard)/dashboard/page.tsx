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
    BarChart3,
    ArrowRight
} from "lucide-react";
import Link from "next/link";
import { SummaryDetailModal } from "@/components/dashboard/summary-detail-modal";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

import type { Database } from "@/types/database.types";

type Analytics = Database['public']['Tables']['group_analytics']['Row'];
type Alert = Database['public']['Tables']['alerts']['Row'];
type Summary = Database['public']['Tables']['summaries']['Row'];
type MemberInsight = Database['public']['Tables']['member_insights']['Row'];

export default function DashboardPage() {
    const { organization, loading: orgLoading } = useOrganization();
    const t = useTranslations("dashboard");
    const [analytics, setAnalytics] = useState<Analytics[]>([]);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [summaries, setSummaries] = useState<Summary[]>([]);
    const [memberInsights, setMemberInsights] = useState<MemberInsight[]>([]);
    const [messageVolume, setMessageVolume] = useState(0);
    const [loading, setLoading] = useState(true);
    const [selectedSummary, setSelectedSummary] = useState<Summary | null>(null);

    const supabase = createClient();

    useEffect(() => {
        if (!organization) return;

        async function fetchData() {
            try {
                setLoading(true);

                // Execute all queries in parallel
                const [
                    { data: analyticsData },
                    { data: alertsData },
                    { data: summariesData },
                    { data: insightsData },
                    { data: volumeData }
                ] = await Promise.all([
                    // Fetch Analytics for Chart
                    supabase
                        .from("group_analytics")
                        .select("*")
                        .eq("organization_id", organization!.id)
                        .order("period_start", { ascending: true }),

                    // Fetch Active Alerts
                    supabase
                        .from("alerts")
                        .select("*")
                        .eq("organization_id", organization!.id)
                        .eq("status", "open"),

                    // Fetch Recent Summaries
                    supabase
                        .from("summaries")
                        .select("*")
                        .eq("organization_id", organization!.id)
                        .order("created_at", { ascending: false })
                        .limit(3),

                    // Fetch Member Insights
                    supabase
                        .from("member_insights")
                        .select("*")
                        .eq("organization_id", organization!.id)
                        .order("created_at", { ascending: false })
                        .limit(5),

                    // Fetch Message Volume
                    supabase
                        .from("message_batches")
                        .select("message_count")
                        .eq("organization_id", organization!.id)
                        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
                ]);

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
            {/* Page header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {t('subtitle')}
                    </p>
                </div>
                <Link
                    href="/groups"
                    className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium px-4 py-2 hover:bg-primary/90 transition-colors"
                >
                    <Users className="h-4 w-4" />
                    {t('view_communities')}
                </Link>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <PremiumCard className="p-6">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-sm text-muted-foreground">{t('sentiment_score')}</p>
                        <Smile className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-3xl font-semibold text-foreground">{avgSentiment}%</p>
                    <span className={cn(
                        "inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-medium",
                        avgSentiment > 70
                            ? "bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400"
                            : "bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400"
                    )}>
                        {avgSentiment > 70 ? "Healthy" : t('needs_attention')}
                    </span>
                </PremiumCard>

                <PremiumCard className="p-6">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-sm text-muted-foreground">{t('active_alerts')}</p>
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-3xl font-semibold text-foreground">{alerts.length}</p>
                    <span className={cn(
                        "inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-medium",
                        alerts.length > 0
                            ? "bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400"
                            : "bg-muted text-muted-foreground"
                    )}>
                        {alerts.length > 0 ? "Requires review" : t('all_clear')}
                    </span>
                </PremiumCard>

                <PremiumCard className="p-6">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-sm text-muted-foreground">{t('messages_24h')}</p>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-3xl font-semibold text-foreground">
                        {messageVolume > 999 ? `${(messageVolume / 1000).toFixed(1)}K` : messageVolume}
                    </p>
                    <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-medium bg-muted text-muted-foreground">
                        {t('processed')}
                    </span>
                </PremiumCard>
            </div>

            {/* Main grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart + summaries */}
                <div className="lg:col-span-2 space-y-6">
                    <PremiumCard className="p-6">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h2 className="text-sm font-semibold text-foreground">{t('sentiment_trend')}</h2>
                                <p className="text-xs text-muted-foreground mt-0.5">{t('community_health')}</p>
                            </div>
                            <div className="flex gap-1">
                                <button className="px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">Historical</button>
                                <button className="px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground">Real-time</button>
                            </div>
                        </div>
                        <div className="h-[260px] w-full">
                            <SentimentChart data={chartData} />
                        </div>
                    </PremiumCard>

                    {/* Summaries */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-semibold text-foreground">AI summaries</h2>
                            <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                                View all <ArrowRight className="h-3 w-3" />
                            </button>
                        </div>
                        {summaries.length === 0 ? (
                            <PremiumCard className="p-12 text-center">
                                <p className="text-sm text-muted-foreground">No summaries yet.</p>
                                <p className="text-xs text-muted-foreground mt-1">Summaries will appear once your communities have activity.</p>
                            </PremiumCard>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {summaries.map((s) => (
                                    <PremiumCard
                                        key={s.id}
                                        className="p-4 cursor-pointer hover:shadow-md transition-shadow group"
                                        onClick={() => setSelectedSummary(s)}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[11px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">AI insight</span>
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-sm text-foreground leading-relaxed line-clamp-2">{s.summary_text}</p>
                                        <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground group-hover:text-primary transition-colors">
                                            Read more <ChevronRight className="h-3 w-3" />
                                        </div>
                                    </PremiumCard>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right column */}
                <div className="space-y-6">
                    {/* Member insights */}
                    <PremiumCard>
                        <div className="px-5 py-4 border-b border-border">
                            <h2 className="text-sm font-semibold text-foreground">Top members</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">Active participation insights</p>
                        </div>
                        {memberInsights.length === 0 ? (
                            <div className="p-8 text-center">
                                <p className="text-sm text-muted-foreground">No member data yet.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {memberInsights.map((member) => (
                                    <div key={member.id} className="px-5 py-4 hover:bg-accent/50 transition-colors">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-xs font-mono text-primary">#{member.author_hash.slice(0, 8)}</span>
                                            <span className={cn(
                                                "text-[11px] font-medium px-2 py-0.5 rounded-full",
                                                member.role === "influencer"
                                                    ? "bg-primary/10 text-primary"
                                                    : "bg-muted text-muted-foreground"
                                            )}>
                                                {member.role || "Member"}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{member.insight_text}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </PremiumCard>

                    {/* Alerts */}
                    {alerts.length > 0 && (
                        <PremiumCard>
                            <div className="px-5 py-4 border-b border-border">
                                <h2 className="text-sm font-semibold text-foreground">Alerts</h2>
                                <p className="text-xs text-muted-foreground mt-0.5">Items requiring attention</p>
                            </div>
                            <div className="divide-y divide-border">
                                {alerts.map(a => (
                                    <div key={a.id} className="px-5 py-4 hover:bg-accent/50 transition-colors cursor-pointer">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 capitalize">
                                                {a.severity}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-sm font-medium text-foreground leading-relaxed">{a.title}</p>
                                    </div>
                                ))}
                            </div>
                        </PremiumCard>
                    )}
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

