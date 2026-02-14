"use client";

import { useOrganization } from "@/hooks/use-organization";
import { createClient } from "@/lib/supabase/client";
import { CreditCard, ExternalLink, FileText, Loader2, Zap, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Invoice {
    id: string;
    number: string;
    amount_paid: number;
    currency: string;
    status: string;
    created: number;
    hosted_invoice_url: string;
}

export default function BillingPage() {
    const { organization, loading: orgLoading } = useOrganization();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loadingInvoices, setLoadingInvoices] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        async function fetchInvoices() {
            if (!organization?.id) return;
            try {
                setLoadingInvoices(true);
                const { data, error } = await supabase.functions.invoke("list-invoices", {
                    body: { organization_id: organization.id }
                });
                if (error) throw error;
                setInvoices(data?.data || []);
            } catch (err) {
                console.error("[Billing] Error fetching invoices:", err);
            } finally {
                setLoadingInvoices(false);
            }
        }

        if (organization) {
            fetchInvoices();
        }
    }, [organization]);

    const handlePortalRedirect = async () => {
        try {
            setActionLoading(true);
            const { data, error } = await supabase.functions.invoke("customer-portal", {
                body: { organization_id: organization?.id }
            });
            if (error) throw error;
            if (data?.url) {
                window.location.href = data.url;
            }
        } catch (err) {
            console.error("[Billing] Error redirecting to portal:", err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpgrade = async () => {
        try {
            setActionLoading(true);
            const { data, error } = await supabase.functions.invoke("create-checkout", {
                body: { organization_id: organization?.id, plan: "pro" }
            });
            if (error) throw error;
            if (data?.url) {
                window.location.href = data.url;
            }
        } catch (err) {
            console.error("[Billing] Error creating checkout:", err);
        } finally {
            setActionLoading(false);
        }
    };

    if (orgLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
            </div>
        );
    }

    const isPro = organization?.plan_type === "pro";
    const statusActive = organization?.subscription_status === "active";

    return (
        <div className="space-y-10 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-extrabold text-white tracking-tight">Faturamento</h1>
                    <p className="text-secondary-gray-500 font-medium">Gerencie sua assinatura e visualize seu histórico de pagamentos.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Current Plan Card */}
                <PremiumCard className="p-8 md:p-10 space-y-8 relative overflow-hidden group">
                    {/* Animated background highlights */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-500/10 blur-[80px] rounded-full group-hover:bg-brand-500/20 transition-all duration-700" />

                    <div className="flex items-center justify-between">
                        <div className="w-16 h-16 bg-brand-500/10 rounded-3xl flex items-center justify-center text-brand-500 border border-brand-500/20 shadow-inner">
                            <Zap className="h-8 w-8" />
                        </div>
                        <div className={cn(
                            "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm",
                            statusActive ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-secondary-gray-700/10 text-secondary-gray-600 border-white/5"
                        )}>
                            {statusActive ? "Assinatura Ativa" : "Inativo / Trial"}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <p className="text-[10px] font-black text-secondary-gray-500 uppercase tracking-widest">Plano em vigor</p>
                        <h2 className="text-5xl font-black text-white tracking-tight capitalize">
                            {organization?.plan_type || "Free Trial"}
                        </h2>
                    </div>

                    <div className="pt-8 border-t border-white/5 space-y-4">
                        {isPro ? (
                            <button
                                onClick={handlePortalRedirect}
                                disabled={actionLoading}
                                className="w-full flex items-center justify-center gap-3 bg-navy-900 border border-white/10 hover:border-white/20 text-white font-bold py-4.5 px-6 rounded-2xl transition-all disabled:opacity-50 shadow-inner active:scale-[0.98]"
                            >
                                {actionLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ExternalLink className="h-5 w-5" />}
                                Portal de Faturamento
                            </button>
                        ) : (
                            <button
                                onClick={handleUpgrade}
                                disabled={actionLoading}
                                className="w-full flex items-center justify-center gap-3 bg-brand-500 hover:bg-brand-600 text-white font-black py-4.5 px-6 rounded-2xl transition-all shadow-lg shadow-brand-500/30 disabled:opacity-50 active:scale-[0.98]"
                            >
                                {actionLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <CreditCard className="h-5 w-5" />}
                                UPGRADE PARA PRO
                            </button>
                        )}
                    </div>
                </PremiumCard>

                {/* Security / Info Card */}
                <PremiumCard className="p-8 md:p-10 flex flex-col justify-center space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-navy-900 rounded-2xl flex items-center justify-center text-secondary-gray-500 shadow-inner">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-bold text-white">Pagamento Seguro</h3>
                    </div>
                    <p className="text-secondary-gray-500 font-medium leading-relaxed">
                        Todas as transações são criptografadas e processadas através do <span className="text-white font-black">Stripe</span>.
                        Não armazenamos dados sensíveis do seu cartão em nossos servidores.
                    </p>
                    <div className="flex flex-wrap gap-4 items-center">
                        <span className="px-3 py-1 bg-navy-900 rounded-lg text-[9px] font-black text-secondary-gray-600 uppercase tracking-widest border border-white/5">Auto-Renewal</span>
                        <span className="px-3 py-1 bg-navy-900 rounded-lg text-[9px] font-black text-secondary-gray-600 uppercase tracking-widest border border-white/5">Cancel Any Time</span>
                        <span className="px-3 py-1 bg-navy-900 rounded-lg text-[9px] font-black text-secondary-gray-600 uppercase tracking-widest border border-white/5">Stripe Secure</span>
                    </div>
                </PremiumCard>
            </div>

            {/* Invoices Table */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 px-2">
                    <FileText className="h-5 w-5 text-brand-500" />
                    <h3 className="text-xl font-extrabold text-white tracking-tight leading-none">Histórico de Faturas</h3>
                </div>

                <div className="overflow-x-auto pb-4 px-1">
                    {loadingInvoices ? (
                        <div className="py-32 flex flex-col items-center justify-center gap-4">
                            <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
                            <p className="text-[10px] font-black uppercase text-secondary-gray-500 tracking-widest">Sincronizando com Stripe...</p>
                        </div>
                    ) : invoices.length > 0 ? (
                        <table className="w-full text-left border-separate border-spacing-y-4">
                            <thead>
                                <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary-gray-600">
                                    <th className="px-8 pb-2">Identificador</th>
                                    <th className="px-8 pb-2">Data</th>
                                    <th className="px-8 pb-2">Valor Total</th>
                                    <th className="px-8 pb-2">Estado</th>
                                    <th className="px-8 pb-2 text-right">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="space-y-4">
                                <AnimatePresence>
                                    {invoices.map((inv, idx) => (
                                        <motion.tr
                                            key={inv.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="group bg-navy-800/40 border-y border-white/5 hover:bg-navy-800/80 transition-all premium-shadow"
                                        >
                                            <td className="px-8 py-5 rounded-l-premium border-y border-l border-white/5">
                                                <span className="text-sm font-bold text-white">{inv.number}</span>
                                            </td>
                                            <td className="px-8 py-5 border-y border-white/5">
                                                <span className="text-sm font-medium text-secondary-gray-500 italic">
                                                    {new Date(inv.created * 1000).toLocaleDateString("pt-BR")}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 border-y border-white/5">
                                                <span className="text-sm font-black text-white">
                                                    {(inv.amount_paid / 100).toLocaleString("pt-BR", { style: "currency", currency: inv.currency })}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 border-y border-white/5">
                                                <span className={cn(
                                                    "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                                    inv.status === "paid" ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-secondary-gray-700/10 text-secondary-gray-600 border-white/5"
                                                )}>
                                                    {inv.status === "paid" ? "Liquidado" : inv.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 rounded-r-premium border-y border-r border-white/5 text-right">
                                                <a
                                                    href={inv.hosted_invoice_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-navy-900 border border-white/10 rounded-xl text-brand-500 hover:text-white hover:bg-brand-500 hover:border-brand-500 transition-all font-bold text-xs shadow-inner"
                                                >
                                                    Recibo
                                                    <ExternalLink className="h-3 w-3" />
                                                </a>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    ) : (
                        <div className="py-32 text-center bg-navy-800/30 rounded-premium border border-white/5 border-dashed">
                            <p className="text-secondary-gray-600 font-bold">Nenhuma fatura encontrada até o momento.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
