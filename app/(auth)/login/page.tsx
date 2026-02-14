"use client";

import { useState, useEffect } from "react";
import { loginAction } from "../actions";
import Link from "next/link";
import { Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { motion } from "framer-motion";

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        async function checkSession() {
            const { data } = await supabase.auth.getSession();
            if (data.session) {
                router.replace("/dashboard");
            }
        }
        checkSession();
    }, [supabase, router]);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const result = await loginAction(formData);

        if (result?.error) {
            setError(result.error);
            setLoading(false);
        }
    }

    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h2 className="text-4xl font-bold text-white tracking-tight">Login</h2>
                <p className="text-secondary-gray-500 font-medium">Digite seu e-mail e senha para acessar o painel!</p>
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
                        <label className="text-sm font-bold text-white ml-1">E-mail<span className="text-brand-500">*</span></label>
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
                        <label className="text-sm font-bold text-white ml-1">Senha<span className="text-brand-500">*</span></label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-gray-500 group-focus-within:text-brand-500 transition-colors" />
                            <input
                                name="password"
                                type={showPassword ? "text" : "password"}
                                required
                                placeholder="Mín. 8 caracteres"
                                className="w-full bg-transparent border-white/10 hover:border-white/20 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-2xl py-4 pl-12 pr-12 text-white placeholder:text-secondary-gray-600 transition-all font-medium text-sm outline-none border"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-gray-500 hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="remember" className="rounded border-white/10 bg-navy-900 text-brand-500 focus:ring-brand-500" />
                        <label htmlFor="remember" className="text-sm font-medium text-secondary-gray-500 cursor-pointer">Lembrar de mim</label>
                    </div>
                    <Link href="#" className="text-sm font-bold text-brand-500 hover:text-brand-600 transition-colors">
                        Esqueci minha senha?
                    </Link>
                </div>

                <button
                    disabled={loading}
                    className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Entrar"}
                </button>

                <p className="text-center text-secondary-gray-500 text-sm font-medium">
                    Ainda não tem registro? <Link href="/signup" className="text-brand-500 hover:text-brand-600 transition-colors font-bold">Crie uma conta</Link>
                </p>
            </form>
        </div>
    );
}
