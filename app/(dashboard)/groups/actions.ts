'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createGroupAction(data: {
    name: string
    platform: string
    presetId: string
    organizationId: string
}) {
    const supabase = (await createClient()) as any

    // 1. Create the Group
    const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
            name: data.name,
            platform: data.platform,
            preset_id: data.presetId,
            organization_id: data.organizationId,
            is_active: true
        })
        .select()
        .single()

    if (groupError) {
        console.error('[createGroupAction] Error:', groupError)
        return { error: 'Erro ao criar grupo.' }
    }

    // 2. Create the associated Group Agent record in 'pending' status
    // We fetch the preset name to store it in group_agents as per schema
    const { data: preset } = await supabase
        .from('agent_presets')
        .select('name')
        .eq('id', data.presetId)
        .single()

    const { error: agentError } = await supabase
        .from('group_agents')
        .insert({
            group_id: group.id,
            preset: preset?.name || 'Sentinel',
            status: 'pending'
        })

    if (agentError) {
        console.error('[createGroupAction] Agent Error:', agentError)
        return { error: 'Erro ao configurar agente do grupo.' }
    }

    revalidatePath('/groups')
    return { data: group }
}

export async function verifyGroupConnection(groupId: string) {
    const supabase = (await createClient()) as any

    const { data: agent, error } = await supabase
        .from('group_agents')
        .select('status')
        .eq('group_id', groupId)
        .single()

    if (error || !agent) {
        return { status: 'error' }
    }

    return { status: agent.status }
}

export async function deleteGroupAction(groupId: string) {
    const supabase = (await createClient()) as any

    const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/groups')
    return { success: true }
}
