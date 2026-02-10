import Stripe from 'stripe'
import { getPlanByPriceId } from '~/utils/plans'
import { serverSupabaseUser, serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()
    const body = await readBody(event)
    const { planType, organizationId } = body
    const user = await serverSupabaseUser(event)

    // Secure server-side price mapping using runtimeConfig
    const PRICES = {
        starter: config.public.stripePriceStarter,
        pro: config.public.stripePricePro
    } as Record<string, string | undefined>

    const selectedPriceId = PRICES[planType]

    if (!selectedPriceId) {
        console.error('[Stripe Checkout] Invalid or missing planType:', planType)
        throw createError({ statusCode: 400, message: 'Invalid plan type' })
    }
    const client = await serverSupabaseClient<Database>(event)
    const serviceRole = await serverSupabaseServiceRole<Database>(event)


    const stripe = new Stripe(config.stripeSecretKey, {
        apiVersion: '2026-01-28.clover', // Use latest API version or maintain compatibility
        typescript: true,
    })

    console.log('[Stripe Checkout] Request received')
    console.log('[Stripe Checkout] Headers:', getHeaders(event))
    console.log('[Stripe Checkout] Cookies:', parseCookies(event))
    console.log('[Stripe Checkout] User ID:', user?.id)
    console.log('[Stripe Checkout] Config keys present:', !!config.stripeSecretKey)

    if (!user || !user.id) {
        console.warn('[Stripe Checkout] serverSupabaseUser failed, attempting manual token recovery...')

        // Manual fallback: Try to get token from cookie and use getUser()
        const cookies = parseCookies(event)
        const authCookieName = Object.keys(cookies).find(k => k.endsWith('-auth-token'))

        if (authCookieName) {
            const tokenStr = cookies[authCookieName]
            try {
                // The cookie is often base64 encoded JSON: { access_token: "...", ... }
                // or sometimes just the string depending on version. 
                // Let's try to assume it's the standard Supabase format
                let accessToken = tokenStr

                // If it looks like base64 (starts with base64-), strip prefix
                if (tokenStr.startsWith('base64-')) {
                    const jsonStr = Buffer.from(tokenStr.substring(7), 'base64').toString('utf-8')
                    const session = JSON.parse(jsonStr)
                    accessToken = session.access_token
                }

                if (accessToken) {
                    const { data: { user: recoveredUser }, error: authError } = await client.auth.getUser(accessToken)

                    if (recoveredUser && !authError) {
                        console.log('[Stripe Checkout] Recovered user from token:', recoveredUser.id)

                        // Verify Is Admin with recovered user
                        interface OrgUserRole { role: string }
                        const { data: orgUser, error: orgError } = await client
                            .from('organization_users')
                            .select('role')
                            .eq('organization_id', organizationId)
                            .eq('user_id', recoveredUser.id)
                            .single()

                        const member = orgUser as OrgUserRole | null

                        if (orgError || !member || member.role !== 'admin') {
                            throw createError({ statusCode: 403, message: 'Forbidden: Only admins can subscribe' })
                        }

                        // Proceed with checkout using recovered user
                        interface OrgDetails { name: string, stripe_customer_id: string | null }
                        const { data: org } = await client
                            .from('organizations')
                            .select('name, stripe_customer_id')
                            .eq('id', organizationId)
                            .single()

                        const organization = org as OrgDetails | null

                        let customerId = organization?.stripe_customer_id

                        if (!customerId) {
                            const customer = await stripe.customers.create({
                                email: recoveredUser.email as string,
                                name: organization?.name || 'Organization',
                                metadata: { organizationId }
                            })
                            customerId = customer.id
                            await serviceRole.from('organizations').update({ stripe_customer_id: customerId } as any).eq('id', organizationId)
                        }

                        const session = await stripe.checkout.sessions.create({
                            customer: customerId,
                            mode: 'subscription',
                            payment_method_types: ['card'],
                            line_items: [{ price: selectedPriceId, quantity: 1 }],
                            success_url: `${config.public.siteUrl}/settings?tab=subscription&success=true&session_id={CHECKOUT_SESSION_ID}`,
                            cancel_url: `${config.public.siteUrl}/settings?tab=subscription&canceled=true`,
                            metadata: { organizationId, planType, userId: recoveredUser.id }
                        })

                        return { url: session.url }
                    }
                }
            } catch (e) {
                console.error('[Stripe Checkout] Manual recovery failed:', e)
            }
        }

        console.error('[Stripe Checkout] 401: No user found in session')
        throw createError({ statusCode: 401, message: 'Unauthorized' })
    }



    // Resolve Organization ID (MVP: 1 Org per User)
    let finalOrgId = organizationId

    if (!finalOrgId) {
        // Try to find existing org for user
        const { data: existingOrgUser } = await client
            .from('organization_users')
            .select('organization_id, role')
            .eq('user_id', user.id)
            .single()

        if (existingOrgUser) {
            finalOrgId = existingOrgUser.organization_id
            // Ensure they are admin, or upgrade them if it's the only one (MVP looseness)
            if (existingOrgUser.role !== 'admin') {
                // For MVP, if they are the only user, make them admin? 
                // Better to just check if they are admin.
                if (existingOrgUser.role !== 'admin') {
                    throw createError({ statusCode: 403, message: 'Forbidden: User is not admin of their organization' })
                }
            }
        } else {
            // Create new organization for the user
            console.log('[Stripe Checkout] Creating new organization for user:', user.id)
            const orgName = (user.user_metadata?.full_name || user.email || 'My Organization').split('@')[0] + "'s Org"

            const { data: newOrg, error: createErrorLog } = await serviceRole
                .from('organizations')
                .insert({ name: orgName } as any)
                .select('id')
                .single()

            if (createErrorLog || !newOrg) {
                console.error('[Stripe Checkout] Failed to create org:', createErrorLog)
                throw createError({ statusCode: 500, message: 'Failed to create organization' })
            }

            finalOrgId = newOrg.id

            // Link user as admin
            await serviceRole
                .from('organization_users')
                .insert({
                    organization_id: finalOrgId,
                    user_id: user.id,
                    role: 'admin'
                } as any)
        }
    } else {
        // Verify user is admin of provided organization
        interface OrgUserRole { role: string }
        const { data: orgUser, error: orgError } = await client
            .from('organization_users')
            .select('role')
            .eq('organization_id', finalOrgId)
            .eq('user_id', user.id)
            .single()

        const member = orgUser as OrgUserRole | null

        if (orgError || !member || member.role !== 'admin') {
            throw createError({ statusCode: 403, message: 'Forbidden: Only admins can subscribe' })
        }
    }

    const targetOrgId = finalOrgId as string

    // Get organization details for customer email (if needed) or metadata
    interface OrgDetails { name: string, stripe_customer_id: string | null }
    const { data: org } = await client
        .from('organizations')
        .select('name, stripe_customer_id')
        .eq('id', targetOrgId)
        .single()

    const organization = org as OrgDetails | null

    let customerId = organization?.stripe_customer_id

    // If no customer ID, create one
    if (!customerId) {
        const customer = await stripe.customers.create({
            email: user.email,
            name: organization?.name || 'Organization',
            metadata: {
                organizationId: targetOrgId
            }
        })
        customerId = customer.id

        // Save customer ID to DB
        await serviceRole
            .from('organizations')
            .update({ stripe_customer_id: customerId } as any)
            .eq('id', targetOrgId)
    }

    const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
            {
                price: selectedPriceId,
                quantity: 1,
            },
        ],
        success_url: `${config.public.siteUrl}/settings?tab=subscription&success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${config.public.siteUrl}/settings?tab=subscription&canceled=true`,
        metadata: {
            organizationId: targetOrgId,
            planType: planType,
            userId: user.id
        }
    })

    return { url: session.url }
})
