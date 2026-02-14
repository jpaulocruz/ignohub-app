"use client";

import { useState } from "react";
import { signUpAction } from "../actions";
import Link from "next/link";
import { Loader2, User, Mail, Lock, Building, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export default function SignupPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const result = await signUpAction(formData);

        if (result?.error) {
            setError(result.error);
            setLoading(false);
        }
    }

    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h2 className="text-4xl font-bold text-white tracking-tight">Criar Conta</h2>
                <p className="text-secondary-gray-500 font-medium">Cadastre sua organização e comece a monitorar!</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold"
                    >
                        {error}
                    </motion.div>
                )}

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-white ml-1">Nome Completo<span className="text-brand-500">*</span></label>
                        <div className="relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-gray-500 group-focus-within:text-brand-500 transition-colors" />
                            <input
                                name="fullName"
                                type="text"
                                required
                                placeholder="Ex: João Silva"
                                className="w-full bg-transparent border-white/10 hover:border-white/20 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-secondary-gray-600 transition-all font-medium text-sm outline-none border"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-white ml-1">E-mail Corporativo<span className="text-brand-500">*</span></label>
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-gray-500 group-focus-within:text-brand-500 transition-colors" />
                            <input
                                name="email"
                                type="email"
                                required
                                placeholder="mail@exemplo.com"
                                className="w-full bg-transparent border-white/10 hover:border-white/20 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-secondary-gray-600 transition-all font-medium text-sm outline-none border"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-white ml-1">Senha de Acesso<span className="text-brand-500">*</span></label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-gray-500 group-focus-within:text-brand-500 transition-colors" />
                            <input
                                name="password"
                                type="password"
                                required
                                placeholder="Mínimo 8 caracteres"
                                className="w-full bg-transparent border-white/10 hover:border-white/20 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-secondary-gray-600 transition-all font-medium text-sm outline-none border"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-white ml-1">Nome da Comunidade / Empresa<span className="text-brand-500">*</span></label>
                        <div className="relative group">
                            <Building className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-gray-500 group-focus-within:text-brand-500 transition-colors" />
                            <input
                                name="organizationName"
                                type="text"
                                required
                                placeholder="Ex: Minha Tribo Digital"
                                className="w-full bg-transparent border-white/10 hover:border-white/20 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-secondary-gray-600 transition-all font-medium text-sm outline-none border"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 px-1">
                    <input type="checkbox" id="terms" required className="rounded border-white/10 bg-navy-900 text-brand-500 focus:ring-brand-500" />
                    <label htmlFor="terms" className="text-xs font-medium text-secondary-gray-500 cursor-pointer">
                        Eu aceito os <Link href="#" className="text-brand-500 font-bold hover:underline">Termos e Condições</Link>
                    </label>
                </div>

                <button
                    disabled={loading}
                    className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Criar Minha Conta"}
                </button>

                <p className="text-center text-secondary-gray-500 text-sm font-medium">
                    Já possui registro? <Link href="/login" className="text-brand-500 hover:text-brand-600 transition-colors font-bold">Acesse aqui</Link>
                </p>
            </form>
        </div>
    );
}
