import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event)

    if (!user) {
        throw createError({ statusCode: 401, message: 'Unauthorized' })
    }

    const client = await serverSupabaseServiceRole<Database>(event)

    // 1. Ensure Profile Exists
    let { data: profile } = await client
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (!profile) {
        // Determine a display name from metadata or email
        const metadataName = user.user_metadata?.full_name || user.user_metadata?.name
        const emailName = user.email?.split('@')[0]
        const fullName = metadataName || emailName || 'User'

        console.log('[API/me] Creating missing profile for user:', user.id)

        const { data: newProfile, error: profileError } = await client
            .from('profiles')
            .insert({
                id: user.id,
                full_name: fullName,
                avatar_url: user.user_metadata?.avatar_url || null
            } as any)
            .select()
            .single()

        if (profileError) {
            console.error('[API/me] Failed to create profile:', profileError)
            // Continue without profile if it fails, but log it.
        } else {
            profile = newProfile
        }
    }

    // 2. Ensure Organization Exists
    // Check if user is part of any organization
    const { data: orgUser } = await client
        .from('organization_users')
        .select('organization_id, role, organizations(*, plans(*))')
        .eq('user_id', user.id)
        .maybeSingle()

    let organization: any = null

    if (orgUser?.organizations) {
        // Enriched organization object
        organization = {
            ...orgUser.organizations,
            role: orgUser.role,
            is_main: true
        }
    }

    if (!organization) {
        // Create Default Organization
        const metadataName = user.user_metadata?.full_name || user.user_metadata?.name
        const emailName = user.email?.split('@')[0]
        const baseName = metadataName || emailName || 'My'
        const orgName = `${baseName}'s Organization`

        console.log('[API/me] Creating default organization for user:', user.id)

        const { data: newOrg, error: orgError } = await client
            .from('organizations')
            .insert({ name: orgName } as any)
            .select()
            .single()

        if (orgError || !newOrg) {
            console.error('[API/me] Failed to create organization:', orgError)
        } else {
            // Link User as Admin
            const { error: linkError } = await client
                .from('organization_users')
                .insert({
                    user_id: user.id,
                    organization_id: newOrg.id,
                    role: 'admin'
                } as any)

            if (linkError) {
                console.error('[API/me] Failed to link organization:', linkError)
            } else {
                organization = {
                    ...newOrg,
                    role: 'admin',
                    is_main: true
                }
            }
        }
    }

    return {
        user,
        profile,
        organization
    }
})
