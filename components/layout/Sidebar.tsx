"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
    LayoutDashboard,
    MessageSquare,
    Users,
    Settings,
    LogOut,
    CreditCard,
    Shield,
    Activity,
    X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useOrganization } from "@/hooks/use-organization";
import { createClient } from "@/lib/supabase/client";

const routes = [
    {
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "/dashboard",
    },
    {
        label: "Central de Inteligência",
        icon: MessageSquare,
        href: "/inbox",
    },
    {
        label: "Comunidades",
        icon: Users,
        href: "/groups",
    },
    {
        label: "Billing",
        icon: CreditCard,
        href: "/billing",
    },
    {
        label: "Configurações",
        icon: Settings,
        href: "/settings",
    },
    {
        label: "Assets Admin",
        icon: Shield,
        href: "/assets",
        adminOnly: true,
    },
    {
        label: "Monitoramento",
        icon: Activity,
        href: "/monitoring",
        adminOnly: true,
    },
    {
        label: "Planos & Billing",
        icon: CreditCard,
        href: "/plans",
        adminOnly: true,
    },
];

export function Sidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
    const pathname = usePathname();
    const router = useRouter();
    const { organization, role } = useOrganization();
    const supabase = createClient();
    const [isSuperadmin, setIsSuperadmin] = useState(false);

    useEffect(() => {
        const checkSuperadmin = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data } = await supabase
                .from('profiles')
                .select('is_superadmin')
                .eq('id', user.id)
                .single();
            setIsSuperadmin(data?.is_superadmin ?? false);
        };
        checkSuperadmin();
    }, [supabase]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    const sidebarContent = (
        <div className="flex flex-col h-full bg-navy-900 border-r border-white/5 w-72 transition-all duration-300">
            <div className="p-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-brand-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
                        <Shield className="text-white h-6 w-6" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-white">
                        Igno<span className="text-brand-500">Hub</span>
                    </h1>
                </div>
                {/* Mobile Close Button */}
                {onClose && (
                    <button onClick={onClose} className="md:hidden text-secondary-gray-500 hover:text-white">
                        <X className="h-6 w-6" />
                    </button>
                )}
            </div>

            <div className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
                {routes
                    .filter(route => !route.adminOnly || isSuperadmin)
                    .map((route) => {
                        const isActive = pathname === route.href;

                        return (
                            <Link
                                key={route.href}
                                href={route.href}
                                onClick={onClose}
                                className={cn(
                                    "group flex items-center p-3.5 w-full justify-start font-bold cursor-pointer rounded-2xl transition-all duration-300 relative overflow-hidden text-sm",
                                    isActive
                                        ? "text-white bg-navy-800 shadow-premium"
                                        : "text-secondary-gray-600 hover:text-white hover:bg-navy-800/50"
                                )}
                            >
                                <div className="flex items-center flex-1 relative z-10 transition-transform duration-300 group-hover:translate-x-1">
                                    <route.icon className={cn("h-6 w-6 mr-3 transition-colors", isActive ? "text-brand-500" : "group-hover:text-brand-500")} />
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
                        <LogOut className="h-5 w-5 mr-3" />
                        Sair da Conta
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex h-full sticky top-0">
                {sidebarContent}
            </aside>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
                        />
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                            className="fixed inset-y-0 left-0 z-50 md:hidden h-full"
                        >
                            {sidebarContent}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
