import Stripe from 'stripe'
import { getPlanByPriceId } from '~/utils/plans'
import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'
import type { H3Event } from 'h3'

export default defineEventHandler(async (event) => {
    const body = await readRawBody(event)
    const signature = getHeader(event, 'stripe-signature')
    const config = useRuntimeConfig()

    const stripe = new Stripe(config.stripeSecretKey, {
        apiVersion: '2026-01-28.clover',
        typescript: true,
    })

    if (!body || !signature) {
        throw createError({ statusCode: 400, message: 'Missing body or signature' })
    }

    /*
     * Verify signature
     */
    let stripeEvent: Stripe.Event
    try {
        stripeEvent = stripe.webhooks.constructEvent(body, signature, config.stripeWebhookSecret)
    } catch (err: any) {
        throw createError({ statusCode: 400, message: `Webhook Error: ${err.message}` })
    }

    // Handle the event
    switch (stripeEvent.type) {
        case 'checkout.session.completed': {
            const session = stripeEvent.data.object as Stripe.Checkout.Session
            await handleCheckoutSessionCompleted(event, session)
            break
        }
        case 'customer.subscription.updated': {
            const subscription = stripeEvent.data.object as Stripe.Subscription
            await handleSubscriptionUpdated(event, subscription)
            break
        }
        case 'customer.subscription.deleted': {
            const subscription = stripeEvent.data.object as Stripe.Subscription
            await handleSubscriptionDeleted(event, subscription)
            break
        }
        default:
            console.log(`Unhandled event type ${stripeEvent.type}`)
    }

    return { received: true }
})

async function handleCheckoutSessionCompleted(event: H3Event, session: Stripe.Checkout.Session) {
    const organizationId = session.metadata?.organizationId
    const subscriptionId = session.subscription as string

    if (organizationId) {
        // NOTE: We need to use service role here because webhook is not authenticated as a user.
        const client = await serverSupabaseServiceRole<Database>(event)

        await client
            .from('organizations')
            .update({
                stripe_customer_id: session.customer as string,
                stripe_subscription_id: subscriptionId,
                subscription_status: 'active'
            } as any)
            .eq('id', organizationId)
    }
}

async function handleSubscriptionUpdated(event: H3Event, subscription: Stripe.Subscription) {
    const client = await serverSupabaseServiceRole<Database>(event)

    const priceId = subscription.items.data[0].price.id
    const plan = getPlanByPriceId(priceId)
    const status = subscription.status

    if (plan) {
        await client
            .from('organizations')
            .update({
                subscription_status: status,
                stripe_subscription_id: subscription.id,
                plan_type: plan.slug
            } as any)
            .eq('stripe_subscription_id', subscription.id)
    }
}

async function handleSubscriptionDeleted(event: H3Event, subscription: Stripe.Subscription) {
    const client = await serverSupabaseServiceRole<Database>(event)

    await client
        .from('organizations')
        .update({
            subscription_status: 'canceled',
            plan_type: 'starter'
        } as any)
        .eq('stripe_subscription_id', subscription.id)
}
