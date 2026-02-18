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
    AlertCircle,
    Clock,
    Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
    const { organization, refresh } = useOrganization();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // Expanded Profile State
    const [fullName, setFullName] = useState("");
    const [jobTitle, setJobTitle] = useState("");
    const [phone, setPhone] = useState("");
    const [bio, setBio] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");

    const [orgName, setOrgName] = useState("");
    const [summaryTime, setSummaryTime] = useState("09:00");
    const [summaryDays, setSummaryDays] = useState<number[]>([1, 2, 3, 4, 5]);
    const [minMessages, setMinMessages] = useState(10);
    const [notifEmail, setNotifEmail] = useState("");
    const [notifWhatsapp, setNotifWhatsapp] = useState("");
    const [emailEnabled, setEmailEnabled] = useState(true);
    const [whatsappEnabled, setWhatsappEnabled] = useState(false);
    const [autoGenerate, setAutoGenerate] = useState(true);
    const [alertInstructions, setAlertInstructions] = useState("");

    const supabase = createClient();

    // ... normalizeDays helper ...
    const normalizeDays = (days: any[]): number[] => {
        if (!Array.isArray(days)) return [];
        const dayMap: { [key: string]: number } = {
            'sun': 0, 'mon': 1, 'tue': 2, 'wed': 3, 'thu': 4, 'fri': 5, 'sat': 6,
            'dom': 0, 'seg': 1, 'ter': 2, 'qua': 3, 'qui': 4, 'sex': 5, 'sab': 6, 'sáb': 6
        };

        return days.map(d => {
            if (typeof d === 'number') return d;
            if (typeof d === 'string') {
                const lower = d.toLowerCase();
                if (!isNaN(parseInt(lower))) return parseInt(lower);
                if (dayMap[lower] !== undefined) return dayMap[lower];
            }
            return null;
        }).filter(d => d !== null && d >= 0 && d <= 6) as number[];
    };

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
                    setJobTitle(profileData.job_title || "");
                    setPhone(profileData.phone || "");
                    setBio(profileData.bio || "");
                    setAvatarUrl(profileData.avatar_url || "");
                }

                if (organization) {
                    setOrgName(organization.name || "");
                    if (organization.summary_schedule_time) setSummaryTime(organization.summary_schedule_time);
                    if (organization.summary_delivery_days) {
                        setSummaryDays(normalizeDays(organization.summary_delivery_days));
                    }
                    if (organization.alert_instructions) setAlertInstructions(organization.alert_instructions);
                }

                const { data: settings } = await supabase
                    .from("user_settings")
                    .select("*")
                    .eq("user_id", user.id)
                    .maybeSingle();

                if (settings) {
                    setMinMessages(settings.min_messages_for_summary || 10);
                    setNotifEmail(settings.notification_email || user.email || "");
                    setNotifWhatsapp(settings.notification_whatsapp || "");
                    setEmailEnabled(settings.email_summary_enabled !== false);
                    setWhatsappEnabled(settings.whatsapp_summary_enabled === true);
                    setAutoGenerate(settings.auto_generate_enabled !== false);
                }
            } catch (err) {
                console.error("[Settings] Error fetching profile:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchProfile();
    }, [organization]);

    const toggleDay = (dayIndex: number) => {
        setSummaryDays(prev => {
            const newDays = prev.includes(dayIndex)
                ? prev.filter(d => d !== dayIndex)
                : [...prev, dayIndex];
            return newDays.sort((a, b) => a - b);
        });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setStatus(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user found");

            // 1. Update Profile (Expanded)
            const { error: profileError } = await supabase
                .from("profiles")
                .update({
                    full_name: fullName,
                    job_title: jobTitle,
                    phone: phone,
                    bio: bio,
                    avatar_url: avatarUrl,
                    updated_at: new Date().toISOString()
                })
                .eq("id", user.id);

            if (profileError) throw profileError;

            // ... rest of logic ...
            if (organization) {
                const { error: orgError } = await supabase
                    .from("organizations")
                    .update({
                        name: orgName,
                        summary_schedule_time: summaryTime,
                        summary_delivery_days: summaryDays,
                        alert_instructions: alertInstructions
                    })
                    .eq("id", organization.id);

                if (orgError) throw orgError;
            }

            const { error: settingsError } = await supabase
                .from("user_settings")
                .upsert({
                    user_id: user.id,
                    notification_email: notifEmail,
                    notification_whatsapp: notifWhatsapp,
                    email_summary_enabled: emailEnabled,
                    whatsapp_summary_enabled: whatsappEnabled,
                    auto_generate_enabled: autoGenerate,
                    min_messages_for_summary: minMessages,
                    updated_at: new Date().toISOString()
                });

            if (settingsError) throw settingsError;

            setStatus({ type: 'success', message: 'Configurações atualizadas com sucesso!' });
            refresh();
        } catch (err: any) {
            console.error("[Settings] Error saving:", JSON.stringify(err, null, 2));
            setStatus({ type: 'error', message: err.message || err.details || 'Erro ao salvar configurações.' });
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
        <div className="space-y-12 pb-32">
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
                            <div className="flex flex-col md:flex-row gap-8 items-start">
                                {/* Avatar */}
                                <div className="flex-shrink-0">
                                    <input
                                        type="file"
                                        id="avatar-upload"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;

                                            try {
                                                setSaving(true);
                                                const fileExt = file.name.split('.').pop();
                                                const fileName = `${Math.random()}.${fileExt}`;
                                                const filePath = `${profile.id}/${fileName}`;

                                                const { error: uploadError } = await supabase.storage
                                                    .from('avatars')
                                                    .upload(filePath, file);

                                                if (uploadError) throw uploadError;

                                                const { data: { publicUrl } } = supabase.storage
                                                    .from('avatars')
                                                    .getPublicUrl(filePath);

                                                setAvatarUrl(publicUrl);

                                                // Create a synthetic event to trigger save
                                                // or just update state and let user save manually?
                                                // Better to just update visual state and let final save handle the DB update 
                                                // BUT we need the URL in the DB. 
                                                // Let's rely on handleSave to pick up valid avatarUrl, 
                                                // but handleSave uses state 'avatarUrl'. 
                                                // The handleSave currently effectively ignores avatarUrl updates in the DB update call
                                                // We must enable it in handleSave.

                                            } catch (error) {
                                                console.error('Error uploading avatar:', error);
                                                setStatus({ type: 'error', message: 'Erro ao fazer upload da imagem.' });
                                            } finally {
                                                setSaving(false);
                                            }
                                        }}
                                    />
                                    <label
                                        htmlFor="avatar-upload"
                                        className="w-24 h-24 rounded-full bg-navy-900 border-2 border-dashed border-white/10 flex items-center justify-center relative group cursor-pointer overflow-hidden hover:border-brand-500/50 transition-colors"
                                    >
                                        {avatarUrl ? (
                                            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="h-8 w-8 text-secondary-gray-600 group-hover:text-brand-500 transition-colors" />
                                        )}
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <p className="text-[10px] uppercase font-bold text-white">Alterar</p>
                                        </div>
                                    </label>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 w-full">
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
                                        <label className="text-[10px] font-black uppercase tracking-widest text-secondary-gray-500 ml-1">Cargo / Função</label>
                                        <input
                                            type="text"
                                            value={jobTitle}
                                            onChange={(e) => setJobTitle(e.target.value)}
                                            placeholder="Ex: CEO, Gerente de Mídia"
                                            className="w-full bg-navy-950 border border-white/5 rounded-2xl p-4 text-white focus:outline-none focus:border-brand-500 transition-all font-bold placeholder:text-secondary-gray-700 shadow-inner"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-secondary-gray-500 ml-1">Telefone</label>
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="+55 11 99999-9999"
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
                                    <div className="col-span-full space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-secondary-gray-500 ml-1">Bio / Sobre</label>
                                        <textarea
                                            value={bio}
                                            onChange={(e) => setBio(e.target.value)}
                                            placeholder="Conte um pouco sobre você..."
                                            className="w-full h-24 bg-navy-950 border border-white/5 rounded-2xl p-4 text-white focus:outline-none focus:border-brand-500 transition-all text-sm placeholder:text-secondary-gray-700 shadow-inner resize-none leading-relaxed"
                                        />
                                    </div>
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

                            <div className="space-y-4 pt-4 border-t border-white/5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Zap className="h-4 w-4 text-brand-500" />
                                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Geração Automática</h3>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setAutoGenerate(!autoGenerate)}
                                        className={cn(
                                            "w-10 h-5 rounded-full transition-all relative",
                                            autoGenerate ? "bg-brand-500" : "bg-navy-800"
                                        )}
                                    >
                                        <div className={cn(
                                            "absolute top-1 w-3 h-3 bg-white rounded-full transition-all shadow-sm",
                                            autoGenerate ? "right-1" : "left-1"
                                        )} />
                                    </button>
                                </div>
                                <p className="text-sm text-secondary-gray-500">
                                    Quando ativado, a IA analisará automaticamente as conversas e gerará resumos e insights periódicos.
                                </p>

                            </div>

                            <div className="space-y-4 pt-4 border-t border-white/5">
                                <div className="flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-brand-500" />
                                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Definição de Alertas</h3>
                                </div>
                                <p className="text-sm text-secondary-gray-500">
                                    Instrua a IA sobre o que deve ser considerado um "Alerta" na sua organização.
                                </p>
                                <textarea
                                    value={alertInstructions}
                                    onChange={(e) => setAlertInstructions(e.target.value)}
                                    placeholder="Ex: Considere alerta qualquer menção a cancelamento, problemas jurídicos ou reclamações sobre preços. Ignore reclamações pontuais sobre bugs já conhecidos."
                                    className="w-full h-32 bg-navy-950 border border-white/5 rounded-2xl p-4 text-white focus:outline-none focus:border-brand-500 transition-all text-sm placeholder:text-secondary-gray-700 shadow-inner resize-none leading-relaxed"
                                />
                            </div>

                            <div className="space-y-4 pt-4 border-t border-white/5">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-brand-500" />
                                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Agendamento de Resumos</h3>
                                </div>
                                <p className="text-sm text-secondary-gray-500">
                                    Defina quando você deseja receber os resumos automáticos dos seus grupos.
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-secondary-gray-500 ml-1">Horário de Envio</label>
                                        <input
                                            type="time"
                                            value={summaryTime}
                                            onChange={(e) => setSummaryTime(e.target.value)}
                                            className="w-full bg-navy-950 border border-white/5 rounded-2xl p-4 text-white focus:outline-none focus:border-brand-500 transition-all font-bold shadow-inner"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-secondary-gray-500 ml-1">Dias da Semana</label>
                                        <div className="flex flex-wrap gap-2">
                                            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, idx) => (
                                                <button
                                                    key={day}
                                                    type="button"
                                                    onClick={() => toggleDay(idx)}
                                                    className={cn(
                                                        "w-10 h-10 rounded-xl text-xs font-bold transition-all border",
                                                        summaryDays.includes(idx)
                                                            ? "bg-brand-500 text-white border-brand-500 shadow-lg shadow-brand-500/20"
                                                            : "bg-navy-900 text-secondary-gray-600 border-white/5 hover:border-white/10 hover:text-white"
                                                    )}
                                                >
                                                    {day}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6 pt-6 border-t border-white/5">
                                <div className="flex items-center gap-2">
                                    <Bell className="h-4 w-4 text-brand-500" />
                                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Canais de Entrega</h3>
                                </div>
                                <p className="text-sm text-secondary-gray-500 font-medium">
                                    Escolha onde você deseja receber as notificações e resumos automatizados.
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4 p-6 bg-navy-950/50 rounded-2xl border border-white/5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                                    <User className="w-4 h-4 text-secondary-gray-600" />
                                                </div>
                                                <p className="text-xs font-black text-white uppercase tracking-tighter">Resumo por E-mail</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setEmailEnabled(!emailEnabled)}
                                                className={cn(
                                                    "w-10 h-5 rounded-full transition-all relative",
                                                    emailEnabled ? "bg-brand-500" : "bg-navy-800"
                                                )}
                                            >
                                                <div className={cn(
                                                    "absolute top-1 w-3 h-3 bg-white rounded-full transition-all shadow-sm",
                                                    emailEnabled ? "right-1" : "left-1"
                                                )} />
                                            </button>
                                        </div>
                                        <input
                                            type="email"
                                            value={notifEmail}
                                            onChange={(e) => setNotifEmail(e.target.value)}
                                            placeholder="nome@exemplo.com"
                                            className="w-full bg-navy-900 border border-white/5 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-brand-500 font-black placeholder:text-secondary-gray-700 shadow-inner"
                                        />
                                    </div>

                                    <div className="space-y-4 p-6 bg-navy-950/50 rounded-2xl border border-white/5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center border border-green-500/20">
                                                    <User className="w-4 h-4 text-secondary-gray-600" />
                                                </div>
                                                <p className="text-xs font-black text-white uppercase tracking-tighter">Resumo por WhatsApp</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setWhatsappEnabled(!whatsappEnabled)}
                                                className={cn(
                                                    "w-10 h-5 rounded-full transition-all relative",
                                                    whatsappEnabled ? "bg-brand-500" : "bg-navy-800"
                                                )}
                                            >
                                                <div className={cn(
                                                    "absolute top-1 w-3 h-3 bg-white rounded-full transition-all shadow-sm",
                                                    whatsappEnabled ? "right-1" : "left-1"
                                                )} />
                                            </button>
                                        </div>
                                        <input
                                            type="text"
                                            value={notifWhatsapp}
                                            onChange={(e) => setNotifWhatsapp(e.target.value)}
                                            placeholder="5511999999999"
                                            className="w-full bg-navy-900 border border-white/5 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-brand-500 font-black placeholder:text-secondary-gray-700 shadow-inner"
                                        />
                                    </div>
                                </div>
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

                    {/* Quick Access - HIDDEN as pages do not exist yet
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
                    */}
                </aside>
            </form >
        </div >
    );
}
