import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';
import {
    startOfMonth,
    subMonths,
    endOfMonth,
    startOfWeek,
    subWeeks,
    format,
    isWithinInterval
} from 'date-fns';

export interface MetricValue {
    count: number;
    growth: number;
}

export interface DashboardMetrics {
    groups: MetricValue;
    members: MetricValue;
    messages: MetricValue;
    engagement: MetricValue;
    alerts: MetricValue;
}

export interface WeeklyTrend {
    label: string;
    messages: number;
    members: number;
}

export interface GroupOverview {
    id: string;
    name: string;
    platform: string;
    messageCount: number;
    memberCount: number;
    status: 'active' | 'pending';
    lastActivity: string | null;
}

export interface TopMember {
    author_hash: string;
    name: string;
    actions: number;
    impact: 'High' | 'Medium' | 'Low';
}

export const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
};

export class DashboardService {
    constructor(private supabase: SupabaseClient<Database>) { }

    async getMetrics(organizationId: string): Promise<DashboardMetrics> {
        const now = new Date();
        const currentMonthStart = startOfMonth(now);
        const lastMonthStart = startOfMonth(subMonths(now, 1));
        const lastMonthEnd = endOfMonth(lastMonthStart);

        // Fetch current month data
        const [
            { count: currentGroups },
            { data: currentBatches },
            { count: currentAlerts }
        ] = await Promise.all([
            this.supabase.from('groups').select('*', { count: 'exact', head: true }).eq('organization_id', organizationId).eq('is_active', true).gte('created_at', currentMonthStart.toISOString()),
            this.supabase.from('message_batches').select('message_count, author_count').eq('organization_id', organizationId).gte('created_at', currentMonthStart.toISOString()),
            this.supabase.from('alerts').select('*', { count: 'exact', head: true }).eq('organization_id', organizationId).gte('created_at', currentMonthStart.toISOString())
        ]);

        // Fetch previous month data for growth
        const [
            { count: previousGroups },
            { data: previousBatches },
            { count: previousAlerts }
        ] = await Promise.all([
            this.supabase.from('groups').select('*', { count: 'exact', head: true }).eq('organization_id', organizationId).eq('is_active', true).lt('created_at', currentMonthStart.toISOString()).gte('created_at', lastMonthStart.toISOString()),
            this.supabase.from('message_batches').select('message_count, author_count').eq('organization_id', organizationId).lt('created_at', currentMonthStart.toISOString()).gte('created_at', lastMonthStart.toISOString()),
            this.supabase.from('alerts').select('*', { count: 'exact', head: true }).eq('organization_id', organizationId).lt('created_at', currentMonthStart.toISOString()).gte('created_at', lastMonthStart.toISOString())
        ]);

        const currentMsgCount = (currentBatches || []).reduce((acc, curr) => acc + (curr.message_count || 0), 0);
        const previousMsgCount = (previousBatches || []).reduce((acc, curr) => acc + (curr.message_count || 0), 0);

        const currentAuthorCount = (currentBatches || []).reduce((acc, curr) => acc + (curr.author_count || 0), 0);
        const previousAuthorCount = (previousBatches || []).reduce((acc, curr) => acc + (curr.author_count || 0), 0);

        // Fetch cumulative authors count if current is 0
        const { count: totalAuthors } = await this.supabase
            .from('member_insights')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', organizationId);

        // Total groups (not just added this month)
        const { count: totalGroups } = await this.supabase.from('groups').select('*', { count: 'exact', head: true }).eq('organization_id', organizationId).eq('is_active', true);
        const { count: totalPrevGroups } = await this.supabase.from('groups').select('*', { count: 'exact', head: true }).eq('organization_id', organizationId).eq('is_active', true).lt('created_at', currentMonthStart.toISOString());

        return {
            groups: { count: totalGroups || 0, growth: calculateGrowth(totalGroups || 0, totalPrevGroups || 0) },
            members: { count: currentAuthorCount > 0 ? currentAuthorCount : (totalAuthors || 0), growth: calculateGrowth(currentAuthorCount, previousAuthorCount) },
            messages: { count: currentMsgCount, growth: calculateGrowth(currentMsgCount, previousMsgCount) },
            engagement: {
                count: currentMsgCount > 0 ? Math.round((currentAuthorCount / currentMsgCount) * 100) : 0,
                growth: 0 // Engagement growth is complex, setting to 0 for now
            },
            alerts: { count: currentAlerts || 0, growth: calculateGrowth(currentAlerts || 0, previousAlerts || 0) }
        };
    }

    async getWeeklyTrends(organizationId: string): Promise<WeeklyTrend[]> {
        const weeks = 12;
        const now = new Date();
        const trends: WeeklyTrend[] = [];

        // Fetch all batches for the last 12 weeks
        const startDate = startOfWeek(subWeeks(now, weeks));
        const { data: batches } = await this.supabase
            .from('message_batches')
            .select('message_count, author_count, created_at')
            .eq('organization_id', organizationId)
            .gte('created_at', startDate.toISOString())
            .order('created_at', { ascending: true });

        for (let i = 0; i < weeks; i++) {
            const weekStart = startOfWeek(subWeeks(now, weeks - 1 - i));
            const weekEnd = format(weekStart, 'dd/MM');

            const weekBatches = (batches || []).filter(b => {
                const bDate = new Date(b.created_at);
                return bDate >= weekStart && bDate < startOfWeek(subWeeks(now, weeks - 2 - i));
            });

            trends.push({
                label: weekEnd,
                messages: weekBatches.reduce((acc, curr) => acc + (curr.message_count || 0), 0),
                members: weekBatches.reduce((acc, curr) => acc + (curr.author_count || 0), 0)
            });
        }

        return trends;
    }

    async getMonitoredGroups(organizationId: string): Promise<GroupOverview[]> {
        const { data: groups } = await this.supabase
            .from('groups')
            .select('*, message_batches(message_count, author_count)')
            .eq('organization_id', organizationId)
            .order('last_message_at', { ascending: false });

        return (groups || []).map(g => {
            const batches = g.message_batches as any[] || [];
            return {
                id: g.id,
                name: g.name,
                platform: g.platform,
                messageCount: batches.reduce((acc, curr) => acc + (curr.message_count || 0), 0),
                memberCount: batches.reduce((acc, curr) => acc + (curr.author_count || 0), 0),
                status: (g.jid && g.is_active) ? 'active' : 'pending',
                lastActivity: g.last_message_at
            };
        });
    }

    async getAIInsights(organizationId: string) {
        // Fetch summaries and alerts with recommended actions
        const [
            { data: summaries },
            { data: alerts }
        ] = await Promise.all([
            this.supabase.from('summaries').select('*').eq('organization_id', organizationId).order('created_at', { ascending: false }).limit(5),
            this.supabase.from('alerts').select('*').eq('organization_id', organizationId).not('recommended_actions', 'is', null).order('created_at', { ascending: false }).limit(5)
        ]);

        return { summaries, alerts };
    }

    async getTopMembers(organizationId: string): Promise<TopMember[]> {
        // Since we don't have a direct "Member" table, we'll use member_insights
        // as a proxy for the most important members, or query messages.
        const { data: insights } = await this.supabase
            .from('member_insights')
            .select('*')
            .eq('organization_id', organizationId)
            .order('sentiment_score', { ascending: false });

        // deduplicate insights by author_hash, keeping the one with highest score
        const uniqueInsights: Record<string, any> = {};
        (insights || []).forEach(insight => {
            if (!uniqueInsights[insight.author_hash] || uniqueInsights[insight.author_hash].sentiment_score < insight.sentiment_score) {
                uniqueInsights[insight.author_hash] = insight;
            }
        });

        const topInsights = Object.values(uniqueInsights)
            .sort((a: any, b: any) => b.sentiment_score - a.sentiment_score)
            .slice(0, 5);

        // Also get message counts per author for the last 30 days
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const { data: messages } = await this.supabase
            .from('messages')
            .select('author_hash, pre_flags')
            .eq('organization_id', organizationId)
            .gte('created_at', thirtyDaysAgo);

        const counts: Record<string, { actions: number, name: string }> = {};
        (messages || []).forEach(m => {
            if (!counts[m.author_hash]) {
                counts[m.author_hash] = {
                    actions: 0,
                    name: (m.pre_flags as any)?.sender_name || `Membro ${m.author_hash.substring(0, 5)}`
                };
            }
            counts[m.author_hash].actions++;
        });

        return topInsights.map(insight => ({
            author_hash: insight.author_hash,
            name: counts[insight.author_hash]?.name || `Membro ${insight.author_hash.substring(0, 5)}`,
            actions: counts[insight.author_hash]?.actions || 0,
            impact: insight.sentiment_score > 0.5 ? 'High' : insight.sentiment_score > 0.2 ? 'Medium' : 'Low'
        })).sort((a, b) => b.actions - a.actions);
    }
}
