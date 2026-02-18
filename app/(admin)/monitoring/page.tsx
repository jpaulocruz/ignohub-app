import { PremiumCard } from "@/components/ui/PremiumCard";
import { getUsageMetrics, getPlanComparisonData } from "./actions";
import { UsageChart } from "@/components/admin/UsageChart";
import {
    BarChart3,
    Activity,
    Users,
    AlertTriangle,
    Zap,
    LayoutGrid
} from "lucide-react";
import { cn } from "@/lib/utils";

export default async function UsageMonitorPage() {
    const usageMetrics = await getUsageMetrics();
    const comparisonData = await getPlanComparisonData();

    // Define limits (approximate for display)
    const PLAN_LIMITS: Record<string, number> = {
        starter: 5000,
        business: 25000,
        enterprise: 100000
    };

    return (
        <div className="space-y-12 pb-20">
            <header className="space-y-2">
                <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-brand-500/10 text-brand-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-brand-500/20">
                        Admin Intelligence
                    </span>
                </div>
                <h1 className="text-5xl font-black text-white tracking-tighter leading-none">Usage Monitor</h1>
                <p className="text-secondary-gray-500 font-medium text-lg">
                    Monitoramento em tempo real de consumo de tokens e mensagens por organização.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Stats Chart */}
                <div className="lg:col-span-8">
                    <PremiumCard className="p-8 h-full">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-brand-500/10 rounded-lg">
                                    <BarChart3 className="h-5 w-5 text-brand-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white">Consumo por Plano</h3>
                                    <p className="text-xs text-secondary-gray-500 font-bold uppercase tracking-wider">Total de mensagens enviadas</p>
                                </div>
                            </div>
                        </div>
                        <UsageChart data={comparisonData} />
                    </PremiumCard>
                </div>

                {/* Right Column - Summary Cards */}
                <div className="lg:col-span-4 space-y-6">
                    <PremiumCard className="p-6 bg-navy-950 border-brand-500/20">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-brand-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
                                <Activity className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-secondary-gray-500 uppercase tracking-widest leading-none mb-1">Total de Batches</p>
                                <p className="text-2xl font-black text-white leading-none">1.2k</p>
                            </div>
                        </div>
                    </PremiumCard>

                    <PremiumCard className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                                <Users className="h-6 w-6 text-green-500" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-secondary-gray-500 uppercase tracking-widest leading-none mb-1">Organizações Ativas</p>
                                <p className="text-2xl font-black text-white leading-none">{usageMetrics.length}</p>
                            </div>
                        </div>
                    </PremiumCard>

                    <PremiumCard className="p-6 bg-gradient-to-br from-navy-900 to-navy-950 border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                                <Zap className="h-6 w-6 text-orange-500" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-secondary-gray-500 uppercase tracking-widest leading-none mb-1">Tokens Processados</p>
                                <p className="text-2xl font-black text-white leading-none">
                                    {(usageMetrics.reduce((acc, curr) => acc + curr.totalTokens, 0) / 1000).toFixed(1)}k
                                </p>
                            </div>
                        </div>
                    </PremiumCard>
                </div>

                {/* Main Usage Table */}
                <div className="lg:col-span-12">
                    <PremiumCard className="overflow-hidden">
                        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                            <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                                <LayoutGrid className="h-5 w-5 text-brand-500" />
                                Lista de Organizações
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-navy-950/50">
                                    <tr>
                                        <th className="px-8 py-5 text-[10px] font-black text-secondary-gray-500 uppercase tracking-widest">Organização</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-secondary-gray-500 uppercase tracking-widest">Plano</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-secondary-gray-500 uppercase tracking-widest">Mensagens</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-secondary-gray-500 uppercase tracking-widest">Tokens AI</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-secondary-gray-500 uppercase tracking-widest">Uso vs Limite</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-secondary-gray-500 uppercase tracking-widest">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {usageMetrics.map((org) => {
                                        const limit = PLAN_LIMITS[org.plan_type] || 5000;
                                        const usagePercent = Math.min((org.totalMessages / limit) * 100, 100);
                                        const isNearLimit = usagePercent > 80;

                                        return (
                                            <tr key={org.id} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="px-8 py-6">
                                                    <p className="font-black text-white group-hover:text-brand-500 transition-colors">{org.name}</p>
                                                    <p className="text-[10px] text-secondary-gray-500 font-bold uppercase tracking-tighter">ID: {org.id.slice(0, 8)}</p>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className={cn(
                                                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                                        org.plan_type === 'starter' ? "bg-secondary-gray-500/10 text-secondary-gray-500 border-secondary-gray-500/20" :
                                                            org.plan_type === 'business' ? "bg-brand-500/10 text-brand-500 border-brand-500/20" :
                                                                "bg-purple-500/10 text-purple-500 border-purple-500/20"
                                                    )}>
                                                        {org.plan_type}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 font-black text-white">{org.totalMessages.toLocaleString()}</td>
                                                <td className="px-8 py-6 font-bold text-secondary-gray-400">{org.totalTokens.toLocaleString()}</td>
                                                <td className="px-8 py-6">
                                                    <div className="w-32">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-[10px] font-black text-secondary-gray-500 tracking-widest">{usagePercent.toFixed(0)}%</span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-navy-950 rounded-full overflow-hidden">
                                                            <div
                                                                className={cn(
                                                                    "h-full transition-all duration-1000",
                                                                    usagePercent > 90 ? "bg-red-500" : usagePercent > 70 ? "bg-orange-500" : "bg-brand-500"
                                                                )}
                                                                style={{ width: `${usagePercent}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    {isNearLimit ? (
                                                        <div className="flex items-center gap-2 text-red-500 animate-pulse">
                                                            <AlertTriangle className="h-4 w-4" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest">Alerta de Limite</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 text-green-500">
                                                            <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest">Saudável</span>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </PremiumCard>
                </div>
            </div>
        </div>
    );
}
