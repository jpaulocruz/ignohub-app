"use client";

import { useEffect, useState, useMemo } from "react";
import { useOrganization } from "@/hooks/use-organization";
import { getUnifiedInbox, markAsReadAction } from "./actions";
import {
    Inbox,
    Search,
    Loader2,
    Bell,
    AlertTriangle,
    FileText,
    Lightbulb,
    MessageSquare,
    Send,
    ArrowLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { InboxDetailView } from "@/components/inbox/inbox-detail-view";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";

const STATUS_TABS = [
    { id: "pending", labelKey: "pending" },
    { id: "resolved", labelKey: "resolved" },
    { id: "favorites", labelKey: "favorites" },
    { id: "archived", labelKey: "archived" },
] as const;

const TYPE_FILTERS = [
    { id: "all", labelKey: "all" },
    { id: "alert", labelKey: "alerts" },
    { id: "summary", labelKey: "summaries" },
    { id: "insight", labelKey: "insights" },
] as const;

function sourceIcon(source: string) {
    if (source === "alert") return <AlertTriangle className="h-4 w-4" />;
    if (source === "summary") return <FileText className="h-4 w-4" />;
    return <Lightbulb className="h-4 w-4" />;
}

function sourceBadge(source: string, selected: boolean) {
    if (selected) return "bg-primary-foreground/20 text-primary-foreground border border-primary-foreground/30";
    if (source === "alert") return "bg-red-500/10 text-red-600 border border-red-500/20 dark:text-red-400";
    if (source === "summary") return "bg-primary/10 text-primary border border-primary/20";
    return "bg-green-500/10 text-green-600 border border-green-500/20 dark:text-green-400";
}

export default function InboxPage() {
    const { organization, loading: orgLoading } = useOrganization();
    const t = useTranslations("inbox");
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [mobileShowDetail, setMobileShowDetail] = useState(false);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<"pending" | "resolved" | "favorites" | "archived">("pending");
    const [filter, setFilter] = useState<"all" | "alert" | "summary" | "insight">("all");

    const fetchInbox = async () => {
        if (!organization) return;
        setLoading(true);
        try {
            const view = statusFilter === 'archived' ? 'archived' : 'active';
            const data = await getUnifiedInbox(organization.id, view);
            setItems(data);

            // Check for deep link
            const urlParams = new URLSearchParams(window.location.search);
            const idFromUrl = urlParams.get('id');
            const foundItem = idFromUrl ? data.find((i: any) => i.id === idFromUrl) : null;

            if (foundItem) {
                setSelectedId(foundItem.id);
            } else if (data.length > 0 && !selectedId) {
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
        const ch = supabase
            .channel("inbox-updates")
            .on("postgres_changes", { event: "*", schema: "public", table: "alerts", filter: `organization_id=eq.${organization.id}` }, () => fetchInbox())
            .on("postgres_changes", { event: "*", schema: "public", table: "summaries", filter: `organization_id=eq.${organization.id}` }, () => fetchInbox())
            .subscribe();
        return () => { supabase.removeChannel(ch); };
    }, [organization, statusFilter]);

    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchesSearch =
                item.title?.toLowerCase().includes(search.toLowerCase()) ||
                item.summary?.toLowerCase().includes(search.toLowerCase()) ||
                item.group_name?.toLowerCase().includes(search.toLowerCase());
            const matchesType = filter === "all" || item.source === filter;
            let matchesStatus = true;
            if (statusFilter === 'pending') {
                matchesStatus = !item.is_resolved;
            } else if (statusFilter === 'resolved') {
                matchesStatus = item.is_resolved;
            } else if (statusFilter === 'favorites') {
                matchesStatus = item.is_bookmarked;
            }
            return matchesSearch && matchesType && matchesStatus;
        });
    }, [items, search, filter, statusFilter]);

    const selectedItem = useMemo(() => items.find(i => i.id === selectedId) || null, [items, selectedId]);

    const handleSelect = async (item: any) => {
        setSelectedId(item.id);
        setMobileShowDetail(true);
        if (!item.is_read) {
            await markAsReadAction(item.id, item.source);
            setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_read: true } : i));
        }
    };

    const handleMobileBack = () => {
        setMobileShowDetail(false);
    };

    const pendingCount = items.filter(i => !i.is_resolved).length;

    return (
        <div className="flex h-[calc(100vh-8rem)] gap-0 relative overflow-hidden -mx-6 md:-mx-6 -mb-6">
            {/* Left panel - List */}
            <div className={cn(
                "w-full md:w-[340px] flex flex-col shrink-0 border-r border-border bg-card",
                mobileShowDetail ? "hidden md:flex" : "flex"
            )}>
                {/* Panel header */}
                <div className="px-4 py-4 border-b border-border space-y-3">
                    <div className="flex items-center justify-between">
                        <h1 className="text-sm font-semibold text-foreground">{t('title')}</h1>
                        {pendingCount > 0 && (
                            <Badge variant="secondary" className="text-xs font-medium">
                                {pendingCount}
                            </Badge>
                        )}
                    </div>

                    {/* Status tabs */}
                    <div className="flex rounded-lg bg-muted p-0.5 gap-0.5">
                        {STATUS_TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setStatusFilter(tab.id as any)}
                                className={cn(
                                    "flex-1 py-1.5 text-xs font-medium rounded-md transition-all",
                                    tab.id === statusFilter
                                        ? "bg-background text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {t(tab.labelKey)}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder={t('search', { defaultMessage: 'Search...' })}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8 h-8 text-sm"
                        />
                    </div>

                    {/* Type filter chips */}
                    <div className="flex gap-1.5 flex-wrap">
                        {TYPE_FILTERS.map(f => (
                            <button
                                key={f.id}
                                onClick={() => setFilter(f.id as any)}
                                className={cn(
                                    "px-2.5 py-1 text-xs font-medium rounded-full border transition-all",
                                    filter === f.id
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "bg-transparent text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground"
                                )}
                            >
                                {t(f.labelKey)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <div className="text-center py-16 px-4">
                            <Inbox className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                            <p className="text-sm font-medium text-foreground">{t('no_items')}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {t('no_items_desc')}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {filteredItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => handleSelect(item)}
                                    className={cn(
                                        "w-full text-left px-4 py-3.5 transition-colors relative",
                                        selectedId === item.id
                                            ? "bg-primary text-primary-foreground"
                                            : "hover:bg-accent/60"
                                    )}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={cn(
                                            "mt-0.5 shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
                                            selectedId === item.id
                                                ? "bg-primary-foreground/20"
                                                : item.source === "alert"
                                                    ? "bg-red-500/10 border border-red-500/20"
                                                    : item.source === "summary"
                                                        ? "bg-primary/10 border border-primary/20"
                                                        : "bg-green-500/10 border border-green-500/20"
                                        )}>
                                            <span className={cn(
                                                selectedId === item.id
                                                    ? "text-primary-foreground"
                                                    : item.source === "alert"
                                                        ? "text-red-600 dark:text-red-400"
                                                        : item.source === "summary"
                                                            ? "text-primary"
                                                            : "text-green-600 dark:text-green-400"
                                            )}>
                                                {sourceIcon(item.source)}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <span className={cn(
                                                    "text-xs font-semibold truncate",
                                                    selectedId === item.id ? "text-primary-foreground" : "text-foreground"
                                                )}>
                                                    {item.title}
                                                </span>
                                                {!item.is_read && (
                                                    <div className={cn(
                                                        "shrink-0 w-1.5 h-1.5 rounded-full",
                                                        selectedId === item.id ? "bg-primary-foreground" : "bg-primary"
                                                    )} />
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className={cn(
                                                    "text-xs truncate",
                                                    selectedId === item.id ? "text-primary-foreground/70" : "text-muted-foreground"
                                                )}>
                                                    {item.group_name}
                                                </span>
                                                <span className={cn(
                                                    "text-[11px] shrink-0 ml-2",
                                                    selectedId === item.id ? "text-primary-foreground/60" : "text-muted-foreground"
                                                )}>
                                                    {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Detail panel */}
            <div className={cn(
                "flex-1 overflow-hidden bg-background",
                mobileShowDetail ? "flex flex-col" : "hidden md:flex md:flex-col"
            )}>
                {/* Mobile back button */}
                <div className="md:hidden border-b border-border px-4 py-2.5 flex items-center gap-2 bg-card">
                    <button
                        onClick={handleMobileBack}
                        className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        {t('back_to_feed')}
                    </button>
                </div>
                {selectedItem ? (
                    <PremiumCard className="h-full overflow-hidden flex flex-col rounded-none border-0 border-l-0">
                        <InboxDetailView
                            item={selectedItem}
                            onUpdate={() => fetchInbox()}
                        />
                    </PremiumCard>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8">
                        <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center mb-4">
                            <Inbox className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <h3 className="text-sm font-semibold text-foreground">{t('select_item')}</h3>
                        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                            {t('select_item_desc')}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
