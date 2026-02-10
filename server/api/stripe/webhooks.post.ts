import Stripe from 'stripe'
import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()
    const stripe = new Stripe(config.stripeSecretKey, {
        apiVersion: '2026-01-28.clover',
        typescript: true,
    })

    const signature = getHeader(event, 'stripe-signature')
    if (!signature) {
        throw createError({ statusCode: 400, message: 'Missing stripe-signature header' })
    }

    const rawBody = await readRawBody(event)
    if (!rawBody) {
        throw createError({ statusCode: 400, message: 'Request body empty' })
    }

    let stripeEvent: Stripe.Event

    try {
        stripeEvent = stripe.webhooks.constructEvent(
            rawBody,
            signature,
            config.stripeWebhookSecret
        )
    } catch (err: any) {
        console.error(`[Stripe Webhook] Error verifying signature: ${err.message}`)
        throw createError({ statusCode: 400, message: `Webhook Error: ${err.message}` })
    }

    console.log(`[Stripe Webhook] Received event: ${stripeEvent.type}`)

    const supabase = await serverSupabaseServiceRole<Database>(event)

    try {
        switch (stripeEvent.type) {
            case 'checkout.session.completed': {
                const session = stripeEvent.data.object as Stripe.Checkout.Session
                const metadata = session.metadata
                const organizationId = metadata?.organizationId
                const planType = metadata?.planType
                const subscriptionId = session.subscription as string

                if (!organizationId || organizationId === 'undefined' || organizationId === 'null') {
                    console.error('[Stripe Webhook] Missing or invalid organizationId in metadata')
                    break
                }

                console.log(`[Stripe Webhook] Updating organization ${organizationId} to active. Plan: ${planType}`)

                const { error } = await supabase
                    .from('organizations')
                    .update({
                        subscription_status: 'active',
                        stripe_subscription_id: subscriptionId,
                        plan_type: planType
                    } as any) // Type cast to bypass strict row check if needed
                    .eq('id', organizationId)

                if (error) {
                    console.error(`[Stripe Webhook] Database update error: ${error.message}`)
                    throw error
                }

                break
            }

            case 'customer.subscription.deleted':
            case 'customer.subscription.updated': {
                const subscription = stripeEvent.data.object as Stripe.Subscription
                const organizationId = subscription.metadata?.organizationId
                const status = subscription.status === 'active' ? 'active' : 'inactive'

                if (organizationId) {
                    console.log(`[Stripe Webhook] Updating subscription ${subscription.id} status to ${status}`)
                    await supabase
                        .from('organizations')
                        .update({
                            subscription_status: status
                        } as any)
                        .eq('id', organizationId)
                }
                break
            }

            default:
                console.log(`[Stripe Webhook] Unhandled event type ${stripeEvent.type}`)
        }

        return { received: true }
    } catch (err: any) {
        console.error(`[Stripe Webhook] Internal Error: ${err.message}`)
        // Return 200 anyway to prevent Stripe from infinite retries for handled app errors, 
        // but log it for monitoring.
        return { received: true, error: err.message }
    }
})
