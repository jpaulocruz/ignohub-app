"use client";

import { useEffect, useState } from "react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { useOrganization } from "@/hooks/use-organization";
import { createClient } from "@/lib/supabase/client";
import {
    User,
    Building2,
    Settings,
    Bell,
    Shield,
    Save,
    CheckCircle2,
    AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
    const { organization, refresh } = useOrganization();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // Form states
    const [fullName, setFullName] = useState("");
    const [orgName, setOrgName] = useState("");

    const supabase = createClient();

    useEffect(() => {
        async function fetchProfile() {
            try {
                setLoading(true);
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data: profileData } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", user.id)
                    .single();

                if (profileData) {
                    setProfile(profileData);
                    setFullName(profileData.full_name || "");
                }

                if (organization) {
                    setOrgName(organization.name || "");
                }
            } catch (err) {
                console.error("[Settings] Error fetching profile:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchProfile();
    }, [organization]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setStatus(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user found");

            // 1. Update Profile
            const { error: profileError } = await supabase
                .from("profiles")
                .update({ full_name: fullName, updated_at: new Date().toISOString() })
                .eq("id", user.id);

            if (profileError) throw profileError;

            // 2. Update Organization
            if (organization) {
                const { error: orgError } = await supabase
                    .from("organizations")
                    .update({ name: orgName })
                    .eq("id", organization.id);

                if (orgError) throw orgError;
            }

            setStatus({ type: 'success', message: 'Configurações atualizadas com sucesso!' });
            refresh();
        } catch (err: any) {
            console.error("[Settings] Error saving:", err);
            setStatus({ type: 'error', message: err.message || 'Erro ao salvar configurações.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-10 animate-pulse pb-12">
                <div className="h-16 w-1/4 bg-navy-800 rounded-2xl" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="h-96 bg-navy-800 rounded-premium" />
                    <div className="h-48 bg-navy-800 rounded-premium" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-12 pb-20">
            <header className="space-y-2">
                <h1 className="text-5xl font-black text-white tracking-tighter leading-none">Configurações</h1>
                <p className="text-secondary-gray-500 font-medium text-lg">
                    Gerencie seu perfil e as preferências da organização.
                </p>
            </header>

            <AnimatePresence>
                {status && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={cn(
                            "p-4 rounded-2xl flex items-center gap-3 border shadow-lg",
                            status.type === 'success'
                                ? "bg-green-500/10 border-green-500/20 text-green-500"
                                : "bg-red-500/10 border-red-500/20 text-red-500"
                        )}
                    >
                        {status.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                        <p className="text-sm font-bold">{status.message}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
                <div className="lg:col-span-2 space-y-10">
                    {/* User Profile Section */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-500 border border-brand-500/20">
                                <User className="h-4 w-4" />
                            </div>
                            <h2 className="text-2xl font-black text-white tracking-tight">Perfil do Usuário</h2>
                        </div>

                        <PremiumCard className="p-8 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-secondary-gray-500 ml-1">Nome Completo</label>
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="Seu nome"
                                        className="w-full bg-navy-950 border border-white/5 rounded-2xl p-4 text-white focus:outline-none focus:border-brand-500 transition-all font-bold placeholder:text-secondary-gray-700 shadow-inner"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-secondary-gray-500 ml-1">E-mail</label>
                                    <input
                                        type="email"
                                        disabled
                                        value={profile?.email || ""}
                                        className="w-full bg-navy-900 border border-white/5 rounded-2xl p-4 text-secondary-gray-600 font-bold opacity-50 cursor-not-allowed"
                                    />
                                </div>
                            </div>
                        </PremiumCard>
                    </section>

                    {/* Organization Section */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-500 border border-brand-500/20">
                                <Building2 className="h-4 w-4" />
                            </div>
                            <h2 className="text-2xl font-black text-white tracking-tight">Organização</h2>
                        </div>

                        <PremiumCard className="p-8 space-y-8">
                            <div className="space-y-2 max-w-md">
                                <label className="text-[10px] font-black uppercase tracking-widest text-secondary-gray-500 ml-1">Nome da Organização</label>
                                <input
                                    type="text"
                                    value={orgName}
                                    onChange={(e) => setOrgName(e.target.value)}
                                    placeholder="Nome da sua empresa"
                                    className="w-full bg-navy-950 border border-white/5 rounded-2xl p-4 text-white focus:outline-none focus:border-brand-500 transition-all font-bold placeholder:text-secondary-gray-700 shadow-inner"
                                />
                            </div>
                        </PremiumCard>
                    </section>
                </div>

                <aside className="space-y-10 lg:sticky lg:top-24">
                    {/* Action Card */}
                    <PremiumCard className="p-8 space-y-6 bg-gradient-to-br from-brand-500 to-brand-600 border-none shadow-2xl shadow-brand-500/20">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase text-white/60 tracking-[0.3em]">Gerenciamento</p>
                            <h3 className="text-2xl font-black text-white leading-tight">Salvar Alterações</h3>
                        </div>
                        <p className="text-white/80 font-medium text-sm">
                            Suas alterações serão refletidas em todo o ecossistema IgnoHub instantaneamente.
                        </p>
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full bg-white text-brand-500 font-black py-4 rounded-2xl transition-all hover:scale-[1.02] active:scale-95 text-lg shadow-xl shadow-brand-900/10 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {saving ? (
                                <div className="h-5 w-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Save className="h-5 w-5" />
                                    Confirmar
                                </>
                            )}
                        </button>
                    </PremiumCard>

                    {/* Quick Access */}
                    <section className="space-y-4">
                        <p className="text-[10px] font-black uppercase text-secondary-gray-500 tracking-[0.3em] ml-1">Links Úteis</p>
                        <div className="space-y-2">
                            {[
                                { icon: Shield, label: 'Segurança & LGPD' },
                                { icon: Bell, label: 'Notificações' },
                                { icon: Shield, label: 'Acesso & Permissões' }
                            ].map((item, idx) => (
                                <button key={idx} type="button" className="w-full flex items-center justify-between p-4 bg-navy-800/20 hover:bg-navy-800/40 border border-white/5 rounded-2xl transition-all group">
                                    <div className="flex items-center gap-3">
                                        <item.icon className="h-4 w-4 text-secondary-gray-600 group-hover:text-brand-500 transition-colors" />
                                        <span className="text-sm font-bold text-secondary-gray-400 group-hover:text-white transition-colors">{item.label}</span>
                                    </div>
                                    <div className="h-1.5 w-1.5 rounded-full bg-brand-500 opacity-20 group-hover:opacity-100 transition-opacity" />
                                </button>
                            ))}
                        </div>
                    </section>
                </aside>
            </form>
        </div>
    );
}
