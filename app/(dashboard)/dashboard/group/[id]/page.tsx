"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
    MessageSquareText,
    ChevronLeft,
    Zap,
    Users,
    Activity,
    TrendingUp,
    MessageSquare,
    Send,
    FileText
} from "lucide-react";
import Link from "next/link";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
                const { data: groupData } = await supabase.from("groups").select("*, agent_presets (name)").eq("id", groupId).single();
                const { data: summariesData } = await supabase.from("summaries").select("*").eq("group_id", groupId).order("created_at", { ascending: false });
                const { data: insightsData } = await supabase.from("member_insights").select("*").eq("group_id", groupId).order("created_at", { ascending: false });
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
            <div className="space-y-6 animate-pulse pb-12">
                <div className="h-4 w-24 bg-muted rounded" />
                <div className="h-8 w-2/3 bg-muted rounded-lg" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted rounded-xl" />)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 h-80 bg-muted rounded-xl" />
                    <div className="h-80 bg-muted rounded-xl" />
                </div>
            </div>
        );
    }

    const isWhatsApp = group?.platform === "whatsapp";

    return (
        <div className="space-y-6 pb-12">
            <header className="space-y-4">
                <Button variant="ghost" size="sm" asChild className="gap-1.5 -ml-2 text-muted-foreground hover:text-foreground">
                    <Link href="/dashboard">
                        <ChevronLeft className="h-4 w-4" /> Back to dashboard
                    </Link>
                </Button>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "w-9 h-9 rounded-lg flex items-center justify-center",
                            isWhatsApp ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" : "bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400"
                        )}>
                            {isWhatsApp ? <MessageSquare className="h-4.5 w-4.5" /> : <Send className="h-4.5 w-4.5" />}
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold text-foreground">{group?.name}</h1>
                            <p className="text-xs text-muted-foreground capitalize">
                                {group?.platform} · {group?.agent_presets?.name || "Standard agent"}
                            </p>
                        </div>
                    </div>
                    <Badge variant="secondary" className="gap-1.5 w-fit">
                        <Activity className="h-3 w-3 text-primary animate-pulse" />
                        Monitoring
                    </Badge>
                </div>
            </header>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <PremiumCard className="p-5">
                    <p className="text-xs text-muted-foreground mb-1">Agent preset</p>
                    <p className="text-lg font-semibold text-foreground">{group?.agent_presets?.name || "Standard"}</p>
                </PremiumCard>
                <PremiumCard className="p-5">
                    <p className="text-xs text-muted-foreground mb-1">Total insights</p>
                    <p className="text-lg font-semibold text-foreground">{insights.length}</p>
                </PremiumCard>
                <PremiumCard className="p-5">
                    <p className="text-xs text-muted-foreground mb-1">Alerts (7d)</p>
                    <p className="text-lg font-semibold text-foreground">—</p>
                </PremiumCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Summaries timeline */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center gap-2">
                        <MessageSquareText className="h-4 w-4 text-muted-foreground" />
                        <h2 className="text-sm font-semibold text-foreground">Intelligence timeline</h2>
                    </div>

                    {summaries.length === 0 ? (
                        <PremiumCard className="py-16 text-center">
                            <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                            <p className="text-sm text-muted-foreground">No summaries generated yet.</p>
                        </PremiumCard>
                    ) : (
                        <div className="space-y-3">
                            {summaries.map((s, idx) => (
                                <motion.div key={s.id} initial={{ opacity: 0, x: -6 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.04 }}>
                                    <PremiumCard className="overflow-hidden">
                                        <div className="px-5 py-3 border-b border-border flex items-center justify-between bg-muted/30">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                                                    <Zap className="h-3.5 w-3.5" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground leading-none mb-0.5">Periodic summary</p>
                                                    <p className="text-xs font-medium text-foreground">
                                                        {new Date(s.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-xs font-mono text-muted-foreground">
                                                {new Date(s.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                                            </span>
                                        </div>
                                        <div className="p-5">
                                            <p className="text-sm text-muted-foreground leading-relaxed">{s.summary_text}</p>
                                        </div>
                                    </PremiumCard>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <aside className="space-y-5">
                    {/* Member insights */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <h2 className="text-sm font-semibold text-foreground">Key profiles</h2>
                        </div>

                        {insights.length === 0 ? (
                            <PremiumCard className="py-10 text-center">
                                <p className="text-sm text-muted-foreground">No insights yet.</p>
                            </PremiumCard>
                        ) : (
                            <div className="space-y-3">
                                {insights.map((i, idx) => (
                                    <motion.div key={i.id} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: idx * 0.04 }}>
                                        <PremiumCard className="p-4 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-xs font-semibold text-foreground uppercase">
                                                        {i.role?.substring(0, 2)}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground leading-none mb-0.5">Role</p>
                                                        <p className="text-xs font-medium text-foreground capitalize">{i.role}</p>
                                                    </div>
                                                </div>
                                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                            <blockquote className="text-xs text-muted-foreground italic leading-relaxed pl-3 border-l-2 border-muted">
                                                "{i.insight_text}"
                                            </blockquote>
                                            <p className="text-[10px] text-muted-foreground text-right">
                                                {new Date(i.created_at).toLocaleDateString()}
                                            </p>
                                        </PremiumCard>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Community health */}
                    <PremiumCard className="p-5 space-y-4">
                        <div>
                            <p className="text-xs text-muted-foreground">Community health</p>
                            <h3 className="text-sm font-semibold text-foreground mt-0.5">Status overview</h3>
                        </div>
                        <div className="space-y-3">
                            {[
                                { label: "Engagement", value: 88, color: "bg-primary" },
                                { label: "Security", value: 100, color: "bg-green-500" },
                            ].map(({ label, value, color }) => (
                                <div key={label} className="space-y-1.5">
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>{label}</span>
                                        <span className="text-foreground font-medium">{value}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                        <div className={cn("h-full rounded-full", color)} style={{ width: `${value}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Button variant="ghost" size="sm" asChild className="w-full text-xs text-muted-foreground justify-center">
                            <Link href="/groups">Manage connections →</Link>
                        </Button>
                    </PremiumCard>
                </aside>
            </div>
        </div>
    );
}
