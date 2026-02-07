import Stripe from 'stripe'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { priceId, customerId, successUrl, cancelUrl } = body

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    if (!stripeSecretKey) {
        throw createError({
            statusCode: 500,
            message: 'Stripe secret key not configured'
        })
    }

    const stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2024-12-18.acacia'
    })

    try {
        const sessionParams: Stripe.Checkout.SessionCreateParams = {
            mode: 'subscription',
            line_items: [
                {
                    price: priceId,
                    quantity: 1
                }
            ],
            success_url: successUrl || `${process.env.NUXT_PUBLIC_SITE_URL}/settings?tab=subscription&success=true`,
            cancel_url: cancelUrl || `${process.env.NUXT_PUBLIC_SITE_URL}/settings?tab=subscription&canceled=true`,
            allow_promotion_codes: true,
            billing_address_collection: 'auto',
            customer_update: customerId ? { address: 'auto' } : undefined
        }

        // If customer exists, use it
        if (customerId) {
            sessionParams.customer = customerId
        }

        const session = await stripe.checkout.sessions.create(sessionParams)

        return {
            url: session.url,
            sessionId: session.id
        }
    } catch (error: any) {
        console.error('Stripe checkout error:', error)
        throw createError({
            statusCode: 500,
            message: error.message || 'Failed to create checkout session'
        })
    }
})
