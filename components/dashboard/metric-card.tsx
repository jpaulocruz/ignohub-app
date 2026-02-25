"use client";

import { ReactNode } from "react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
    title: string;
    value: string | number;
    icon: ReactNode;
    growth?: number;
    label?: string;
    className?: string;
}

export function MetricCard({ title, value, icon, growth, label, className }: MetricCardProps) {
    const isPositive = growth !== undefined && growth > 0;
    const isNegative = growth !== undefined && growth < 0;

    return (
        <PremiumCard className={cn("p-5 overflow-hidden relative", className)}>
            <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
                <div className="p-2 bg-primary/5 rounded-lg text-primary">
                    {icon}
                </div>
            </div>

            <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold tracking-tight text-foreground">{value}</p>
                {growth !== undefined && (
                    <div className={cn(
                        "flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full",
                        isPositive ? "bg-green-500/10 text-green-600 dark:text-green-400" :
                            isNegative ? "bg-red-500/10 text-red-600 dark:text-red-400" :
                                "bg-muted text-muted-foreground"
                    )}>
                        {isPositive ? <TrendingUp className="h-3 w-3" /> :
                            isNegative ? <TrendingDown className="h-3 w-3" /> :
                                <Minus className="h-3 w-3" />}
                        {Math.abs(growth)}%
                    </div>
                )}
            </div>

            {label && (
                <p className="text-[11px] text-muted-foreground mt-2 font-medium">
                    {label}
                </p>
            )}

            {/* Subtle background decorative element */}
            <div className="absolute -bottom-6 -right-6 opacity-[0.03] text-primary">
                {icon}
            </div>
        </PremiumCard>
    );
}
