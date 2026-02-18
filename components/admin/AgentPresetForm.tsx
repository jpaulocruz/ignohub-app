"use client";

import { useState } from "react";
import { Save, Send, Phone, CheckCircle2, Link2, Power } from "lucide-react";
import { saveAgentPreset, togglePresetStatus } from "@/app/(admin)/assets/actions";
import { cn } from "@/lib/utils";

interface AgentPresetFormProps {
    preset: {
        id: string;
        name: string;
        telegram_bot_username?: string | null;
        whatsapp_support_number?: string | null;
        bot_link?: string | null;
        is_active: boolean | null;
    };
    groupCount?: number;
}

export function AgentPresetForm({ preset, groupCount = 0 }: AgentPresetFormProps) {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        telegram_bot_username: preset.telegram_bot_username || "",
        whatsapp_support_number: preset.whatsapp_support_number || "",
        bot_link: preset.bot_link || "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await saveAgentPreset({
                id: preset.id,
                ...formData,
                is_active: preset.is_active ?? true,
            });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            console.error(error);
            alert("Erro ao salvar Preset.");
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async () => {
        setLoading(true);
        try {
            await togglePresetStatus(preset.id, preset.is_active ?? false);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h4 className="text-lg font-black text-white">{preset.name}</h4>
                    {groupCount > 0 && (
                        <span className="px-2.5 py-1 bg-brand-500/10 text-brand-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-brand-500/20">
                            {groupCount} grupo{groupCount !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <div className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                        preset.is_active
                            ? "bg-green-500/10 text-green-500 border border-green-500/20"
                            : "bg-red-500/10 text-red-500 border border-red-500/20"
                    )}>
                        {preset.is_active ? "Ativo" : "Inativo"}
                    </div>
                    <button
                        type="button"
                        onClick={handleToggle}
                        disabled={loading}
                        className="p-2 rounded-xl border border-white/5 text-secondary-gray-500 hover:text-yellow-500 hover:bg-yellow-500/10 transition-all"
                        title={preset.is_active ? "Desativar" : "Ativar"}
                    >
                        <Power className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-secondary-gray-500 ml-1">Username Telegram</label>
                        <div className="relative group">
                            <Send className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-gray-600 group-focus-within:text-brand-500 transition-colors" />
                            <input
                                type="text"
                                value={formData.telegram_bot_username}
                                onChange={(e) => setFormData(prev => ({ ...prev, telegram_bot_username: e.target.value }))}
                                className="w-full bg-navy-950 border border-white/5 rounded-2xl p-3.5 pl-12 text-white focus:outline-none focus:border-brand-500 transition-all font-bold placeholder:text-secondary-gray-700 text-sm"
                                placeholder="@meu_bot"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-secondary-gray-500 ml-1">WhatsApp Suporte</label>
                        <div className="relative group">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-gray-600 group-focus-within:text-brand-500 transition-colors" />
                            <input
                                type="text"
                                value={formData.whatsapp_support_number}
                                onChange={(e) => setFormData(prev => ({ ...prev, whatsapp_support_number: e.target.value }))}
                                className="w-full bg-navy-950 border border-white/5 rounded-2xl p-3.5 pl-12 text-white focus:outline-none focus:border-brand-500 transition-all font-bold placeholder:text-secondary-gray-700 text-sm"
                                placeholder="+55 11 99999-9999"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-secondary-gray-500 ml-1">Link do Bot</label>
                    <div className="relative group">
                        <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-gray-600 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            value={formData.bot_link}
                            onChange={(e) => setFormData(prev => ({ ...prev, bot_link: e.target.value }))}
                            className="w-full bg-navy-950 border border-white/5 rounded-2xl p-3.5 pl-12 text-white focus:outline-none focus:border-blue-500 transition-all font-bold placeholder:text-secondary-gray-700 text-sm"
                            placeholder="t.me/ignohub_bot"
                        />
                    </div>
                    {formData.bot_link && (
                        <a
                            href={formData.bot_link.startsWith("http") ? formData.bot_link : `https://${formData.bot_link}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-400 hover:text-blue-300 transition-colors ml-1 mt-1"
                        >
                            <Link2 className="h-3 w-3" />
                            Abrir link
                        </a>
                    )}
                </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                className={cn(
                    "w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 border border-white/5",
                    success
                        ? "bg-green-500/10 text-green-500 border-green-500/20"
                        : "bg-navy-800 text-white hover:bg-navy-700 active:scale-[0.98]"
                )}
            >
                {loading ? (
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : success ? (
                    <>
                        <CheckCircle2 className="h-4 w-4" />
                        Preset Atualizado
                    </>
                ) : (
                    <>
                        <Save className="h-4 w-4" />
                        Salvar Preset
                    </>
                )}
            </button>
        </form>
    );
}
