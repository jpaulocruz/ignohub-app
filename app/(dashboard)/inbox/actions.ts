'use server'

import { createClient } from '@/lib/supabase/client'
import { revalidatePath } from 'next/cache'

export async function getUnifiedInbox(organizationId: string) {
    const supabase = createClient() as any

    // Fetch Alerts
    const { data: alerts } = await supabase
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
        .order('created_at', { ascending: false })

    // Fetch Summaries
    const { data: summaries } = await supabase
        .from('summaries')
        .select(`
            id,
            summary_text,
            highlights,
            is_read,
            created_at,
            groups(name)
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })

    // Fetch Insights
    const { data: insights } = await supabase
        .from('member_insights')
        .select(`
            id,
            role,
            insight_text,
            author_hash,
            is_read,
            created_at,
            groups(name)
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })

    // Unify and Sort
    const unified = [
        ...(alerts || []).map((a: any) => ({
            ...a,
            source: 'alert',
            is_read: a.status !== 'open',
            group_name: a.groups?.name
        })),
        ...(summaries || []).map((s: any) => ({
            ...s,
            source: 'summary',
            title: 'Resumo de Inteligência',
            summary: s.summary_text,
            group_name: s.groups?.name
        })),
        ...(insights || []).map((i: any) => ({
            ...i,
            source: 'insight',
            title: `Insight: ${i.role || 'Membro'}`,
            summary: i.insight_text,
            group_name: i.groups?.name
        }))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return unified
}

export async function markAsReadAction(id: string, source: 'alert' | 'summary' | 'insight') {
    const supabase = createClient() as any

    if (source === 'alert') {
        await supabase.from('alerts').update({ status: 'resolved' }).eq('id', id)
    } else if (source === 'summary') {
        await supabase.from('summaries').update({ is_read: true }).eq('id', id)
    } else if (source === 'insight') {
        await supabase.from('member_insights').update({ is_read: true }).eq('id', id)
    }
}

export async function archiveItemAction(id: string, source: 'alert' | 'summary' | 'insight') {
    const supabase = createClient() as any
    // In a real app, we might have an is_archived column. 
    // For now, let's treat 'resolved' or 'read' as archived for the sake of the demo
    // or we can add the column if it were crucial. 
    // Given the prompt, I'll just reuse the markAsRead logic or update a specific status.
    if (source === 'alert') {
        await supabase.from('alerts').update({ status: 'archived' }).eq('id', id)
    } else if (source === 'summary') {
        await supabase.from('summaries').update({ is_read: true }).eq('id', id)
    } else if (source === 'insight') {
        await supabase.from('member_insights').update({ is_read: true }).eq('id', id)
    }
}
