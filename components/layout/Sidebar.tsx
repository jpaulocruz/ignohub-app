"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
    LayoutDashboard,
    MessageSquare,
    Users,
    Settings,
    LogOut,
    CreditCard,
    Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useOrganization } from "@/hooks/use-organization";
import { createClient } from "@/lib/supabase/client";

const routes = [
    {
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "/dashboard",
    },
    {
        label: "Inbox",
        icon: MessageSquare,
        href: "/inbox",
    },
    {
        label: "Comunidade",
        icon: Users,
        href: "/groups",
    },
    {
        label: "Faturamento",
        icon: CreditCard,
        href: "/dashboard/billing",
    },
    {
        label: "Configurações",
        icon: Settings,
        href: "/settings",
    },
];

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { organization, role } = useOrganization();
    const supabase = createClient();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    return (
        <div className="flex flex-col h-full bg-navy-900 border-r border-white/5 w-72 transition-all duration-300">
            <div className="p-8 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-brand-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
                    <Shield className="text-white h-6 w-6" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-white">
                    Igno<span className="text-brand-500">Hub</span>
                </h1>
            </div>

            <div className="flex-1 px-4 space-y-2 mt-4">
                {routes.map((route) => {
                    const isActive = pathname === route.href;

                    return (
                        <Link
                            key={route.href}
                            href={route.href}
                            className={cn(
                                "group flex items-center p-3 w-full justify-start font-bold cursor-pointer rounded-2xl transition-all duration-300 relative overflow-hidden text-sm",
                                isActive
                                    ? "text-white bg-navy-800 shadow-premium"
                                    : "text-secondary-gray-600 hover:text-white hover:bg-navy-800/50"
                            )}
                        >
                            <div className="flex items-center flex-1 relative z-10 transition-transform duration-300 group-hover:translate-x-1">
                                <route.icon className={cn("h-5 w-5 mr-3 transition-colors", isActive ? "text-brand-500" : "group-hover:text-brand-500")} />
                                {route.label}
                            </div>
                            {isActive && (
                                <motion.div
                                    layoutId="active-pill"
                                    className="absolute right-0 w-1.5 h-6 bg-brand-500 rounded-l-full"
                                />
                            )}
                        </Link>
                    );
                })}
            </div>

            <div className="p-6 mt-auto">
                <div className="premium-card p-4 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-navy-900 border border-white/5 flex items-center justify-center text-brand-500 font-bold shrink-0">
                            {organization?.name?.[0] || 'O'}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-widest text-secondary-gray-500">Organização</p>
                            <p className="text-sm font-bold text-white truncate">
                                {organization?.name || 'Carregando...'}
                            </p>
                            <p className="text-[10px] text-brand-400 capitalize font-medium">{role}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center w-full p-2.5 text-secondary-gray-500 hover:text-red-400 transition-all rounded-xl hover:bg-red-500/10 text-sm font-bold"
                    >
                        <LogOut className="h-4 w-4 mr-3" />
                        Sair da Conta
                    </button>
                </div>
            </div>
        </div>
    );
}
