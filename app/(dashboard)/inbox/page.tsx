"use client";

import { useEffect, useState, useMemo } from "react";
import { useOrganization } from "@/hooks/use-organization";
import { getUnifiedInbox, markAsReadAction } from "./actions";
import {
    Inbox,
    Search,
    Circle,
    ChevronRight,
    Filter,
    Loader2,
    Bell
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { InboxDetailView } from "@/components/inbox/inbox-detail-view";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

export default function InboxPage() {
    const { organization, loading: orgLoading } = useOrganization();
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<"pending" | "resolved" | "archived">("pending");
    const [filter, setFilter] = useState<"all" | "alert" | "summary" | "insight">("all");

    const fetchInbox = async () => {
        if (!organization) return;
        setLoading(true);
        try {
            // If checking archived, we request archived view from server
            // If checking pending/resolved, we request active view
            const view = statusFilter === 'archived' ? 'archived' : 'active';
            const data = await getUnifiedInbox(organization.id, view);
            setItems(data);
            if (data.length > 0 && !selectedId) {
                setSelectedId(data[0].id);
            }
        } catch (error) {
            console.error("Error fetching inbox:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInbox();

        if (!organization) return;

        const supabase = createClient();
        const updateChannel = supabase
            .channel("inbox-updates")
            .on(
                "postgres_changes",
                {
                    event: "*", // Listen to all events to catch updates
                    schema: "public",
                    table: "alerts",
                    filter: `organization_id=eq.${organization.id}`
                },
                () => fetchInbox()
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "summaries",
                    filter: `organization_id=eq.${organization.id}`
                },
                () => fetchInbox()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(updateChannel);
        };
    }, [organization, statusFilter]); // Re-fetch when statusFilter changes

    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchesSearch = item.title?.toLowerCase().includes(search.toLowerCase()) ||
                item.summary?.toLowerCase().includes(search.toLowerCase()) ||
                item.group_name?.toLowerCase().includes(search.toLowerCase());

            const matchesType = filter === "all" || item.source === filter;

            // Client-side status filtering for Pending vs Resolved
            // Archived items are separated by server query, so 'archived' tab just shows what came back
            let matchesStatus = true;
            if (statusFilter === 'pending') {
                matchesStatus = !item.is_resolved;
            } else if (statusFilter === 'resolved') {
                matchesStatus = item.is_resolved;
            }

            return matchesSearch && matchesType && matchesStatus;
        });
    }, [items, search, filter, statusFilter]);

    const selectedItem = useMemo(() => {
        return items.find(i => i.id === selectedId) || null;
    }, [items, selectedId]);

    const handleSelect = async (item: any) => {
        setSelectedId(item.id);
        if (!item.is_read) {
            await markAsReadAction(item.id, item.source);
            setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_read: true } : i));
        }
    };

    return (
        <div className="flex h-[calc(100vh-12rem)] gap-8 relative overflow-hidden">
            {/* Master List */}
            <div className="w-96 flex flex-col gap-6 shrink-0">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-white tracking-tight">Central de Inteligência</h1>
                        <div className="px-2.5 py-0.5 bg-brand-500/10 border border-brand-500/20 rounded-full">
                            <span className="text-[10px] font-black text-brand-400 uppercase tracking-widest">
                                {items.filter(i => !i.is_resolved).length} Pendentes
                            </span>
                        </div>
                    </div>

                    {/* Status Tabs */}
                    <div className="flex bg-navy-900/50 p-1 rounded-xl border border-white/5">
                        {[
                            { id: "pending", label: "Pendentes" },
                            { id: "resolved", label: "Resolvidos" },
                            { id: "archived", label: "Arquivados" }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setStatusFilter(tab.id as any)}
                                className={cn(
                                    "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
                                    statusFilter === tab.id
                                        ? "bg-brand-500 text-white shadow-lg"
                                        : "text-secondary-gray-500 hover:text-white hover:bg-white/5"
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-gray-500 group-focus-within:text-brand-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Pesquisar..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-navy-800 border border-white/5 rounded-2xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-secondary-gray-600 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all font-medium"
                        />
                    </div>

                    <div className="flex gap-2 pb-2 overflow-x-auto no-scrollbar">
                        {[
                            { id: "all", label: "Tudo" },
                            { id: "alert", label: "Alertas" },
                            { id: "summary", label: "Resumos" },
                            { id: "insight", label: "Insights" }
                        ].map((f) => (
                            <button
                                key={f.id}
                                onClick={() => setFilter(f.id as any)}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 border",
                                    filter === f.id
                                        ? "bg-navy-700 text-white border-white/20"
                                        : "bg-navy-800 text-secondary-gray-500 border-white/5 hover:border-white/10 hover:text-white"
                                )}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    <AnimatePresence mode="popLayout">
                        {filteredItems.map((item) => (
                            <motion.button
                                layout
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                key={item.id}
                                onClick={() => handleSelect(item)}
                                className={cn(
                                    "w-full text-left p-4 rounded-3xl transition-all border relative group",
                                    selectedId === item.id
                                        ? "bg-navy-800 border-brand-500/30 shadow-premium"
                                        : "bg-transparent border-transparent hover:bg-navy-800/40 hover:border-white/5"
                                )}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="space-y-1 flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            {!item.is_read && (
                                                <Circle className="h-2 w-2 fill-brand-500 text-brand-500 shrink-0" />
                                            )}
                                            <span className={cn(
                                                "text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded",
                                                item.source === "alert" ? "bg-red-500/10 text-red-500" :
                                                    item.source === "summary" ? "bg-brand-500/10 text-brand-500" : "bg-green-500/10 text-green-500"
                                            )}>
                                                {item.source}
                                            </span>
                                            <span className="text-[9px] font-bold text-secondary-gray-600 truncate max-w-[120px]">
                                                {item.group_name}
                                            </span>
                                        </div>
                                        <h3 className={cn(
                                            "text-sm tracking-tight truncate",
                                            !item.is_read ? "font-bold text-white" : "font-semibold text-secondary-gray-600"
                                        )}>
                                            {item.title}
                                        </h3>
                                        <p className="text-xs text-secondary-gray-500 line-clamp-1 font-medium leading-relaxed">
                                            {item.summary}
                                        </p>
                                    </div>
                                    <div className="text-[9px] font-bold text-secondary-gray-600 whitespace-nowrap pt-1">
                                        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </motion.button>
                        ))}

                        {filteredItems.length === 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center py-20"
                            >
                                <Inbox className="h-10 w-10 text-secondary-gray-700 mx-auto mb-3" />
                                <p className="text-secondary-gray-500 font-bold">Nenhum registro encontrado</p>
                                <p className="text-secondary-gray-600 text-[10px] mt-1">Aguarde o processamento das mensagens para ver insights.</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Detail Panel */}
            <div className="flex-1 overflow-hidden relative">
                <AnimatePresence mode="wait">
                    {selectedItem ? (
                        <motion.div
                            key={selectedId}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.02 }}
                            transition={{ duration: 0.2 }}
                            className="h-full"
                        >
                            <PremiumCard className="h-full overflow-hidden flex flex-col">
                                <InboxDetailView
                                    item={selectedItem}
                                    onUpdate={() => fetchInbox()}
                                />
                            </PremiumCard>
                        </motion.div>
                    ) : (
                        <PremiumCard variant="transparent" className="h-full flex flex-col items-center justify-center text-center space-y-6 border-2 border-dashed border-white/5">
                            <div className="w-24 h-24 rounded-full bg-navy-800 flex items-center justify-center border border-white/5">
                                <Inbox className="h-10 w-10 text-secondary-gray-600" />
                            </div>
                            <div className="max-w-xs">
                                <h3 className="text-xl font-bold text-white uppercase tracking-tight">Selecione um item</h3>
                                <p className="text-sm font-medium text-secondary-gray-500 mt-2">
                                    Escolha uma análise no feed à esquerda para ver os detalhes completos e insights profundos.
                                </p>
                            </div>
                        </PremiumCard>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
