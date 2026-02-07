import Stripe from 'stripe'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const customerId = query.customerId as string

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    if (!stripeSecretKey) {
        throw createError({
            statusCode: 500,
            message: 'Stripe secret key not configured'
        })
    }

    if (!customerId) {
        return { invoices: [] }
    }

    const stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2024-12-18.acacia'
    })

    try {
        const invoices = await stripe.invoices.list({
            customer: customerId,
            limit: 10
        })

        return {
            invoices: invoices.data.map(inv => ({
                id: inv.id,
                number: inv.number,
                amount_due: inv.amount_due,
                amount_paid: inv.amount_paid,
                currency: inv.currency,
                status: inv.status,
                created: inv.created,
                hosted_invoice_url: inv.hosted_invoice_url,
                invoice_pdf: inv.invoice_pdf,
                period_start: inv.period_start,
                period_end: inv.period_end
            }))
        }
    } catch (error: any) {
        console.error('Stripe invoices error:', error)
        return { invoices: [] }
    }
})
