"use client";

import { useState, useEffect } from "react";
import { useOrganization } from "@/hooks/use-organization";
import { createClient } from "@/lib/supabase/client";
import { OnboardingWizard } from "@/components/groups/onboarding-wizard";
import { PremiumCard } from "@/components/ui/PremiumCard";
import {
    MessageSquare,
    Plus,
    MoreHorizontal,
    Shield,
    Search,
    Eye,
    Users,
    Trash2,
    Globe,
    Settings2,
    Activity
} from "lucide-react";
import { deleteGroupAction } from "./actions";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function GroupsPage() {
    const { organization, loading: orgLoading } = useOrganization();
    const [groups, setGroups] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showWizard, setShowWizard] = useState(false);
    const supabase = createClient();

    const fetchGroups = async () => {
        if (!organization) return;
        setLoading(true);
        const { data } = await (supabase as any)
            .from("groups")
            .select(`
                *,
                agent_presets(name, icon),
                group_agents(status)
            `)
            .eq("organization_id", organization.id)
            .order("created_at", { ascending: false });

        setGroups(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchGroups();
    }, [organization]);

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir este grupo?")) return;
        await deleteGroupAction(id);
        fetchGroups();
    };

    if (orgLoading) return <div className="animate-pulse h-screen bg-navy-900" />;

    return (
        <div className="space-y-10 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-extrabold text-white tracking-tight">Comunidades</h1>
                    <p className="text-secondary-gray-500 font-medium">Controle e escale seu monitoramento de grupos.</p>
                </div>
                <button
                    onClick={() => setShowWizard(true)}
                    className="flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-bold py-3.5 px-8 rounded-2xl transition-all shadow-lg shadow-brand-500/20 active:scale-95 whitespace-nowrap"
                >
                    <Plus className="h-5 w-5" />
                    ADICIONAR GRUPO
                </button>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-64 rounded-[30px] bg-navy-800 animate-pulse border border-white/5" />
                    ))}
                </div>
            ) : groups.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-32 bg-navy-800/50 border border-white/5 border-dashed rounded-premium space-y-8"
                >
                    <div className="w-24 h-24 rounded-3xl bg-navy-900 flex items-center justify-center shadow-inner">
                        <Globe className="h-10 w-10 text-secondary-gray-600" />
                    </div>
                    <div className="text-center space-y-2">
                        <h3 className="text-2xl font-bold text-white">Pronto para começar?</h3>
                        <p className="text-secondary-gray-500 text-sm max-w-xs mx-auto">
                            Sua central de inteligência está vazia. Conecte seu primeiro grupo do WhatsApp ou Telegram agora.
                        </p>
                    </div>
                    <button
                        onClick={() => setShowWizard(true)}
                        className="text-brand-500 font-black text-xs tracking-[0.2em] uppercase hover:text-brand-400 flex items-center gap-2 group transition-all"
                    >
                        Configurar Primeiro Grupo <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform" />
                    </button>
                </motion.div>
            ) : (
                <div className="space-y-6">
                    {/* Stats Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <PremiumCard className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-500">
                                    <Activity className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-secondary-gray-500 tracking-widest">Grupos Ativos</p>
                                    <p className="text-2xl font-bold text-white">{groups.filter(g => g.group_agents?.[0]?.status === 'active').length}</p>
                                </div>
                            </div>
                        </PremiumCard>
                        <PremiumCard className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500">
                                    <Users className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-secondary-gray-500 tracking-widest">Total de Audiência</p>
                                    <p className="text-2xl font-bold text-white">--</p>
                                </div>
                            </div>
                        </PremiumCard>
                        <PremiumCard className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                                    <Settings2 className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-secondary-gray-500 tracking-widest">Agentes Configurados</p>
                                    <p className="text-2xl font-bold text-white">{groups.length}</p>
                                </div>
                            </div>
                        </PremiumCard>
                    </div>

                    {/* Table View */}
                    <div className="overflow-x-auto pb-6">
                        <table className="w-full text-left border-separate border-spacing-y-4">
                            <thead>
                                <tr className="text-[10px] font-black uppercase tracking-widest text-secondary-gray-500">
                                    <th className="px-8 pb-2">Identificação</th>
                                    <th className="px-8 pb-2">Plataforma</th>
                                    <th className="px-8 pb-2">IA Especialista</th>
                                    <th className="px-8 pb-2">Status</th>
                                    <th className="px-8 pb-2 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="space-y-4">
                                <AnimatePresence>
                                    {groups.map((group, idx) => (
                                        <motion.tr
                                            key={group.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="group bg-navy-800/40 border-y border-white/5 hover:bg-navy-800/80 transition-all premium-shadow"
                                        >
                                            <td className="px-8 py-6 rounded-l-premium border-y border-l border-white/5">
                                                <div className="font-bold text-white text-lg tracking-tight leading-none mb-2">{group.name}</div>
                                                <div className="text-[9px] text-secondary-gray-600 font-mono tracking-tighter opacity-70 uppercase">ID: {group.id.slice(0, 18)}...</div>
                                            </td>
                                            <td className="px-8 py-6 border-y border-white/5">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-10 h-10 rounded-xl flex items-center justify-center border",
                                                        group.platform === 'whatsapp' ? "bg-green-500/10 border-green-500/20 text-green-500" : "bg-blue-500/10 border-blue-500/20 text-blue-500"
                                                    )}>
                                                        {group.platform === 'whatsapp' ? (
                                                            <span className="text-[10px] font-black">WA</span>
                                                        ) : (
                                                            <span className="text-[10px] font-black">TG</span>
                                                        )}
                                                    </div>
                                                    <span className="text-sm font-bold text-secondary-gray-400 capitalize">{group.platform}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 border-y border-white/5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-500 border border-brand-500/20 shadow-inner">
                                                        {group.agent_presets?.name === 'Sentinel' && <Shield className="h-4 w-4" />}
                                                        {group.agent_presets?.name === 'Hunter' && <Search className="h-4 w-4" />}
                                                        {group.agent_presets?.name === 'Observer' && <Eye className="h-4 w-4" />}
                                                        {group.agent_presets?.name === 'Concierge' && <Users className="h-4 w-4" />}
                                                        {!group.agent_presets?.name && <Activity className="h-4 w-4" />}
                                                    </div>
                                                    <span className="text-sm font-bold text-white">{group.agent_presets?.name || 'Padrão'}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 border-y border-white/5">
                                                <div className="flex items-center gap-2">
                                                    <div className={cn(
                                                        "w-2 h-2 rounded-full",
                                                        group.group_agents?.[0]?.status === 'active' ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" : "bg-secondary-gray-700"
                                                    )} />
                                                    <span className={cn(
                                                        "text-[10px] font-black tracking-widest uppercase",
                                                        group.group_agents?.[0]?.status === 'active' ? "text-green-500" : "text-secondary-gray-600"
                                                    )}>
                                                        {group.group_agents?.[0]?.status === 'active' ? 'Ativo' : 'Pendente'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 rounded-r-premium border-y border-r border-white/5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button className="p-3 bg-navy-900 border border-white/5 text-secondary-gray-500 hover:text-white hover:border-white/10 rounded-xl transition-all shadow-inner group/btn">
                                                        <Settings2 className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(group.id)}
                                                        className="p-3 bg-navy-900 border border-white/5 text-secondary-gray-500 hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/20 rounded-xl transition-all shadow-inner"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {showWizard && organization && (
                <OnboardingWizard
                    organizationId={organization.id}
                    onClose={() => setShowWizard(false)}
                    onSuccess={fetchGroups}
                />
            )}
        </div>
    );
}
