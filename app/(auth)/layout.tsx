"use client";

import { ReactNode } from "react";
import { Shield } from "lucide-react";
import { motion } from "framer-motion";

export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-navy-900 flex text-white overflow-hidden">
            {/* Brand Side (Left) - Desktop only */}
            <div className="hidden lg:flex w-1/2 relative flex-col items-center justify-center p-12 overflow-hidden">
                {/* Abstract Background Elements */}
                <div className="absolute top-0 left-0 w-full h-full bg-brand-500/10 z-0" />
                <div className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] bg-brand-500/20 blur-[120px] rounded-full z-0 animate-pulse" />
                <div className="absolute -bottom-[10%] -right-[10%] w-[60%] h-[60%] bg-blue-500/10 blur-[120px] rounded-full z-0" />

                <div className="z-10 text-center space-y-8 max-w-lg">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.8, ease: "backOut" }}
                        className="h-24 w-24 mx-auto rounded-3xl bg-brand-500 flex items-center justify-center shadow-2xl shadow-brand-500/40"
                    >
                        <Shield className="text-white h-12 w-12" />
                    </motion.div>

                    <div className="space-y-4">
                        <h1 className="text-6xl font-black tracking-tighter leading-none">
                            Igno<span className="text-brand-500">Hub</span>
                        </h1>
                        <p className="text-secondary-gray-500 text-xl font-medium leading-relaxed">
                            A próxima geração em monitoramento e inteligência para comunidades digitais.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-12">
                        <div className="glass-card p-6 rounded-3xl text-left border border-white/5">
                            <p className="text-2xl font-bold text-white">99.9%</p>
                            <p className="text-xs font-bold text-secondary-gray-600 uppercase tracking-widest">Uptime da Rede</p>
                        </div>
                        <div className="glass-card p-6 rounded-3xl text-left border border-white/5">
                            <p className="text-2xl font-bold text-white">2.4s</p>
                            <p className="text-xs font-bold text-secondary-gray-600 uppercase tracking-widest">Latência Média</p>
                        </div>
                    </div>
                </div>

                {/* Floating Credit/Badge */}
                <div className="absolute bottom-8 left-12 z-10">
                    <p className="text-xs font-bold text-secondary-gray-600 uppercase tracking-[0.2em]">
                        © 2026 IGNO-SYSTEMS OPERATIONAL
                    </p>
                </div>
            </div>

            {/* Form Side (Right) */}
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 md:p-12 bg-navy-900 lg:bg-navy-900 border-l border-white/5 relative">
                <div className="lg:hidden absolute top-8 left-8 flex items-center gap-2">
                    <Shield className="text-brand-500 h-6 w-6" />
                    <span className="font-bold text-xl tracking-tight">IgnoHub</span>
                </div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="w-full max-w-[420px] space-y-8"
                >
                    {children}
                </motion.div>
            </div>
        </div>
    );
}
