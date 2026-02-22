"use client";

import { useOrganization } from "@/hooks/use-organization";
import { createClient } from "@/lib/supabase/client";
import { CreditCard, ExternalLink, FileText, Loader2, Zap, CheckCircle2, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
        if (organization) fetchInvoices();
    }, [organization]);

    const handlePortalRedirect = async () => {
        try {
            setActionLoading(true);
            const { data, error } = await supabase.functions.invoke("customer-portal", {
                body: { organization_id: organization?.id }
            });
            if (error) throw error;
            if (data?.url) window.location.href = data.url;
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
                body: { plan: "business", organization_id: organization?.id }
            });
            if (error) throw error;
            if (data?.url) window.location.href = data.url;
            if (data?.error) {
                console.error("[Billing] Checkout error:", data.error);
                alert(data.error);
            }
        } catch (err) {
            console.error("[Billing] Error creating checkout:", err);
        } finally {
            setActionLoading(false);
        }
    };

    if (orgLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const isPro = organization?.plan_type === "pro";
    const statusActive = organization?.subscription_status === "active";

    return (
        <div className="space-y-6 pb-12">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Manage your subscription and view payment history.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Current Plan Card */}
                <PremiumCard className="p-6 space-y-5">
                    <div className="flex items-center justify-between">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                            <Zap className="h-5 w-5" />
                        </div>
                        <Badge variant={statusActive ? "default" : "secondary"} className="text-xs">
                            {statusActive ? "Active" : "Inactive"}
                        </Badge>
                    </div>

                    <div>
                        <p className="text-xs text-muted-foreground">Current plan</p>
                        <h2 className="text-2xl font-semibold text-foreground capitalize mt-0.5">
                            {organization?.plan_type || "Free"}
                        </h2>
                    </div>

                    <div className="pt-4 border-t border-border">
                        {isPro ? (
                            <Button
                                variant="outline"
                                onClick={handlePortalRedirect}
                                disabled={actionLoading}
                                className="w-full gap-2"
                            >
                                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                                Manage subscription
                            </Button>
                        ) : (
                            <Button
                                onClick={handleUpgrade}
                                disabled={actionLoading}
                                className="w-full gap-2"
                            >
                                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                                Upgrade to Pro
                            </Button>
                        )}
                    </div>
                </PremiumCard>

                {/* Security Card */}
                <PremiumCard className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                            <Shield className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <h3 className="text-sm font-semibold text-foreground">Secure payments</h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        All transactions are processed through Stripe. Your payment details are never stored on our servers.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {["Auto-renewal", "Cancel anytime", "Stripe secured"].map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs font-normal">
                                {tag}
                            </Badge>
                        ))}
                    </div>
                </PremiumCard>
            </div>

            {/* Invoices */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold text-foreground">Invoice history</h3>
                </div>

                {loadingInvoices ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                ) : invoices.length > 0 ? (
                    <PremiumCard className="overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted/50">
                                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Invoice</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Date</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Amount</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                <AnimatePresence>
                                    {invoices.map((inv, idx) => (
                                        <motion.tr
                                            key={inv.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: idx * 0.04 }}
                                            className="hover:bg-accent/40 transition-colors"
                                        >
                                            <td className="px-4 py-3 font-mono text-xs text-foreground">{inv.number}</td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground">
                                                {new Date(inv.created * 1000).toLocaleDateString("pt-BR")}
                                            </td>
                                            <td className="px-4 py-3 text-sm font-medium text-foreground">
                                                {(inv.amount_paid / 100).toLocaleString("pt-BR", { style: "currency", currency: inv.currency })}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge
                                                    variant={inv.status === "paid" ? "default" : "secondary"}
                                                    className={cn(
                                                        "text-xs",
                                                        inv.status === "paid" && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800"
                                                    )}
                                                >
                                                    {inv.status === "paid" ? "Paid" : inv.status}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Button variant="ghost" size="sm" asChild className="gap-1.5 h-7 text-xs">
                                                    <a href={inv.hosted_invoice_url} target="_blank" rel="noopener noreferrer">
                                                        Receipt <ExternalLink className="h-3 w-3" />
                                                    </a>
                                                </Button>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </PremiumCard>
                ) : (
                    <PremiumCard className="py-16 text-center">
                        <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">No invoices yet.</p>
                    </PremiumCard>
                )}
            </div>
        </div>
    );
}
