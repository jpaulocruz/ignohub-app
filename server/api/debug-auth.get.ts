import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event)
    const client = await serverSupabaseClient(event)
    const cookies = parseCookies(event)
    const headers = getHeaders(event)

    return {
        hasUser: !!user,
        userId: user?.id,
        userEmail: user?.email,
        userMetadata: user?.user_metadata,
        cookiesPresent: Object.keys(cookies),
        authHeaderPresent: !!headers['authorization'],
        timestamp: new Date().toISOString()
    }
})
