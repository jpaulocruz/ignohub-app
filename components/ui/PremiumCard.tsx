"use client";

import { cn } from "@/lib/utils";
import React from "react";

interface PremiumCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
}

export function PremiumCard({ children, className, ...props }: PremiumCardProps) {
    return (
        <div
            className={cn(
                "rounded-xl border border-border bg-card text-card-foreground shadow-sm",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
