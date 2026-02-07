import Stripe from 'stripe'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { customerId, returnUrl } = body

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    if (!stripeSecretKey) {
        throw createError({
            statusCode: 500,
            message: 'Stripe secret key not configured'
        })
    }

    if (!customerId) {
        throw createError({
            statusCode: 400,
            message: 'Customer ID is required'
        })
    }

    const stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2024-12-18.acacia'
    })

    try {
        const session = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: returnUrl || `${process.env.NUXT_PUBLIC_SITE_URL}/settings?tab=subscription`
        })

        return {
            url: session.url
        }
    } catch (error: any) {
        console.error('Stripe portal error:', error)
        throw createError({
            statusCode: 500,
            message: error.message || 'Failed to create portal session'
        })
    }
})
