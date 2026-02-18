'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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

export async function getPresetsAction() {
    const supabase = (await createClient()) as any
    const { data } = await supabase.from('agent_presets').select('*').order('name')
    return data || []
}

export async function updateGroupAction(id: string, data: { name: string; description?: string }) {
    const userClient = await createClient()

    // 1. Verify User & Ownership
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Check if the group exists and belongs to an organization the user has access to.
    // We try to select it with the userClient (RLS check).
    // If the user can't see the group, they can't edit it.
    const { data: userGroupAccess, error: accessError } = await userClient
        .from('groups')
        .select('id, organization_id')
        .eq('id', id)
        .single()

    if (accessError || !userGroupAccess) {
        console.error('[updateGroupAction] Access Denied:', accessError)
        return { error: 'Acesso negado ou grupo não encontrado.' }
    }

    // Use Admin Client to bypass potential RLS UPDATE restrictions
    const supabase = await createAdminClient()

    // 2. Verify duplicates within the SAME organization
    const { data: existing } = await supabase
        .from('groups')
        .select('id')
        .eq('organization_id', userGroupAccess.organization_id)
        .ilike('name', data.name)
        .neq('id', id)
        .maybeSingle()

    if (existing) {
        return { error: 'Já existe um grupo com este nome na sua organização.' }
    }

    // 3. Update Group Name & Description
    const { error: groupError } = await supabase
        .from('groups')
        .update({
            name: data.name,
            description: data.description
        })
        .eq('id', id)

    if (groupError) {
        console.error('[updateGroupAction] Error:', groupError)
        // Check if it's an RLS error even with admin client (unlikely) or constraint
        return { error: `Erro ao atualizar: ${groupError.message}` }
    }

    revalidatePath('/groups')
    return { success: true }
}

export async function deleteGroupAction(groupId: string) {
    const userClient = await createClient()

    // 1. Verify User & Ownership
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Ownership check via RLS Select
    const { data: userGroupAccess, error: accessError } = await userClient
        .from('groups')
        .select('id')
        .eq('id', groupId)
        .single()

    if (accessError || !userGroupAccess) {
        return { error: 'Acesso negado ou grupo não encontrado.' }
    }

    // Use Admin Client to bypass RLS DELETE restrictions and clean up dependent rows
    const supabase = await createAdminClient()

    // Clean up dependencies first (Order matters for foreign keys)

    // 2. Alerting & Summaries
    await supabase.from('alerts').delete().eq('group_id', groupId)
    await supabase.from('summaries').delete().eq('group_id', groupId)

    // 3. Analytics & Insights
    await supabase.from('member_insights').delete().eq('group_id', groupId)
    await supabase.from('group_analytics').delete().eq('group_id', groupId)

    // 4. Messages
    await supabase.from('messages').delete().eq('group_id', groupId)

    // 5. Batches
    await supabase.from('message_batches').delete().eq('group_id', groupId)

    // 6. Group Agents
    await supabase.from('group_agents').delete().eq('group_id', groupId)

    // 7. Finally, the Group
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

export async function getGroupVerificationCode(groupId: string) {
    const userClient = await createClient()

    // 1. Verify User & Ownership
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: group, error: accessError } = await userClient
        .from('groups')
        .select('id, external_id, organization_id')
        .eq('id', groupId)
        .single()

    if (accessError || !group) {
        return { error: 'Acesso negado ou grupo não encontrado.' }
    }

    // 2. Return existing code or generate new one
    if (group.external_id) {
        return { code: group.external_id }
    }

    // Generate new code if missing
    const newCode = `onb_${Math.random().toString(36).substring(2, 8)}`

    // Use Admin Client to update (bypass RLS if needed for specific field, though owner should have write access)
    const supabase = await createAdminClient()

    const { error: updateError } = await supabase
        .from('groups')
        .update({ external_id: newCode })
        .eq('id', groupId)

    if (updateError) {
        return { error: 'Erro ao gerar código.' }
    }

    return { code: newCode }
}
