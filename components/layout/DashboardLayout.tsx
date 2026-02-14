"use client";

import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { useOrganization } from "@/hooks/use-organization";
import { Loader2 } from "lucide-react";
import { TrialOverlay } from "@/components/trial-overlay";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { organization, loading } = useOrganization();

    const isTrialExpired = organization &&
        organization.subscription_status !== 'active' &&
        organization.trial_ends_at &&
        new Date(organization.trial_ends_at) < new Date();

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-navy-900">
                <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-navy-900 text-white overflow-hidden selection:bg-brand-500/30">
            <Sidebar />

            <main className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden relative scroll-smooth">
                <Navbar />

                <div className="p-4 md:p-8 mt-2 min-h-[calc(100vh-120px)]">
                    {isTrialExpired && <TrialOverlay />}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key="content"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </div>

                <footer className="p-8 text-secondary-gray-600 text-[10px] font-bold uppercase tracking-widest flex flex-col md:flex-row justify-between items-center gap-4">
                    <p>© 2026 IgnoHub Intelligence Systems. Todos os direitos reservados.</p>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-brand-500 transition-colors uppercase">Central de Suporte</a>
                        <a href="#" className="hover:text-brand-500 transition-colors uppercase">Privacidade & Termos</a>
                    </div>
                </footer>
            </main>
        </div>
    );
}
