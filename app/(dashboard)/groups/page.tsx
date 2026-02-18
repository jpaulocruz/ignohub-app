"use client";

import { useState, useEffect } from "react";
import { useOrganization } from "@/hooks/use-organization";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PremiumCard } from "@/components/ui/PremiumCard";
import {
    Plus,
    Shield,
    Search,
    Eye,
    Users,
    Trash2,
    Globe,
    Settings2,
    Activity,
    MessageSquare,
    Copy,
    Check,
    AlertTriangle,
    Clock
} from "lucide-react";
import { deleteGroupAction, updateGroupAction, verifyGroupConnection, getGroupVerificationCode } from "./actions";
import { X, Save, RefreshCw, Radio, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function GroupsPage() {
    const { organization, loading: orgLoading } = useOrganization();
    const router = useRouter();
    const [groups, setGroups] = useState<any[]>([]);
    const [editingGroup, setEditingGroup] = useState<any | null>(null);
    const [verifying, setVerifying] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [verificationCode, setVerificationCode] = useState<string | null>(null);
    const [loadingCode, setLoadingCode] = useState(false);
    const [copied, setCopied] = useState(false);
    const supabase = createClient();

    const fetchGroups = async () => {
        if (!organization) return;
        setLoading(true);

        // 1. Fetch Groups
        const { data: groupsData, error } = await supabase
            .from("groups")
            .select("*")
            .eq("organization_id", organization.id)
            .order("created_at", { ascending: false });

        if (error || !groupsData) {
            console.error("Error fetching groups:", error);
            setLoading(false);
            return;
        }

        // 2. Fetch related data (Presets & Agents)
        const presetIds = groupsData.map(g => g.preset_id).filter(Boolean);
        const groupIds = groupsData.map(g => g.id);

        const presetsQuery = presetIds.length > 0 ? supabase.from("agent_presets").select("id, name, icon").in("id", presetIds) : Promise.resolve({ data: [] as any[], error: null });
        const agentsQuery = groupIds.length > 0 ? supabase.from("group_agents").select("group_id, status").in("group_id", groupIds) : Promise.resolve({ data: [] as any[], error: null });

        const [presetsRes, agentsRes] = await Promise.all([presetsQuery, agentsQuery]);

        // 3. Merge Data
        const merged = groupsData.map(group => {
            const preset = presetsRes.data?.find((p: any) => p.id === group.preset_id);
            const agent = agentsRes.data?.find((a: any) => a.group_id === group.id);

            return {
                ...group,
                agent_presets: preset ? { name: preset.name, icon: preset.icon } : null,
                group_agents: agent ? [{ status: agent.status }] : []
            };
        });

        setGroups(merged);
        setLoading(false);
    };

    useEffect(() => {
        fetchGroups();
    }, [organization]);

    useEffect(() => {
        if (editingGroup) {
            setConnectionStatus(null);
            setVerificationCode(null);

            // If group is pending (no JID), fetch/generate code
            if (!editingGroup.jid) {
                fetchVerificationCode(editingGroup.id);
            }
        }
    }, [editingGroup]);

    const fetchVerificationCode = async (groupId: string) => {
        setLoadingCode(true);
        const res = await getGroupVerificationCode(groupId);
        if (res.code) {
            setVerificationCode(res.code);
        }
        setLoadingCode(false);
    };

    const handleCopyCode = () => {
        if (verificationCode) {
            navigator.clipboard.writeText(verificationCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleDelete = async (group: any) => {
        const isActive = group.is_active;

        if (isActive) {
            if (!confirm("⚠️ ATENÇÃO: Este grupo está ATIVO e sendo monitorado.\n\nA exclusão irá:\n1. Interromper imediatamente o serviço.\n2. Remover todos os logs e mensagens processadas.\n3. Desconectar o Agente.\n\nTem certeza ABSOLUTA que deseja continuar?")) return;
        } else {
            if (!confirm("Tem certeza que deseja excluir este grupo?")) return;
        }

        const res = await deleteGroupAction(group.id);
        if (res.error) {
            alert(`Erro ao excluir: ${res.error}`);
        } else {
            fetchGroups();
        }
    };

    const handleSaveEdit = async () => {
        if (!editingGroup) return;
        const res = await updateGroupAction(editingGroup.id, {
            name: editingGroup.name,
            description: editingGroup.description
        });
        if (res.error) {
            alert(`Erro ao atualizar: ${res.error}`);
        } else {
            setEditingGroup(null);
            fetchGroups();
        }
    };

    const handleVerifyConnection = async (groupId: string) => {
        setVerifying(true);
        // We verify logic primarily by checking if DB has JID now
        // But we can re-fetch the group to see if webhook updated it
        const { data } = await (supabase as any)
            .from("groups")
            .select('jid, is_active')
            .eq('id', groupId)
            .single();

        setVerifying(false);

        if (data && data.jid && data.is_active) {
            setConnectionStatus('Conectado');
            // Update local state to reflect change immediately
            setEditingGroup(prev => ({ ...prev, jid: data.jid, is_active: true }));
            fetchGroups(); // Refresh list background
        } else {
            setConnectionStatus('Pendente');
        }
    };

    // Polling for connection status
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (editingGroup && !editingGroup.jid) {
            interval = setInterval(async () => {
                const { data } = await (supabase as any)
                    .from("groups")
                    .select('jid, is_active')
                    .eq('id', editingGroup.id)
                    .single();

                if (data && data.jid && data.is_active) {
                    setEditingGroup((prev: any) => ({ ...prev, jid: data.jid, is_active: true }));
                    setConnectionStatus('Conectado');
                    fetchGroups(); // Refresh list background
                }
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [editingGroup]);


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
                    onClick={() => router.push("/onboarding")}
                    className="flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-bold py-3.5 px-8 rounded-2xl transition-all shadow-lg shadow-brand-500/20 active:scale-95 whitespace-nowrap cursor-pointer"
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
                        onClick={() => router.push("/onboarding")}
                        className="text-brand-500 font-black text-xs tracking-[0.2em] uppercase hover:text-brand-400 flex items-center gap-2 group transition-all cursor-pointer"
                    >
                        Configurar Primeiro Grupo <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform" />
                    </button>
                </motion.div>
            ) : (
                <div className="space-y-6">
                    {/* Stats Overview */}
                    <div className="p-6 bg-navy-950/30 rounded-[30px] border border-white/5 space-y-4">
                        <h2 className="text-[10px] font-black uppercase text-secondary-gray-500 tracking-widest px-2">Visão Geral</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <PremiumCard className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-500">
                                        <Activity className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-secondary-gray-500 tracking-widest">Grupos Ativos</p>
                                        <p className="text-2xl font-bold text-white">{groups.filter(g => g.is_active).length}</p>
                                    </div>
                                </div>
                            </PremiumCard>
                            <PremiumCard className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500">
                                        <MessageSquare className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-secondary-gray-500 tracking-widest">Monitoramento</p>
                                        <p className="text-2xl font-bold text-white">Ativo</p>
                                    </div>
                                </div>
                            </PremiumCard>
                            <PremiumCard className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                                        <Settings2 className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-secondary-gray-500 tracking-widest">Total</p>
                                        <p className="text-2xl font-bold text-white">{groups.length}</p>
                                    </div>
                                </div>
                            </PremiumCard>
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="overflow-x-auto pb-6">
                        <table className="w-full text-left border-separate border-spacing-y-4">
                            <thead>
                                <tr className="text-[10px] font-black uppercase tracking-widest text-secondary-gray-500">
                                    <th className="px-8 pb-2">Identificação</th>
                                    <th className="px-8 pb-2">Plataforma</th>
                                    <th className="px-8 pb-2">Status</th>
                                    <th className="px-8 pb-2">Última Atividade</th>
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
                                                {group.description && (
                                                    <div className="mt-2 text-xs text-secondary-gray-400 line-clamp-1 max-w-xs" title={group.description}>
                                                        {group.description}
                                                    </div>
                                                )}
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
                                                <div className="flex items-center gap-2">
                                                    {group.jid && group.is_active ? (
                                                        <>
                                                            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                                                            <span className="text-[10px] font-black tracking-widest uppercase text-green-500">
                                                                Conectado
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
                                                            <span className="text-[10px] font-black tracking-widest uppercase text-amber-500">
                                                                Pendente
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 border-y border-white/5">
                                                <div className="flex items-center gap-2 text-secondary-gray-400">
                                                    <Clock className="h-4 w-4" />
                                                    <span className="text-xs font-medium">
                                                        {group.last_message_at
                                                            ? formatDistanceToNow(new Date(group.last_message_at), { addSuffix: true, locale: ptBR })
                                                            : 'Nunca'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 rounded-r-premium border-y border-r border-white/5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => setEditingGroup(group)}
                                                        className="p-3 bg-navy-900 border border-white/5 text-secondary-gray-500 hover:text-white hover:border-white/10 rounded-xl transition-all shadow-inner group/btn cursor-pointer"
                                                    >
                                                        <Settings2 className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(group)}
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

            {/* Edit Modal */}
            <AnimatePresence>
                {editingGroup && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setEditingGroup(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-navy-900 border border-white/10 rounded-3xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-black text-white">
                                    {editingGroup.jid ? "Gerenciar Grupo" : "Conectar Novo Grupo"}
                                </h3>
                                <button onClick={() => setEditingGroup(null)} className="p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
                                    <X className="h-5 w-5 text-secondary-gray-400" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Connection Status Banner */}
                                {!editingGroup.jid && (
                                    <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden">

                                        <div className="flex items-start gap-4 z-10">
                                            <div className="p-3 bg-amber-500/20 rounded-xl shrink-0">
                                                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse absolute top-3 right-3" />
                                                <AlertTriangle className="h-6 w-6 text-amber-500" />
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="text-base font-bold text-white">Próximo Passo: Conectar Grupo</h4>
                                                <p className="text-xs text-secondary-gray-300 leading-relaxed">
                                                    1. Adicione o número da plataforma ao grupo.<br />
                                                    2. Envie o código abaixo para vincular automaticamente.
                                                </p>
                                            </div>
                                        </div>

                                        {loadingCode ? (
                                            <div className="flex items-center justify-center py-4 text-xs text-secondary-gray-500 italic">
                                                <RefreshCw className="h-4 w-4 animate-spin mr-2" /> Gerando código exclusivo...
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-3 z-10">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 flex items-center justify-center gap-3 group/code hover:border-amber-500/30 transition-colors">
                                                        <code className="text-emerald-400 font-mono text-lg font-bold tracking-widest">
                                                            {verificationCode || "Erro"}
                                                        </code>
                                                    </div>
                                                    <button
                                                        onClick={handleCopyCode}
                                                        className="h-full aspect-square bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-white flex items-center justify-center border border-white/5"
                                                        title="Copiar código"
                                                    >
                                                        {copied ? <Check className="h-5 w-5 text-emerald-500" /> : <Copy className="h-5 w-5" />}
                                                    </button>
                                                </div>
                                                <div className="flex items-center justify-center gap-2 text-[10px] text-amber-500/80 font-medium bg-amber-950/30 rounded-lg py-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                                    O sistema detectará a mensagem automaticamente.
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div>
                                    <label className="text-xs font-bold text-secondary-gray-400 uppercase tracking-wider block mb-2">Nome de Exibição</label>
                                    <input
                                        value={editingGroup.name}
                                        onChange={(e) => setEditingGroup({ ...editingGroup, name: e.target.value })}
                                        className="w-full bg-navy-950 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-secondary-gray-600 focus:outline-none focus:border-brand-500/50 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-secondary-gray-400 uppercase tracking-wider block mb-2">Objetivo / Descrição</label>
                                    <textarea
                                        value={editingGroup.description || ''}
                                        onChange={(e) => setEditingGroup({ ...editingGroup, description: e.target.value })}
                                        rows={3}
                                        className="w-full bg-navy-950 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-secondary-gray-600 focus:outline-none focus:border-brand-500/50 transition-colors resize-none"
                                        placeholder="Ex: Grupo de suporte para clientes VIP..."
                                    />
                                </div>

                                <div className="pt-4 border-t border-white/5">
                                    <div className="bg-navy-950 border border-white/5 rounded-xl p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-lg flex items-center justify-center border transition-colors duration-500",
                                                    editingGroup.jid && editingGroup.is_active ? "bg-green-500/10 border-green-500/20 text-green-500" :
                                                        "bg-navy-900 border-white/5 text-secondary-gray-500"
                                                )}>
                                                    {editingGroup.jid && editingGroup.is_active ? (
                                                        <CheckCircle2 className="h-5 w-5" />
                                                    ) : (
                                                        <Radio className="h-5 w-5 animate-pulse" />
                                                    )}
                                                </div>
                                                <div>
                                                    <span className={cn(
                                                        "block text-sm font-bold transition-colors duration-300",
                                                        editingGroup.jid && editingGroup.is_active ? "text-green-500" : "text-white"
                                                    )}>
                                                        {editingGroup.jid && editingGroup.is_active ? "Conectado com Sucesso" : "Aguardando Vínculo"}
                                                    </span>
                                                    <span className="text-xs text-secondary-gray-500">
                                                        {editingGroup.jid ? "Monitoramento ativo e operante." : "Estamos escutando mensagens..."}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-6 gap-3">
                                <button
                                    onClick={() => setEditingGroup(null)}
                                    className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-secondary-gray-400 text-sm font-bold rounded-xl transition-colors cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveEdit}
                                    className="px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-2"
                                >
                                    <Save className="h-4 w-4" /> Salvar Alterações
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

