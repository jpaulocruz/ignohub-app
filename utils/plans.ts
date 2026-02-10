export const PLANS = {
    starter: {
        name: 'Starter', // Mapped to 'Pro' in Stripe
        slug: 'starter',
        priceId: 'price_1SwCVPDPO8OWHdcl1AIkjVrv',
        limits: {
            max_groups: 1,
            has_email_reports: false,
            retention_days: 7,
            max_members: 100
        },
        features: ['Sentiment Analysis', 'Daily Summaries']
    },
    business: {
        name: 'Business',
        slug: 'business',
        priceId: 'price_1SwCRgDPO8OWHdclRZ0v7tUz',
        limits: {
            max_groups: 10,
            has_email_reports: true,
            retention_days: 30,
            max_members: 1000
        },
        features: ['Sentiment Analysis', 'Daily Summaries', 'Member Insights', 'Alerts']
    },
    enterprise: {
        name: 'Enterprise',
        slug: 'enterprise',
        priceId: 'price_1SwCSKDPO8OWHdcljhveUBiC',
        limits: {
            max_groups: 100,
            has_email_reports: true,
            retention_days: 90,
            max_members: 10000
        },
        features: ['All Features', 'Custom Retention', 'Priority Support']
    }
}

export const getPlanLimits = (planType: string) => {
    return PLANS[planType as keyof typeof PLANS]?.limits || PLANS['starter'].limits
}

export const getPlanByPriceId = (priceId: string) => {
    return Object.values(PLANS).find(plan => plan.priceId === priceId)
}
