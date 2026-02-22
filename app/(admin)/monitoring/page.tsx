"use client";

import { useEffect, useState } from "react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { getUsageMetrics, getPlanComparisonData } from "./actions";
import dynamic from "next/dynamic";

const UsageChart = dynamic(() => import("@/components/admin/UsageChart").then(mod => mod.UsageChart), {
    ssr: false,
    loading: () => <div className="h-[300px] w-full mt-4 bg-muted/20 animate-pulse rounded-lg" />
});
import {
    BarChart3,
    Activity,
    Users,
    AlertTriangle,
    Zap,
    LayoutGrid,
    CheckCircle2,
    FileText,
    Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface UsageMetric {
    id: string;
    name: string;
    plan_type: string;
    totalMessages: number;
    totalTokens: number;
}

interface ComparisonDatum {
    name: string;
    value: number;
}

export default function UsageMonitorPage() {
    const [usageMetrics, setUsageMetrics] = useState<UsageMetric[]>([]);
    const [comparisonData, setComparisonData] = useState<ComparisonDatum[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const [metrics, comparison] = await Promise.all([
                    getUsageMetrics(),
                    getPlanComparisonData(),
                ]);
                setUsageMetrics(metrics);
                setComparisonData(comparison);
            } catch (err) {
                console.error("[Monitoring] Error fetching data:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const PLAN_LIMITS: Record<string, number> = {
        starter: 5000,
        business: 25000,
        enterprise: 100000
    };

    const totalTokens = usageMetrics.reduce((acc, curr) => acc + curr.totalTokens, 0);

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-12">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Usage Monitor</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Real-time ingestion monitoring and AI token consumption across organizations.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Chart */}
                <div className="lg:col-span-8">
                    <PremiumCard className="overflow-hidden">
                        <div className="px-5 py-4 border-b border-border flex items-center gap-3">
                            <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                <BarChart3 className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-foreground">Consumption profile</h3>
                                <Badge variant="secondary" className="text-[10px] mt-0.5">Live</Badge>
                            </div>
                        </div>
                        <div className="p-5">
                            <UsageChart data={comparisonData} />
                        </div>
                    </PremiumCard>
                </div>

                {/* Stats */}
                <div className="lg:col-span-4 space-y-4">
                    {[
                        { label: "Total batches", value: "1.2K", icon: Activity, color: "text-primary", bg: "bg-primary/10" },
                        { label: "Active organizations", value: String(usageMetrics.length), icon: Users, color: "text-green-600 dark:text-green-400", bg: "bg-green-100 dark:bg-green-900/30" },
                        { label: "Tokens processed", value: `${(totalTokens / 1000).toFixed(1)}K`, icon: Zap, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-900/30" },
                    ].map(({ label, value, icon: Icon, color, bg }) => (
                        <PremiumCard key={label} className="p-4 flex items-center gap-4">
                            <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", bg)}>
                                <Icon className={cn("h-5 w-5", color)} />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">{label}</p>
                                <p className="text-xl font-semibold text-foreground leading-tight">{value}</p>
                            </div>
                        </PremiumCard>
                    ))}
                </div>

                {/* Table */}
                <div className="lg:col-span-12">
                    <PremiumCard className="overflow-hidden">
                        <div className="px-5 py-4 border-b border-border flex items-center gap-3">
                            <div className="h-8 w-8 bg-muted rounded-lg flex items-center justify-center">
                                <LayoutGrid className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <h3 className="text-sm font-semibold text-foreground">Organization registry</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border bg-muted/40">
                                        <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Organization</th>
                                        <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Plan</th>
                                        <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Messages</th>
                                        <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">AI tokens</th>
                                        <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Quota usage</th>
                                        <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {usageMetrics.map((org) => {
                                        const limit = PLAN_LIMITS[org.plan_type] || 5000;
                                        const usagePercent = Math.min((org.totalMessages / limit) * 100, 100);
                                        const isNearLimit = usagePercent > 80;

                                        return (
                                            <tr key={org.id} className="hover:bg-accent/40 transition-colors">
                                                <td className="px-5 py-4">
                                                    <p className="font-medium text-foreground text-sm">{org.name}</p>
                                                    <p className="text-xs text-muted-foreground font-mono mt-0.5">{org.id.slice(0, 8)}</p>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <Badge
                                                        variant={org.plan_type === 'enterprise' ? 'default' : org.plan_type === 'business' ? 'secondary' : 'outline'}
                                                        className="text-xs capitalize"
                                                    >
                                                        {org.plan_type}
                                                    </Badge>
                                                </td>
                                                <td className="px-5 py-4 font-medium text-foreground">{org.totalMessages.toLocaleString()}</td>
                                                <td className="px-5 py-4 text-muted-foreground">{org.totalTokens.toLocaleString()}</td>
                                                <td className="px-5 py-4">
                                                    <div className="w-32 space-y-1.5">
                                                        <div className="flex justify-between text-xs text-muted-foreground">
                                                            <span>{usagePercent.toFixed(0)}%</span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                                            <div
                                                                className={cn(
                                                                    "h-full rounded-full transition-all",
                                                                    usagePercent > 90 ? "bg-destructive" : usagePercent > 70 ? "bg-amber-500" : "bg-primary"
                                                                )}
                                                                style={{ width: `${usagePercent}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    {isNearLimit ? (
                                                        <Badge variant="destructive" className="gap-1 text-xs">
                                                            <AlertTriangle className="h-3 w-3" /> Near limit
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary" className="gap-1 text-xs text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30">
                                                            <CheckCircle2 className="h-3 w-3" /> Healthy
                                                        </Badge>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {usageMetrics.length === 0 && (
                                <div className="py-16 text-center">
                                    <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                                    <p className="text-sm text-muted-foreground">No usage data yet.</p>
                                </div>
                            )}
                        </div>
                    </PremiumCard>
                </div>
            </div>
        </div>
    );
}
