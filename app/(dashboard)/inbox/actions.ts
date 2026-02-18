'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getUnifiedInbox(organizationId: string, view: 'active' | 'archived' = 'active') {
    const supabase = await createClient() as any

    // Fetch Alerts
    let alertsQuery = supabase
        .from('alerts')
        .select(`
            id,
            type,
            severity,
            title,
            summary,
            status,
            created_at,
            groups(name)
        `)
        .eq('organization_id', organizationId)

    if (view === 'active') {
        alertsQuery = alertsQuery.neq('status', 'archived')
    } else {
        alertsQuery = alertsQuery.eq('status', 'archived')
    }

    // Execute queries in parallel
    const [alertsResult, summariesResult, insightsResult] = await Promise.all([
        alertsQuery.order('created_at', { ascending: false }),
        summariesQuery.order('created_at', { ascending: false }),
        insightsQuery.order('created_at', { ascending: false })
    ])

    const alerts = alertsResult.data
    const summaries = summariesResult.data
    const insights = insightsResult.data

    // Unify and Sort
    const unified = [
        ...(alerts || []).map((a: any) => ({
            ...a,
            source: 'alert',
            is_read: a.status !== 'open', // Open = Unread, Resolved = Read
            is_resolved: a.status === 'resolved',
            group_name: a.groups?.name
        })),
        ...(summaries || []).map((s: any) => ({
            ...s,
            source: 'summary',
            title: 'Resumo de Inteligência',
            summary: s.summary_text,
            is_resolved: s.is_read, // Treat read as resolved for consistency
            group_name: s.groups?.name
        })),
        ...(insights || []).map((i: any) => ({
            ...i,
            source: 'insight',
            title: `Insight: ${i.role || 'Membro'}`,
            summary: i.insight_text,
            is_resolved: i.is_read, // Treat read as resolved for consistency
            group_name: i.groups?.name
        }))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return unified
}

export async function markAsReadAction(id: string, source: 'alert' | 'summary' | 'insight') {
    const supabase = await createClient() as any

    if (source === 'alert') {
        await supabase.from('alerts').update({ status: 'resolved' }).eq('id', id)
    } else if (source === 'summary') {
        await supabase.from('summaries').update({ is_read: true }).eq('id', id)
    } else if (source === 'insight') {
        await supabase.from('member_insights').update({ is_read: true }).eq('id', id)
    }
}

export async function archiveItemAction(id: string, source: 'alert' | 'summary' | 'insight') {
    const supabase = await createClient() as any

    if (source === 'alert') {
        await supabase.from('alerts').update({ status: 'archived' }).eq('id', id)
    } else if (source === 'summary') {
        await supabase.from('summaries').update({ is_archived: true }).eq('id', id)
    } else if (source === 'insight') {
        await supabase.from('member_insights').update({ is_archived: true }).eq('id', id)
    }
}
