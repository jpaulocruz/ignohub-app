"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { NotificationCenter } from "../notifications/NotificationCenter";
import { ThemeToggle } from "../ui/ThemeToggle";
import { LocaleSwitcher } from "../ui/LocaleSwitcher";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function Navbar() {
    const pathname = usePathname();
    const t = useTranslations("nav");

    const PAGE_KEYS: Record<string, string> = {
        dashboard: "dashboard",
        inbox: "intelligence",
        groups: "communities",
        settings: "settings",
        billing: "billing",
        assets: "assets",
        monitoring: "monitoring",
        plans: "plans",
        onboarding: "onboarding",
    };

    const segment = pathname.split("/").filter(Boolean).pop() || "dashboard";
    const titleKey = PAGE_KEYS[segment];
    const title = titleKey ? t(titleKey) : (segment.charAt(0).toUpperCase() + segment.slice(1));

    return (
        <header className="h-16 shrink-0 border-b border-border bg-card flex items-center justify-between px-6 sticky top-0 z-40 transition-[width,height] ease-linear">
            <div className="flex items-center gap-3">
                <SidebarTrigger className="-ml-2" />
                <h1 className="text-sm font-semibold text-foreground">{title}</h1>
            </div>

            <div className="flex items-center gap-1">
                <LocaleSwitcher />
                <ThemeToggle />
                <NotificationCenter />
            </div>
        </header>
    );
}
