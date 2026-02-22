"use client";

import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { NotificationCenter } from "../notifications/NotificationCenter";
import { ThemeToggle } from "../ui/ThemeToggle";
import { SidebarTrigger } from "@/components/ui/sidebar";

const PAGE_TITLES: Record<string, string> = {
    dashboard: "Dashboard",
    inbox: "Intelligence",
    groups: "Communities",
    settings: "Settings",
    billing: "Billing",
    assets: "Assets",
    monitoring: "Monitoring",
    plans: "Plans",
    onboarding: "Add community",
};

export function Navbar() {
    const pathname = usePathname();
    const segment = pathname.split("/").filter(Boolean).pop() || "dashboard";
    const title = PAGE_TITLES[segment] ?? (segment.charAt(0).toUpperCase() + segment.slice(1));

    return (
        <header className="h-16 shrink-0 border-b border-border bg-card flex items-center justify-between px-6 sticky top-0 z-40 transition-[width,height] ease-linear">
            <div className="flex items-center gap-3">
                <SidebarTrigger className="-ml-2" />
                <h1 className="text-sm font-semibold text-foreground">{title}</h1>
            </div>

            <div className="flex items-center gap-1">
                <ThemeToggle />
                <NotificationCenter />
            </div>
        </header>
    );
}
