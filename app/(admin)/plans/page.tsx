import { PremiumCard } from "@/components/ui/PremiumCard";
import { getPlans, getSubscriptionAlerts } from "./actions";
import { PlanForm } from "@/components/admin/PlanForm";
import {
    CreditCard,
    Settings2,
    AlertCircle,
    ExternalLink,
    Search,
    CheckCircle2,
    FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function PlanConfigurationPage() {
    const plans = await getPlans();
    const alerts = await getSubscriptionAlerts();

    return (
        <div className="space-y-6 pb-12">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Plan configuration</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Configure resource quotas, retention cycles, and Stripe mappings.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* Plans list */}
                <div className="lg:col-span-8 space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-border">
                        <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Settings2 className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <h2 className="text-sm font-semibold text-foreground">Plan settings</h2>
                    </div>

                    <div className="space-y-4">
                        {plans.map((plan) => (
                            <PremiumCard key={plan.id} className="p-5">
                                <PlanForm plan={plan as any} />
                            </PremiumCard>
                        ))}
                        {plans.length === 0 && (
                            <PremiumCard className="py-12 text-center">
                                <p className="text-sm text-muted-foreground">No plans configured.</p>
                            </PremiumCard>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-4 space-y-4">
                    {/* Subscription alerts */}
                    <PremiumCard className="overflow-hidden">
                        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 bg-destructive/10 rounded-lg flex items-center justify-center">
                                    <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                                </div>
                                <h2 className="text-sm font-semibold text-foreground">Subscription alerts</h2>
                            </div>
                            {alerts.length > 0 && (
                                <Badge variant="destructive" className="text-xs">{alerts.length}</Badge>
                            )}
                        </div>

                        <div className="divide-y divide-border">
                            {alerts.length === 0 ? (
                                <div className="py-8 text-center">
                                    <CheckCircle2 className="h-7 w-7 text-green-500 mx-auto mb-2" />
                                    <p className="text-sm text-muted-foreground">All subscriptions healthy</p>
                                </div>
                            ) : (
                                alerts.map((alert) => (
                                    <div key={alert.id} className="px-4 py-3 flex items-center justify-between hover:bg-accent/40 transition-colors">
                                        <div>
                                            <p className="text-sm font-medium text-foreground line-clamp-1">{alert.name}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge
                                                    variant={alert.subscription_status === 'active' ? 'secondary' : 'destructive'}
                                                    className={cn("text-xs", alert.subscription_status === 'active' && "text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30")}
                                                >
                                                    {alert.subscription_status}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground capitalize">{alert.plan_type}</span>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
                                            <Link href={`/admin/organizations/${alert.id}`}>
                                                <Search className="h-3.5 w-3.5" />
                                            </Link>
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="px-4 py-3 border-t border-border bg-muted/30">
                            <Button variant="outline" className="w-full gap-2 text-xs h-8">
                                Full control dashboard <ExternalLink className="h-3 w-3" />
                            </Button>
                        </div>
                    </PremiumCard>

                    {/* Stripe card */}
                    <PremiumCard className="p-5 space-y-4">
                        <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <CreditCard className="h-5 w-5 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-sm font-semibold text-foreground">Stripe portal</h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Access the Stripe dashboard for reconciliation, coupons, and financial metrics.
                            </p>
                        </div>
                        <Button className="w-full gap-2">
                            <ExternalLink className="h-4 w-4" /> Open Stripe Portal
                        </Button>
                    </PremiumCard>
                </div>
            </div>
        </div>
    );
}
