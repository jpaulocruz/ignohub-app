import Stripe from 'stripe'
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()
    const user = await serverSupabaseUser(event)
    const client = await serverSupabaseClient<Database>(event)

    if (!user) {
        throw createError({ statusCode: 401, message: 'Unauthorized' })
    }

    const stripe = new Stripe(config.stripeSecretKey, {
        apiVersion: '2026-01-28.clover',
        typescript: true,
    })

    // Get organizationId from cookie
    const cookies = parseCookies(event)
    const organizationId = cookies['selected_organization_id']

    if (!organizationId || organizationId === 'undefined' || organizationId === 'null') {
        return []
    }

    // Get stripe_customer_id from organizations table
    const { data: org, error } = await client
        .from('organizations')
        .select('stripe_customer_id')
        .eq('id', organizationId)
        .single()

    if (error || !org?.stripe_customer_id) {
        console.warn('[Stripe Invoices] Customer not found for org:', organizationId)
        return []
    }

    try {
        const invoices = await stripe.invoices.list({
            customer: org.stripe_customer_id,
            limit: 10,
        })

        return invoices.data.map(invoice => ({
            id: invoice.id,
            amount: (invoice.amount_paid / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
            date: new Date(invoice.created * 1000).toLocaleDateString('pt-BR'),
            status: invoice.status,
            pdf: invoice.invoice_pdf
        }))
    } catch (e: any) {
        console.error('[Stripe Invoices] Error listing invoices:', e.message)
        throw createError({ statusCode: 500, message: 'Erro ao buscar faturas' })
    }
})
