"use client";

import { ReactNode } from "react";
import { IgnoHubLogo } from "@/components/ui/logo";
import Link from "next/link";

export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen grid lg:grid-cols-2 bg-background">
            {/* Brand side - desktop only */}
            <div className="hidden lg:flex flex-col justify-between bg-card border-r border-border p-12">
                <Link href="/" className="flex items-center gap-3">
                    <IgnoHubLogo />
                    <span className="font-bold text-xl tracking-tight text-foreground lowercase">ignohub</span>
                </Link>

                <div className="space-y-6">
                    <blockquote className="space-y-2">
                        <p className="text-lg text-foreground leading-relaxed">
                            "IgnoHub transformed how we monitor and understand our digital communities. The AI-powered insights are remarkably accurate."
                        </p>
                        <footer className="text-sm text-muted-foreground">— Community Manager, TechHub</footer>
                    </blockquote>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl border border-border bg-muted/40 p-4">
                        <p className="text-2xl font-bold text-foreground">99.9%</p>
                        <p className="text-sm text-muted-foreground mt-1">Network uptime</p>
                    </div>
                    <div className="rounded-xl border border-border bg-muted/40 p-4">
                        <p className="text-2xl font-bold text-foreground">2.4s</p>
                        <p className="text-sm text-muted-foreground mt-1">Avg. latency</p>
                    </div>
                </div>
            </div>

            {/* Form side */}
            <div className="flex flex-col items-center justify-center p-8">
                {/* Mobile logo */}
                <Link href="/" className="flex items-center gap-3 mb-10 lg:hidden">
                    <IgnoHubLogo />
                    <span className="font-bold text-xl tracking-tight text-foreground lowercase">ignohub</span>
                </Link>

                <div className="w-full max-w-[400px]">
                    {children}
                </div>
            </div>
        </div>
    );
}
