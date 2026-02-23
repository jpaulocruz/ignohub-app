"use client";

import { useEffect, useState } from "react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { useOrganization } from "@/hooks/use-organization";
import { createClient } from "@/lib/supabase/client";
import {
    User, Building2, Settings, Bell, Shield, Save,
    CheckCircle2, AlertCircle, Clock, Zap, Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useTranslations } from "next-intl";

export default function SettingsPage() {
    const { organization, refresh } = useOrganization();
    const t = useTranslations("settings");
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
                    const p = profileData as any;
                    setProfile(p);
                    setFullName(p.full_name || "");
                    setJobTitle(p.job_title || "");
                    setPhone(p.phone || "");
                    setBio(p.bio || "");
                    setAvatarUrl(p.avatar_url || "");
                }

                if (organization) {
                    const org = organization as any;
                    setOrgName(org.name || "");
                    if (org.summary_schedule_time) setSummaryTime(org.summary_schedule_time);
                    if (org.summary_delivery_days) {
                        setSummaryDays(normalizeDays(org.summary_delivery_days));
                    }
                    if (org.alert_instructions) setAlertInstructions(org.alert_instructions);
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
            <div className="space-y-6 animate-pulse pb-12">
                <div className="h-8 w-1/4 bg-muted rounded-lg" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="h-80 bg-muted rounded-xl" />
                    <div className="h-48 bg-muted rounded-xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-12 pb-32">
            <header className="space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
                <p className="text-sm text-muted-foreground">
                    {t('subtitle')}
                </p>
            </header>

            <AnimatePresence>
                {status && (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className={cn(
                            "p-3 rounded-lg flex items-center gap-3 border",
                            status.type === 'success'
                                ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400"
                                : "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
                        )}
                    >
                        <p className="text-sm font-medium">{status.message}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
                <div className="lg:col-span-2 space-y-10">
                    {/* User Profile Section */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-2 mb-4">
                            <User className="h-4 w-4 text-primary" />
                            <h2 className="text-base font-semibold">Profile</h2>
                        </div>

                        <PremiumCard className="p-6 space-y-6">
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
                                        className="w-20 h-20 rounded-full bg-muted border border-border flex items-center justify-center relative group cursor-pointer overflow-hidden hover:border-primary/50 transition-colors"
                                    >
                                        {avatarUrl ? (
                                            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="h-7 w-7 text-muted-foreground group-hover:text-primary transition-colors" />
                                        )}
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <p className="text-xs font-medium text-white">Update</p>
                                        </div>
                                    </label>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 w-full">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-muted-foreground">Full Legal Name</Label>
                                        <Input
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            placeholder="Your full name"
                                            className="focus-visible:ring-primary"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-muted-foreground">Operational Role</Label>
                                        <Input
                                            type="text"
                                            value={jobTitle}
                                            onChange={(e) => setJobTitle(e.target.value)}
                                            placeholder="e.g. Community Manager"
                                            className="focus-visible:ring-primary"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-muted-foreground">Comm Link (Phone)</Label>
                                        <Input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="+00 00 00000-0000"
                                            className="focus-visible:ring-primary"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-muted-foreground">Terminal Address</Label>
                                        <Input
                                            type="email"
                                            disabled
                                            value={profile?.email || ""}
                                            className="opacity-50 cursor-not-allowed"
                                        />
                                    </div>
                                    <div className="col-span-full space-y-2">
                                        <Label className="text-sm font-medium text-muted-foreground">Operational Bio</Label>
                                        <Textarea
                                            value={bio}
                                            onChange={(e) => setBio(e.target.value)}
                                            placeholder="Bio"
                                            className="h-24 text-sm resize-none focus-visible:ring-primary"
                                        />
                                    </div>
                                </div>
                            </div>
                        </PremiumCard>
                    </section>

                    {/* Organization Section */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Building2 className="h-4 w-4 text-primary" />
                            <h2 className="text-base font-semibold">Organization</h2>
                        </div>

                        <PremiumCard className="p-6 space-y-6">
                            <div className="space-y-2 max-w-md">
                                <Label className="text-sm font-medium text-muted-foreground">Organization name</Label>
                                <Input
                                    type="text"
                                    value={orgName}
                                    onChange={(e) => setOrgName(e.target.value)}
                                    placeholder="Your organization name"
                                    className="focus-visible:ring-primary max-w-md"
                                />
                            </div>

                            <div className="space-y-4 pt-4 border-t border-border">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Zap className="h-4 w-4 text-primary" />
                                        <h3 className="text-sm font-medium">Auto-generate insights</h3>
                                    </div>
                                    <Switch
                                        checked={autoGenerate}
                                        onCheckedChange={setAutoGenerate}
                                        className="data-[state=checked]:bg-primary"
                                    />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    When enabled, AI will automatically analyze conversations and generate periodic summaries and insights.
                                </p>

                            </div>

                            <div className="space-y-4 pt-4 border-t border-border">
                                <div className="flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-primary" />
                                    <h3 className="text-sm font-medium">Alert definition</h3>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Instruct the AI on what should be considered an alert in your organization.
                                </p>
                                <Textarea
                                    value={alertInstructions}
                                    onChange={(e) => setAlertInstructions(e.target.value)}
                                    placeholder="E.g. Flag any discussions about competitor products or negative brand mentions..."
                                    className="h-32 text-sm resize-none focus-visible:ring-primary"
                                />
                            </div>

                            <div className="space-y-4 pt-4 border-t border-border">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-primary" />
                                    <h3 className="text-sm font-medium">Summary schedule</h3>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Set when you want to receive automatic summaries of your communities.
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-muted-foreground">Send time</Label>
                                        <Input
                                            type="time"
                                            value={summaryTime}
                                            onChange={(e) => setSummaryTime(e.target.value)}
                                            className="focus-visible:ring-primary"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-muted-foreground">Days of the week</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
                                                <Button
                                                    key={day}
                                                    type="button"
                                                    variant={summaryDays.includes(idx) ? "default" : "outline"}
                                                    size="icon"
                                                    onClick={() => toggleDay(idx)}
                                                    className="w-10 h-10 text-xs font-medium"
                                                >
                                                    {day.slice(0, 2)}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-border">
                                <div className="flex items-center gap-2">
                                    <Bell className="h-4 w-4 text-primary" />
                                    <h3 className="text-sm font-medium">Delivery channels</h3>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Choose where you want to receive automated summaries and notifications.
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-3 p-4 rounded-lg border border-border bg-muted/30">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
                                                    <User className="w-3.5 h-3.5 text-primary" />
                                                </div>
                                                <p className="text-sm font-medium">Email summary</p>
                                            </div>
                                            <Switch
                                                checked={emailEnabled}
                                                onCheckedChange={setEmailEnabled}
                                                className="data-[state=checked]:bg-primary"
                                            />
                                        </div>
                                        <Input
                                            type="email"
                                            value={notifEmail}
                                            onChange={(e) => setNotifEmail(e.target.value)}
                                            placeholder="notifications@example.com"
                                            className="text-sm focus-visible:ring-primary"
                                        />
                                    </div>

                                    <div className="space-y-3 p-4 rounded-lg border border-border bg-muted/30">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-md bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                                    <User className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                                                </div>
                                                <p className="text-sm font-medium">WhatsApp summary</p>
                                            </div>
                                            <Switch
                                                checked={whatsappEnabled}
                                                onCheckedChange={setWhatsappEnabled}
                                                className="data-[state=checked]:bg-primary"
                                            />
                                        </div>
                                        <Input
                                            type="text"
                                            value={notifWhatsapp}
                                            onChange={(e) => setNotifWhatsapp(e.target.value)}
                                            placeholder="WhatsApp number or WABA ID"
                                            className="text-sm focus-visible:ring-primary"
                                        />
                                    </div>
                                </div>
                            </div>
                        </PremiumCard>
                    </section>
                </div>

                <aside className="space-y-10 lg:sticky lg:top-24">
                    {/* Action Card */}
                    <PremiumCard className="p-6 space-y-4">
                        <div className="space-y-1">
                            <h3 className="text-base font-semibold">Save changes</h3>
                            <p className="text-sm text-muted-foreground">Changes will apply immediately across your workspace.</p>
                        </div>
                        <Button
                            type="submit"
                            disabled={saving}
                            className="w-full"
                        >
                            {saving ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Save className="h-4 w-4 mr-2" />
                            )}
                            {saving ? t('saving') : t('save_changes')}
                        </Button>
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
