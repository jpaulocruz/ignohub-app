import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    // @ts-expect-error - version string accepted by SDK but not yet in types
    apiVersion: '2025-01-27.ac' as any, // eslint-disable-line @typescript-eslint/no-explicit-any
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: Request) {
    const body = await req.text()
    const sig = (await headers()).get('stripe-signature') as string

    let event: Stripe.Event

    try {
        event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
    } catch (err: unknown) {
        console.error(`Error signature: ${err instanceof Error ? err.message : String(err)}`)
        return new Response(`Webhook Error: ${err instanceof Error ? err.message : String(err)}`, { status: 400 })
    }

    const supabase = createAdminClient()

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session
                const subscriptionId = session.subscription as string
                const customerId = session.customer as string
                const organizationId = session.client_reference_id

                if (!organizationId) {
                    console.error('[Stripe Webhook] No client_reference_id found in session')
                    break
                }

                // Get subscription details
                const subscription = await stripe.subscriptions.retrieve(subscriptionId)

                await supabase
                    .from('organizations')
                    .update({
                        stripe_customer_id: customerId,
                        stripe_subscription_id: subscriptionId,
                        subscription_status: subscription.status,
                        plan_type: (subscription.items.data[0].price.product as string)
                    })
                    .eq('id', organizationId)
                break
            }

            case 'customer.subscription.updated':
            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription

                await supabase
                    .from('organizations')
                    .update({
                        subscription_status: subscription.status,
                    })
                    .eq('stripe_subscription_id', subscription.id)
                break
            }

            default:
                console.log(`[Stripe Webhook] Unhandled event type ${event.type}`)
        }

        return NextResponse.json({ received: true })
    } catch (err: unknown) {
        const error = err as Error
        console.error(`[Stripe Webhook] Error processing event: ${error.message}`)
        return NextResponse.json({ error: `Webhook Handler Error: ${error.message}` }, { status: 500 })
    }
}
