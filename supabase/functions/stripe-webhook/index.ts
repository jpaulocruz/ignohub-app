import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
    const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
    console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!stripeKey || !webhookSecret || !supabaseUrl || !supabaseServiceKey) {
        return new Response("Missing configuration", { status: 500 });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
        return new Response("No signature", { status: 400 });
    }

    let event;
    try {
        const body = await req.text();
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
        logStep("Signature verification failed", { error: err.message });
        return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    logStep("Event received", { type: event.type });

    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object;
                const userId = session.metadata?.user_id;
                const planId = session.metadata?.plan_id;
                const customerId = session.customer as string;
                const subscriptionId = session.subscription as string;

                if (userId) {
                    logStep("Processing checkout completed", { userId, customerId, planId });

                    const updateData: any = {
                        stripe_customer_id: customerId,
                        stripe_subscription_id: subscriptionId,
                    };

                    if (planId) {
                        updateData.plan_id = planId;
                    }

                    const { error } = await supabase
                        .from("profiles")
                        .update(updateData)
                        .eq("user_id", userId);

                    if (error) throw error;
                }
                break;
            }

            case "customer.subscription.updated": {
                const subscription = event.data.object;
                const customerId = subscription.customer as string;
                const priceId = subscription.items.data[0].price.id;
                const status = subscription.status;

                logStep("Processing subscription updated", { customerId, priceId, status });

                // Find user by customerId
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("user_id")
                    .eq("stripe_customer_id", customerId)
                    .maybeSingle();

                if (profile) {
                    if (status === "active" || status === "trialing") {
                        // Find plan matching priceId
                        const { data: plan } = await supabase
                            .from("plans")
                            .select("id")
                            .eq("stripe_price_id", priceId)
                            .maybeSingle();

                        if (plan) {
                            await supabase
                                .from("profiles")
                                .update({
                                    plan_id: plan.id,
                                    stripe_subscription_id: subscription.id
                                })
                                .eq("user_id", profile.user_id);
                            logStep("User plan updated", { userId: profile.user_id, planId: plan.id });
                        }
                    } else if (status === "canceled" || status === "unpaid" || status === "past_due") {
                        // Downgrade to Free
                        const { data: freePlan } = await supabase
                            .from("plans")
                            .select("id")
                            .eq("name", "Free")
                            .maybeSingle();

                        if (freePlan) {
                            await supabase
                                .from("profiles")
                                .update({ plan_id: freePlan.id })
                                .eq("user_id", profile.user_id);
                            logStep("User downgraded due to status", { userId: profile.user_id, status });
                        }
                    }
                }
                break;
            }

            case "customer.subscription.deleted": {
                const subscription = event.data.object;
                const customerId = subscription.customer as string;

                logStep("Processing subscription deleted", { customerId });

                const { data: profile } = await supabase
                    .from("profiles")
                    .select("user_id")
                    .eq("stripe_customer_id", customerId)
                    .maybeSingle();

                if (profile) {
                    const { data: freePlan } = await supabase
                        .from("plans")
                        .select("id")
                        .eq("name", "Free")
                        .maybeSingle();

                    if (freePlan) {
                        await supabase
                            .from("profiles")
                            .update({
                                plan_id: freePlan.id,
                                stripe_subscription_id: null
                            })
                            .eq("user_id", profile.user_id);
                        logStep("User reset to Free plan", { userId: profile.user_id });
                    }
                }
                break;
            }
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error) {
        logStep("Error processing webhook", { error: error.message });
        return new Response(`Webhook Error: ${error.message}`, { status: 400 });
    }
});
