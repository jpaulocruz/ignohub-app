"use client";

import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { useOrganization } from "@/hooks/use-organization";
import { Loader2 } from "lucide-react";
import { TrialOverlay } from "@/components/trial-overlay";
import { useState } from "react";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { organization, loading } = useOrganization();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
            <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

            <main className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden relative scroll-smooth">
                <Navbar onMenuClick={() => setIsMobileMenuOpen(true)} />

                <div className="flex-1 p-4 md:p-8 mt-2 w-full max-w-7xl mx-auto">
                    {isTrialExpired && <TrialOverlay />}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key="content"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            className="w-full"
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </div>

                <footer className="shrink-0 border-t border-white/5 bg-navy-950 z-10 relative">
                    <div className="max-w-7xl mx-auto p-8 md:p-12">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
                            <div className="space-y-4">
                                <h3 className="text-xl font-black tracking-tight text-white">
                                    Igno<span className="text-brand-500">Hub</span> Intelligence
                                </h3>
                                <p className="text-secondary-gray-500 text-sm leading-relaxed">
                                    Plataforma avançada de inteligência artificial para monitoramento e análise de comunidades em tempo real.
                                </p>
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-sm font-black uppercase tracking-widest text-white">Recursos</h4>
                                <ul className="space-y-2 text-sm text-secondary-gray-500">
                                    <li><a href="#" className="hover:text-brand-500 transition-colors">Documentação da API</a></li>
                                    <li><a href="#" className="hover:text-brand-500 transition-colors">Status do Sistema</a></li>
                                    <li><a href="#" className="hover:text-brand-500 transition-colors">Novidades & Updates</a></li>
                                </ul>
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-sm font-black uppercase tracking-widest text-white">Suporte</h4>
                                <ul className="space-y-2 text-sm text-secondary-gray-500">
                                    <li><a href="#" className="hover:text-brand-500 transition-colors">Central de Ajuda</a></li>
                                    <li><a href="#" className="hover:text-brand-500 transition-colors">Falar com Especialista</a></li>
                                    <li><a href="#" className="hover:text-brand-500 transition-colors">Reportar um Problema</a></li>
                                </ul>
                            </div>
                        </div>
                        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-secondary-gray-600">
                            <p>© 2026 IgnoHub Systems. All rights reserved.</p>
                            <div className="flex gap-6">
                                <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                                <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                            </div>
                        </div>
                    </div>
                </footer>
            </main>
        </div>
    );
}
