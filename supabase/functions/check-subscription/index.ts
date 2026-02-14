import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
    const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
    console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

const PRICE_TO_PLAN: Record<string, string> = {
    'price_1Sw8d2DPO8OWHdclvaiB2pUa': 'Pro',
    'price_1Sw8d2DPO8OWHdclU25eZq7E': 'Business',
    'price_1Sw8d3DPO8OWHdclo3e7RPvt': 'Enterprise',
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { persistSession: false } }
    );

    try {
        logStep("Function started");

        const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
        if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set in Edge Function secrets.");
        logStep("Stripe key verified");

        const authHeader = req.headers.get("Authorization");
        if (!authHeader) throw new Error("No authorization header provided. Check if user is logged in.");
        logStep("Authorization header found");

        const token = authHeader.replace("Bearer ", "");
        const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
        if (userError) throw new Error(`Supabase Auth Error: ${userError.message}`);
        const user = userData.user;
        if (!user?.email) throw new Error("User not authenticated or email not available");
        logStep("User authenticated", { userId: user.id, email: user.email });

        const stripe = new Stripe(stripeKey, {
            apiVersion: "2024-06-20",
            httpClient: Stripe.createFetchHttpClient(),
        });

        const customers = await stripe.customers.list({ email: user.email, limit: 1 });

        if (customers.data.length === 0) {
            logStep("No customer found, returning unsubscribed state");
            return new Response(JSON.stringify({
                success: true,
                subscribed: false,
                plan_name: 'Free',
            }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        const customerId = customers.data[0].id;
        logStep("Found Stripe customer", { customerId });

        await supabaseClient
            .from('profiles')
            .update({ stripe_customer_id: customerId })
            .eq('user_id', user.id);

        const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            status: "active",
            limit: 1,
        });

        const hasActiveSub = subscriptions.data.length > 0;
        let planName = 'Free';
        let subscriptionEnd = null;
        let subscriptionId = null;
        let priceId = null;

        if (hasActiveSub) {
            const subscription = subscriptions.data[0];

            if (subscription.current_period_end && typeof subscription.current_period_end === 'number') {
                try {
                    subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
                } catch (e) {
                    logStep("Warning: Could not parse subscription end date");
                    subscriptionEnd = null;
                }
            }

            subscriptionId = subscription.id;
            priceId = subscription.items.data[0]?.price?.id || null;

            // Dynamic plan name lookup from DB
            if (priceId) {
                const { data: planData } = await supabaseClient
                    .from('plans')
                    .select('id, name')
                    .eq('stripe_price_id', priceId)
                    .maybeSingle();

                if (planData) {
                    planName = planData.name;
                    await supabaseClient
                        .from('profiles')
                        .update({
                            plan_id: planData.id,
                            stripe_subscription_id: subscriptionId
                        })
                        .eq('user_id', user.id);
                    logStep("Updated user plan from DB", { planName, planId: planData.id });
                } else {
                    planName = 'Pro'; // Fallback
                    logStep("Plan not found in DB for priceId", { priceId });
                }
            }

            logStep("Active subscription found", { subscriptionId, planName });
        } else {
            logStep("No active subscription found");
            const { data: freePlan } = await supabaseClient
                .from('plans')
                .select('id')
                .eq('name', 'Free')
                .maybeSingle();

            if (freePlan) {
                await supabaseClient
                    .from('profiles')
                    .update({
                        plan_id: freePlan.id,
                        stripe_subscription_id: null
                    })
                    .eq('user_id', user.id);
            }
        }

        return new Response(JSON.stringify({
            success: true,
            subscribed: hasActiveSub,
            plan_name: planName,
            subscription_end: subscriptionEnd,
            subscription_id: subscriptionId,
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logStep("ERROR_CAUGHT", { message: errorMessage });
        return new Response(JSON.stringify({
            success: false,
            error: errorMessage,
            details: "Check Supabase Edge Function logs for stack trace"
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    }
});
