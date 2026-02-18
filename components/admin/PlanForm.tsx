"use client";

import { useState } from "react";
import { Save, Layers, Clock, DollarSign, CheckCircle2, RefreshCw } from "lucide-react";
import { updatePlanConfig } from "@/app/(admin)/plans/actions";
import { cn } from "@/lib/utils";

interface PlanFormProps {
    plan: {
        id: string;
        name: string;
        description: string | null;
        max_groups: number | null;
        retention_days: number;
        price_monthly: number;
        stripe_price_id?: string | null;
    };
}

export function PlanForm({ plan }: PlanFormProps) {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        name: plan.name,
        description: plan.description || "",
        max_groups: plan.max_groups?.toString() || "0",
        retention_days: plan.retention_days,
        price_monthly: Number(plan.price_monthly),
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await updatePlanConfig(plan.id, {
                ...formData,
                max_groups: formData.max_groups === "" ? null : parseInt(formData.max_groups)
            });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            console.error(error);
            alert("Erro ao salvar plano.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center justify-between mb-4">
                <h4 className="text-xl font-black text-white">{plan.name}</h4>
                {plan.stripe_price_id ? (
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-500 border border-green-500/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                        <CheckCircle2 className="h-3 w-3" />
                        Sync Stripe OK
                    </div>
                ) : (
                    <div className="px-3 py-1 bg-secondary-gray-500/10 text-secondary-gray-500 border border-secondary-gray-500/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                        Local Only
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-secondary-gray-500 ml-1">Máximo de Grupos</label>
                    <div className="relative group">
                        <Layers className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-gray-600 group-focus-within:text-brand-500 transition-colors" />
                        <input
                            type="number"
                            required
                            value={formData.max_groups}
                            onChange={(e) => setFormData(prev => ({ ...prev, max_groups: e.target.value }))}
                            className="w-full bg-navy-950 border border-white/5 rounded-2xl p-4 pl-12 text-white focus:outline-none focus:border-brand-500 transition-all font-bold"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-secondary-gray-500 ml-1">Retenção (Dias)</label>
                    <div className="relative group">
                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-gray-600 group-focus-within:text-brand-500 transition-colors" />
                        <input
                            type="number"
                            required
                            value={formData.retention_days}
                            onChange={(e) => setFormData(prev => ({ ...prev, retention_days: parseInt(e.target.value) || 0 }))}
                            className="w-full bg-navy-950 border border-white/5 rounded-2xl p-4 pl-12 text-white focus:outline-none focus:border-brand-500 transition-all font-bold"
                        />
                    </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-secondary-gray-500 ml-1">Preço Mensal (R$)</label>
                    <div className="relative group">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-gray-600 group-focus-within:text-brand-500 transition-colors" />
                        <input
                            type="number"
                            required
                            step="0.01"
                            value={formData.price_monthly}
                            onChange={(e) => setFormData(prev => ({ ...prev, price_monthly: parseFloat(e.target.value) }))}
                            className="w-full bg-navy-950 border border-white/5 rounded-2xl p-4 pl-12 text-white focus:outline-none focus:border-brand-500 transition-all font-bold"
                        />
                    </div>
                </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                className={cn(
                    "w-full py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 shadow-xl",
                    success
                        ? "bg-green-500 text-white"
                        : "bg-brand-500 text-white hover:scale-[1.01] active:scale-95"
                )}
            >
                {loading ? (
                    <RefreshCw className="h-5 w-5 animate-spin" />
                ) : success ? (
                    <>
                        <CheckCircle2 className="h-5 w-5" />
                        Configurações Salvas e Sincronizadas
                    </>
                ) : (
                    <>
                        <Save className="h-5 w-5" />
                        Atualizar Plano
                    </>
                )}
            </button>

            <p className="text-[10px] text-center text-secondary-gray-500 font-bold uppercase tracking-widest px-4">
                As alterações de preço e regras são enviadas automaticamente para o Stripe.
            </p>
        </form>
    );
}
