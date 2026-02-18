"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, X, Check, Info, AlertTriangle, AlertCircle, CheckCircle2, Trash2, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getNotifications, markAsRead, markAllAsRead } from "@/app/actions/notifications";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

export function NotificationCenter() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const popoverRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    const fetchItems = async () => {
        try {
            const data = await getNotifications();
            setNotifications(data);
            setUnreadCount(data.filter((n: any) => !n.is_read).length);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchItems();

        // Real-time subscription
        const channel = supabase
            .channel('notifications_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
                fetchItems();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleMarkAsRead = async (id: string) => {
        await markAsRead(id);
        fetchItems();
    };

    const handleMarkAllAsRead = async () => {
        await markAllAsRead();
        fetchItems();
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
            case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
            case 'success': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
            default: return <Info className="h-4 w-4 text-blue-500" />;
        }
    };

    return (
        <div className="relative" ref={popoverRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-secondary-gray-500 hover:text-white transition-all relative group cursor-pointer"
            >
                <Bell className={cn("h-5 w-5 transition-transform", isOpen && "scale-110")} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-4 min-w-[16px] px-1 bg-red-500 border-2 border-navy-900 rounded-full text-[10px] font-black text-white flex items-center justify-center animate-in zoom-in duration-300">
                        {unreadCount > 9 ? '+9' : unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-4 w-80 sm:w-96 bg-navy-900 border border-white/10 rounded-3xl shadow-2xl z-50 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-navy-950/50">
                            <div>
                                <h3 className="text-sm font-black text-white">Notificações</h3>
                                <p className="text-[10px] text-secondary-gray-500 font-bold uppercase tracking-widest mt-0.5">
                                    {unreadCount} pendentes
                                </p>
                            </div>
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllAsRead}
                                    className="text-[10px] font-black text-brand-500 hover:text-brand-400 uppercase tracking-tighter cursor-pointer"
                                >
                                    Marcar todas como lidas
                                </button>
                            )}
                        </div>

                        {/* List */}
                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                            {notifications.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                        <Bell className="h-5 w-5 text-secondary-gray-700" />
                                    </div>
                                    <p className="text-sm font-bold text-secondary-gray-500">Tudo limpo por aqui!</p>
                                    <p className="text-xs text-secondary-gray-700 mt-1">Você não tem novas notificações.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-white/5">
                                    {notifications.map((notif) => (
                                        <div
                                            key={notif.id}
                                            className={cn(
                                                "p-4 hover:bg-white/5 transition-colors group relative",
                                                !notif.is_read && "bg-brand-500/5"
                                            )}
                                        >
                                            <div className="flex gap-3">
                                                <div className={cn(
                                                    "mt-1 shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border",
                                                    notif.type === 'error' ? "bg-red-500/10 border-red-500/20" :
                                                        notif.type === 'warning' ? "bg-amber-500/10 border-amber-500/20" :
                                                            notif.type === 'success' ? "bg-green-500/10 border-green-500/20" :
                                                                "bg-blue-500/10 border-blue-500/20"
                                                )}>
                                                    {notif.metadata?.platform === 'whatsapp' ? (
                                                        <div className="w-5 h-5 bg-green-500 rounded-md flex items-center justify-center">
                                                            <span className="text-[8px] text-white font-bold">W</span>
                                                        </div>
                                                    ) : getTypeIcon(notif.type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <h4 className={cn("text-xs font-bold text-white truncate", !notif.is_read && "pr-4")}>
                                                            {notif.title}
                                                        </h4>
                                                        {!notif.is_read && (
                                                            <div className="absolute right-4 top-5 w-1.5 h-1.5 rounded-full bg-brand-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                                        )}
                                                    </div>
                                                    <p className="text-[11px] text-secondary-gray-400 mt-1 leading-relaxed line-clamp-2">
                                                        {notif.message}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <span className="text-[9px] font-black text-secondary-gray-600 uppercase">
                                                            {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: ptBR })}
                                                        </span>
                                                        {notif.metadata?.link && (
                                                            <a
                                                                href={notif.metadata.link}
                                                                className="text-[9px] font-black text-brand-500 flex items-center gap-1 hover:underline capitalize"
                                                            >
                                                                Ver <ExternalLink className="h-2 w-2" />
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            {!notif.is_read && (
                                                <button
                                                    onClick={() => handleMarkAsRead(notif.id)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all cursor-pointer z-20"
                                                    title="Marcar como lida"
                                                >
                                                    <Check className="h-3 w-3 text-brand-500" />
                                                </button>
                                            )}
                                            {notif.metadata?.link && (
                                                <a
                                                    href={notif.metadata.link}
                                                    onClick={async (e) => {
                                                        if (!notif.is_read) {
                                                            await handleMarkAsRead(notif.id);
                                                        }
                                                    }}
                                                    className="absolute inset-0 z-10"
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-3 bg-navy-950/80 text-center border-t border-white/5">
                            <span className="text-[9px] font-black text-secondary-gray-700 uppercase tracking-widest">
                                Central de Inteligência IgnoHub
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
