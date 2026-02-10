import type { Database } from '~/types/database.types'

export const useOrgSecurity = () => {
    const user = useSupabaseUser()
    const client = useSupabaseClient<Database>()
    const selectedOrgId = useCookie('selected_organization_id')
    const isValidating = ref(false)

    const validateOrg = async () => {
        const orgId = selectedOrgId.value
        if (!user.value || !orgId || orgId === 'undefined' || orgId === 'null') return false

        isValidating.value = true
        try {
            const { data, error } = await client
                .from('organization_users')
                .select('organization_id')
                .eq('organization_id', orgId as string)
                .eq('user_id', user.value.id)
                .single()

            if (error || !data) {
                console.warn('[Security] Unauthorized organization access attempt detected.')
                selectedOrgId.value = null
                await navigateTo('/login')
                return false
            }
            return true
        } catch (e) {
            console.error('[Security] Validation error:', e)
            return false
        } finally {
            isValidating.value = false
        }
    }

    return {
        validateOrg,
        isValidating
    }
}
