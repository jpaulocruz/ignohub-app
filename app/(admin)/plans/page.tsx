import { PremiumCard } from "@/components/ui/PremiumCard";
import { getPlans, getSubscriptionAlerts } from "./actions";
import { PlanForm } from "@/components/admin/PlanForm";
import {
    CreditCard,
    Settings2,
    AlertCircle,
    Clock,
    ExternalLink,
    Search
} from "lucide-react";
import { cn } from "@/lib/utils";

export default async function PlanConfigurationPage() {
    const plans = await getPlans();
    const alerts = await getSubscriptionAlerts();

    return (
        <div className="space-y-12 pb-20">
            <header className="space-y-2">
                <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-brand-500/10 text-brand-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-brand-500/20">
                        Billing & rules
                    </span>
                </div>
                <h1 className="text-5xl font-black text-white tracking-tighter leading-none">Configuração de Planos</h1>
                <p className="text-secondary-gray-500 font-medium text-lg">
                    Gerencie os limites de uso, retenção e preços integrados ao Stripe.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                {/* Plans Management */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-500 border border-brand-500/20">
                            <Settings2 className="h-4 w-4" />
                        </div>
                        <h2 className="text-2xl font-black text-white tracking-tight">Regras de Negócio</h2>
                    </div>

                    <div className="grid grid-cols-1 gap-8">
                        {plans.map((plan) => (
                            <PremiumCard key={plan.id} className="p-8 border-l-4 border-l-brand-500">
                                <PlanForm plan={plan} />
                            </PremiumCard>
                        ))}
                    </div>
                </div>

                {/* Subscription Alerts / Delinquency */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20">
                            <AlertCircle className="h-4 w-4" />
                        </div>
                        <h2 className="text-2xl font-black text-white tracking-tight">Suporte Proativo</h2>
                    </div>

                    <PremiumCard className="p-6 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Clock className="h-12 w-12 text-white" />
                        </div>
                        <h3 className="text-sm font-black text-white mb-6 flex items-center gap-2">
                            Assinaturas Problemáticas
                            <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{alerts.length}</span>
                        </h3>

                        <div className="space-y-4">
                            {alerts.length === 0 ? (
                                <p className="text-center py-10 text-secondary-gray-500 text-sm font-bold uppercase tracking-widest">
                                    Nenhuma pendência encontrada
                                </p>
                            ) : (
                                alerts.map((alert) => (
                                    <div key={alert.id} className="p-4 bg-navy-950 border border-white/5 rounded-2xl hover:border-red-500/50 transition-all group">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="text-white font-black group-hover:text-red-500 transition-colors line-clamp-1">{alert.name}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={cn(
                                                        "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded",
                                                        alert.subscription_status === 'active' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                                                    )}>
                                                        {alert.subscription_status}
                                                    </span>
                                                    <span className="text-[9px] font-bold text-secondary-gray-500 uppercase tracking-tighter">
                                                        {alert.plan_type}
                                                    </span>
                                                </div>
                                            </div>
                                            <a
                                                href={`/admin/organizations/${alert.id}`}
                                                className="p-2 bg-white/5 rounded-lg hover:bg-white/10 text-secondary-gray-400"
                                            >
                                                <Search className="h-4 w-4" />
                                            </a>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <button className="w-full mt-8 py-3 bg-navy-800 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-navy-700 transition-all border border-white/5 flex items-center justify-center gap-2">
                            Ver Dashboard Completo
                            <ExternalLink className="h-3 w-3" />
                        </button>
                    </PremiumCard>

                    <PremiumCard className="p-6 bg-gradient-to-br from-brand-500 to-indigo-600 border-none shadow-2xl shadow-brand-500/20">
                        <div className="space-y-4">
                            <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                                <CreditCard className="h-5 w-5 text-white" />
                            </div>
                            <h4 className="text-lg font-black text-white leading-tight">Painel Stripe Avançado</h4>
                            <p className="text-white/80 text-xs font-medium leading-relaxed">
                                Acesse o dashboard do Stripe para gerenciar reembolsos, cupons e métricas financeiras detalhadas.
                            </p>
                            <button className="w-full bg-white text-brand-600 rounded-xl py-3 text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all">
                                Abrir Stripe Business
                            </button>
                        </div>
                    </PremiumCard>
                </div>
            </div>
        </div>
    );
}
