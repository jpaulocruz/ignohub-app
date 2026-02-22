"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, Info, AlertTriangle, AlertCircle, CheckCircle2, ExternalLink, MessageSquare, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getNotifications, markAsRead, markAllAsRead } from "@/app/actions/notifications";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

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
        const channel = supabase
            .channel('notifications_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => fetchItems())
            .subscribe();
        return () => { supabase.removeChannel(channel); };
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

    const getTypeIcon = (type: string, platform?: string) => {
        if (platform === 'whatsapp') return <MessageSquare className="h-4 w-4 text-green-600 dark:text-green-400" />;
        if (platform === 'telegram') return <Send className="h-4 w-4 text-sky-600 dark:text-sky-400" />;
        switch (type) {
            case 'error': return <AlertCircle className="h-4 w-4 text-destructive" />;
            case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
            case 'success': return <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />;
            default: return <Info className="h-4 w-4 text-primary" />;
        }
    };

    const getIconBg = (type: string, platform?: string) => {
        if (platform === 'whatsapp') return 'bg-green-500/10 border border-green-500/20';
        if (platform === 'telegram') return 'bg-sky-500/10 border border-sky-500/20';
        switch (type) {
            case 'error': return 'bg-red-500/10 border border-red-500/20';
            case 'warning': return 'bg-amber-500/10 border border-amber-500/20';
            case 'success': return 'bg-green-500/10 border border-green-500/20';
            default: return 'bg-primary/10 border border-primary/20';
        }
    };

    return (
        <div className="relative" ref={popoverRef}>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(!isOpen)}
                className="relative"
                aria-label="Notifications"
            >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-4 min-w-[16px] px-1 bg-destructive rounded-full text-[10px] font-medium text-destructive-foreground flex items-center justify-center leading-none">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </Button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-80 sm:w-96 z-50 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-xl"
                        style={{ backdropFilter: 'none' }}
                    >
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-popover">
                            <div>
                                <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                                </p>
                            </div>
                            {unreadCount > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleMarkAllAsRead}
                                    className="text-xs h-7 px-2 text-primary hover:text-primary"
                                >
                                    Mark all read
                                </Button>
                            )}
                        </div>

                        {/* List */}
                        <div className="max-h-[400px] overflow-y-auto bg-popover">
                            {notifications.length === 0 ? (
                                <div className="px-4 py-10 text-center">
                                    <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center mx-auto mb-3">
                                        <Bell className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <p className="text-sm font-medium text-foreground">All clear</p>
                                    <p className="text-xs text-muted-foreground mt-1">No new notifications.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-border">
                                    {notifications.map((notif) => {
                                        let link = notif.metadata?.link;
                                        if (link === '/inbox' && !link.includes('?id=')) {
                                            const id = notif.metadata.alert_id || notif.metadata.summary_id || notif.metadata.insight_id || notif.metadata.id;
                                            if (id) link = `/inbox?id=${id}`;
                                        }

                                        return (
                                            <div
                                                key={notif.id}
                                                className={cn(
                                                    "px-4 py-3 hover:bg-muted/50 transition-colors relative group",
                                                    !notif.is_read && "bg-primary/5"
                                                )}
                                            >
                                                <div className="flex gap-3">
                                                    <div className={cn(
                                                        "mt-0.5 shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
                                                        getIconBg(notif.type, notif.metadata?.platform)
                                                    )}>
                                                        {getTypeIcon(notif.type, notif.metadata?.platform)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <h4 className="text-sm font-medium text-foreground truncate">
                                                                {notif.title}
                                                            </h4>
                                                            {!notif.is_read && (
                                                                <div className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-primary" />
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                                                            {notif.message}
                                                        </p>
                                                        <div className="flex items-center gap-3 mt-1.5">
                                                            <span className="text-[11px] text-muted-foreground">
                                                                {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: ptBR })}
                                                            </span>
                                                            {link && (
                                                                <a
                                                                    href={link}
                                                                    className="text-[11px] text-primary flex items-center gap-1 hover:underline"
                                                                >
                                                                    View <ExternalLink className="h-2.5 w-2.5" />
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                {!notif.is_read && (
                                                    <button
                                                        onClick={() => handleMarkAsRead(notif.id)}
                                                        className="absolute right-3 top-3 w-6 h-6 flex items-center justify-center rounded-md hover:bg-accent opacity-0 group-hover:opacity-100 transition-all cursor-pointer z-20"
                                                        title="Mark as read"
                                                    >
                                                        <Check className="h-3 w-3 text-muted-foreground" />
                                                    </button>
                                                )}
                                                {link && (
                                                    <a
                                                        href={link}
                                                        onClick={async () => {
                                                            if (!notif.is_read) await handleMarkAsRead(notif.id);
                                                        }}
                                                        className="absolute inset-0 z-10"
                                                    />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-2.5 border-t border-border bg-muted/30 text-center">
                            <span className="text-xs text-muted-foreground">IgnoHub Intelligence</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
