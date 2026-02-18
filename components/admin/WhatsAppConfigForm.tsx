"use client";

import { useState } from "react";
import { Save, Smartphone, Hash, Key, CheckCircle2, Phone, Trash2, Power } from "lucide-react";
import { saveWhatsAppConfig, deleteWhatsAppConfig, toggleWhatsAppStatus } from "@/app/(admin)/assets/actions";
import { cn } from "@/lib/utils";

interface WhatsAppConfigFormProps {
    initialData?: {
        id: string;
        phone_number_id: string;
        waba_id: string;
        access_token_encrypted: string;
        display_number?: string | null;
        is_active: boolean | null;
        [key: string]: unknown;
    };
    groupCount?: number;
    isNew?: boolean;
}

export function WhatsAppConfigForm({ initialData, groupCount = 0, isNew = false }: WhatsAppConfigFormProps) {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        phone_number_id: initialData?.phone_number_id || "",
        waba_id: initialData?.waba_id || "",
        access_token: initialData?.access_token_encrypted || "",
        display_number: initialData?.display_number || "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await saveWhatsAppConfig({
                id: initialData?.id,
                ...formData,
                is_active: initialData?.is_active ?? true,
            });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            console.error(error);
            alert("Erro ao salvar configuração de WhatsApp.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!initialData?.id) return;
        if (!confirm("Tem certeza que deseja excluir esta configuração?")) return;
        setLoading(true);
        try {
            await deleteWhatsAppConfig(initialData.id);
        } catch (error) {
            console.error(error);
            alert("Erro ao excluir.");
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async () => {
        if (!initialData?.id) return;
        setLoading(true);
        try {
            await toggleWhatsAppStatus(initialData.id, initialData.is_active ?? false);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Header with status + actions */}
            {!isNew && initialData && (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "h-2.5 w-2.5 rounded-full",
                            initialData.is_active ? "bg-green-500 animate-pulse" : "bg-red-500"
                        )} />
                        <span className={cn(
                            "text-[10px] font-black uppercase tracking-widest",
                            initialData.is_active ? "text-green-500" : "text-red-500"
                        )}>
                            {initialData.is_active ? "Ativo" : "Inativo"}
                        </span>
                        {groupCount > 0 && (
                            <span className="px-2.5 py-1 bg-brand-500/10 text-brand-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-brand-500/20">
                                {groupCount} grupo{groupCount !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleToggle}
                            disabled={loading}
                            className="p-2 rounded-xl border border-white/5 text-secondary-gray-500 hover:text-yellow-500 hover:bg-yellow-500/10 transition-all"
                            title={initialData.is_active ? "Desativar" : "Ativar"}
                        >
                            <Power className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={loading}
                            className="p-2 rounded-xl border border-white/5 text-secondary-gray-500 hover:text-red-500 hover:bg-red-500/10 transition-all"
                            title="Excluir"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-secondary-gray-500 ml-1">Número de Exibição</label>
                    <div className="relative group">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-gray-600 group-focus-within:text-green-500 transition-colors" />
                        <input
                            type="text"
                            value={formData.display_number}
                            onChange={(e) => setFormData(prev => ({ ...prev, display_number: e.target.value }))}
                            className="w-full bg-navy-950 border border-white/5 rounded-2xl p-4 pl-12 text-white focus:outline-none focus:border-green-500 transition-all font-bold placeholder:text-secondary-gray-700 text-sm"
                            placeholder="+55 11 99999-9999"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-secondary-gray-500 ml-1">Phone Number ID</label>
                    <div className="relative group">
                        <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-gray-600 group-focus-within:text-brand-500 transition-colors" />
                        <input
                            type="text"
                            required
                            value={formData.phone_number_id}
                            onChange={(e) => setFormData(prev => ({ ...prev, phone_number_id: e.target.value }))}
                            className="w-full bg-navy-950 border border-white/5 rounded-2xl p-4 pl-12 text-white focus:outline-none focus:border-brand-500 transition-all font-bold placeholder:text-secondary-gray-700 text-sm"
                            placeholder="1029384756..."
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-secondary-gray-500 ml-1">WABA ID</label>
                    <div className="relative group">
                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-gray-600 group-focus-within:text-brand-500 transition-colors" />
                        <input
                            type="text"
                            required
                            value={formData.waba_id}
                            onChange={(e) => setFormData(prev => ({ ...prev, waba_id: e.target.value }))}
                            className="w-full bg-navy-950 border border-white/5 rounded-2xl p-4 pl-12 text-white focus:outline-none focus:border-brand-500 transition-all font-bold placeholder:text-secondary-gray-700 text-sm"
                            placeholder="WhatsApp Business Account ID"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-secondary-gray-500 ml-1">Access Token</label>
                    <div className="relative group">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-gray-600 group-focus-within:text-brand-500 transition-colors" />
                        <input
                            type="password"
                            required
                            value={formData.access_token}
                            onChange={(e) => setFormData(prev => ({ ...prev, access_token: e.target.value }))}
                            className="w-full bg-navy-950 border border-white/5 rounded-2xl p-4 pl-12 text-white focus:outline-none focus:border-brand-500 transition-all font-bold placeholder:text-secondary-gray-700 text-sm"
                            placeholder="EAAB..."
                        />
                    </div>
                </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                className={cn(
                    "w-full py-3.5 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 shadow-lg",
                    success
                        ? "bg-green-500 text-white shadow-green-500/20"
                        : "bg-green-600 text-white shadow-green-600/20 hover:bg-green-500 hover:scale-[1.01] active:scale-95"
                )}
            >
                {loading ? (
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : success ? (
                    <>
                        <CheckCircle2 className="h-5 w-5" />
                        Salvo com Sucesso
                    </>
                ) : (
                    <>
                        <Save className="h-5 w-5" />
                        {isNew ? "Cadastrar Número" : "Atualizar Credenciais"}
                    </>
                )}
            </button>
        </form>
    );
}
