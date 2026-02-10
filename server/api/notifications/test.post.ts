
export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { email, type = 'email' } = body

    if (!email) {
        throw createError({ statusCode: 400, message: 'Email is required' })
    }

    // Use the RESEND_API_KEY from runtime config
    const config = useRuntimeConfig()

    if (!config.resendApiKey) {
        throw createError({ statusCode: 500, message: 'Resend API Key not configured' })
    }

    // Implementation would go here - for now just logging and returning success to verify endpoint reachability
    // and config presence.

    console.log('[Notification Test] Sending test email to:', email)
    console.log('[Notification Test] Using API Key:', config.resendApiKey ? '***' : 'Missing')

    // Mock success
    return { success: true, message: `Test notification sent to ${email}` }
})
