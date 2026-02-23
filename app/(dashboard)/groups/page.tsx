"use client";

import { useState, useEffect } from "react";
import { useOrganization } from "@/hooks/use-organization";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PremiumCard } from "@/components/ui/PremiumCard";
import {
    Plus,
    Search,
    Globe,
    Settings2,
    Activity,
    MessageSquare,
    Copy,
    Check,
    AlertTriangle,
    Clock,
    Trash2,
    X,
    Save,
    RefreshCw,
    Radio,
    CheckCircle2
} from "lucide-react";
import { deleteGroupAction, updateGroupAction, getGroupVerificationCode } from "./actions";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";

export default function GroupsPage() {
    const { organization, loading: orgLoading } = useOrganization();
    const router = useRouter();
    const t = useTranslations("groups");
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
        const { data: groupsData, error } = await supabase
            .from("groups")
            .select("*")
            .eq("organization_id", organization.id)
            .order("created_at", { ascending: false });

        if (error || !groupsData) { setLoading(false); return; }

        const presetIds = groupsData.map(g => g.preset_id).filter(Boolean);
        const groupIds = groupsData.map(g => g.id);
        const presetsQuery = presetIds.length > 0
            ? supabase.from("agent_presets").select("id, name, icon").in("id", presetIds)
            : Promise.resolve({ data: [] as any[], error: null });
        const agentsQuery = groupIds.length > 0
            ? supabase.from("group_agents").select("group_id, status").in("group_id", groupIds)
            : Promise.resolve({ data: [] as any[], error: null });

        const [presetsRes, agentsRes] = await Promise.all([presetsQuery, agentsQuery]);
        const merged = groupsData.map(group => ({
            ...group,
            agent_presets: presetsRes.data?.find((p: any) => p.id === group.preset_id) || null,
            group_agents: agentsRes.data?.filter((a: any) => a.group_id === group.id) || []
        }));
        setGroups(merged);
        setLoading(false);
    };

    useEffect(() => { fetchGroups(); }, [organization]);

    useEffect(() => {
        if (editingGroup) {
            setConnectionStatus(null);
            setVerificationCode(null);
            if (!editingGroup.jid) fetchVerificationCode(editingGroup.id);
        }
    }, [editingGroup]);

    const fetchVerificationCode = async (groupId: string) => {
        setLoadingCode(true);
        const res = await getGroupVerificationCode(groupId);
        if (res.code) setVerificationCode(res.code);
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
        const msg = group.is_active
            ? "This group is active and being monitored.\n\nDeleting will immediately stop the service, remove all processed logs, and disconnect the agent.\n\nAre you sure?"
            : "Are you sure you want to delete this group?";
        if (!confirm(msg)) return;
        const res = await deleteGroupAction(group.id);
        if (res.error) alert(`Error: ${res.error}`);
        else fetchGroups();
    };

    const handleSaveEdit = async () => {
        if (!editingGroup) return;
        const res = await updateGroupAction(editingGroup.id, {
            name: editingGroup.name,
            description: editingGroup.description
        });
        if (res.error) alert(`Error: ${res.error}`);
        else { setEditingGroup(null); fetchGroups(); }
    };

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (editingGroup && !editingGroup.jid) {
            interval = setInterval(async () => {
                const { data } = await (supabase as any)
                    .from("groups").select('jid, is_active').eq('id', editingGroup.id).single();
                if (data?.jid && data.is_active) {
                    setEditingGroup((prev: any) => ({ ...prev, jid: data.jid, is_active: true }));
                    setConnectionStatus('Connected');
                    fetchGroups();
                }
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [editingGroup]);

    if (orgLoading) return <div className="animate-pulse h-screen bg-muted rounded-xl" />;

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {t('subtitle')}
                    </p>
                </div>
                <Button onClick={() => router.push("/onboarding")} className="gap-2">
                    <Plus className="h-4 w-4" />
                    {t('add_community')}
                </Button>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 bg-muted rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : groups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center mb-4">
                        <Globe className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">{t('no_groups')}</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                        Add your first community to start monitoring conversations.
                    </p>
                    <Button onClick={() => router.push("/onboarding")} className="mt-4 gap-2" variant="outline">
                        <Plus className="h-4 w-4" />
                        Add community
                    </Button>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4">
                        <PremiumCard className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                    <Activity className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Active</p>
                                    <p className="text-xl font-semibold">{groups.filter(g => g.is_active).length}</p>
                                </div>
                            </div>
                        </PremiumCard>
                        <PremiumCard className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center justify-center">
                                    <MessageSquare className="h-4 w-4 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Monitoring</p>
                                    <p className="text-xl font-semibold">Live</p>
                                </div>
                            </div>
                        </PremiumCard>
                        <PremiumCard className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                                    <Globe className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Total</p>
                                    <p className="text-xl font-semibold">{groups.length}</p>
                                </div>
                            </div>
                        </PremiumCard>
                    </div>

                    {/* Table */}
                    <PremiumCard className="overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted/50">
                                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Name</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Platform</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Last activity</th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                <AnimatePresence>
                                    {groups.map((group, idx) => (
                                        <motion.tr
                                            key={group.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: idx * 0.04 }}
                                            className="hover:bg-accent/40 transition-colors"
                                        >
                                            <td className="px-4 py-3.5">
                                                <div className="font-medium text-foreground">{group.name}</div>
                                                {group.description && (
                                                    <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                                        {group.description}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <Badge variant="outline" className={cn(
                                                    "text-xs",
                                                    group.platform === 'whatsapp'
                                                        ? "border-green-200 text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
                                                        : "border-blue-200 text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"
                                                )}>
                                                    {group.platform}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                {group.jid && group.is_active ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                                                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">Connected</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                                                        <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">Pending</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    <span className="text-xs">
                                                        {group.last_message_at
                                                            ? formatDistanceToNow(new Date(group.last_message_at), { addSuffix: true, locale: ptBR })
                                                            : 'Never'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => setEditingGroup(group)}
                                                    >
                                                        <Settings2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                        onClick={() => handleDelete(group)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </PremiumCard>
                </div>
            )}

            {/* Edit Modal */}
            <AnimatePresence>
                {editingGroup && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setEditingGroup(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.96, opacity: 0, y: 8 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.96, opacity: 0, y: 8 }}
                            transition={{ duration: 0.15 }}
                            className="bg-card border border-border rounded-xl p-6 max-w-md w-full shadow-xl max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-base font-semibold text-foreground">
                                        {editingGroup.jid ? "Edit community" : "Connect community"}
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {editingGroup.jid ? "Update group details." : "Follow the steps to connect your group."}
                                    </p>
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingGroup(null)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="space-y-5">
                                {/* Connection banner */}
                                {!editingGroup.jid && (
                                    <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-4 space-y-4">
                                        <div className="flex items-start gap-3">
                                            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                                            <div>
                                                <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200">Connection required</h4>
                                                <ol className="text-xs text-amber-700 dark:text-amber-300 mt-1 space-y-0.5 list-decimal list-inside">
                                                    <li>Add the bot to your group as an admin.</li>
                                                    <li>Send the verification code below in the group chat.</li>
                                                </ol>
                                            </div>
                                        </div>

                                        {loadingCode ? (
                                            <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                                                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                                Generating code...
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 bg-background border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-2.5 flex items-center justify-center">
                                                    <code className="text-amber-600 dark:text-amber-400 font-mono text-lg font-semibold tracking-widest">
                                                        {verificationCode || "---"}
                                                    </code>
                                                </div>
                                                <Button variant="outline" size="icon" onClick={handleCopyCode} className="h-10 w-10 shrink-0">
                                                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                                </Button>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                                            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                                            Listening for connection...
                                        </div>
                                    </div>
                                )}

                                {/* Name field */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Name</Label>
                                    <Input
                                        value={editingGroup.name}
                                        onChange={(e) => setEditingGroup({ ...editingGroup, name: e.target.value })}
                                        placeholder="Group name"
                                        className="focus-visible:ring-primary"
                                    />
                                </div>

                                {/* Description field */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Description</Label>
                                    <textarea
                                        value={editingGroup.description || ''}
                                        onChange={(e) => setEditingGroup({ ...editingGroup, description: e.target.value })}
                                        rows={3}
                                        placeholder="Brief description of this group..."
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                                    />
                                </div>

                                {/* Status indicator */}
                                <div className="rounded-lg border border-border bg-muted/30 p-4">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-9 h-9 rounded-lg flex items-center justify-center",
                                            editingGroup.jid && editingGroup.is_active
                                                ? "bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400"
                                                : "bg-muted text-muted-foreground"
                                        )}>
                                            {editingGroup.jid && editingGroup.is_active
                                                ? <CheckCircle2 className="h-5 w-5" />
                                                : <Radio className="h-5 w-5 animate-pulse" />}
                                        </div>
                                        <div>
                                            <p className={cn(
                                                "text-sm font-medium",
                                                editingGroup.jid && editingGroup.is_active
                                                    ? "text-green-700 dark:text-green-400"
                                                    : "text-foreground"
                                            )}>
                                                {editingGroup.jid && editingGroup.is_active ? "Connected" : "Waiting for connection"}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {editingGroup.jid ? "Transmission active" : "Awaiting verification"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
                                <Button variant="outline" onClick={() => setEditingGroup(null)}>Cancel</Button>
                                <Button onClick={handleSaveEdit} className="gap-2">
                                    <Save className="h-4 w-4" />
                                    Save changes
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
