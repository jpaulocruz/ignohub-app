import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
    const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
    console.log(`[SYNC-PLAN_STRIPE] ${step}${detailsStr}`);
};

interface PlanData {
    id: string;
    name: string;
    description: string | null;
    price_monthly: number;
    stripe_price_id: string | null;
    max_groups: number;
    max_instances: number;
    max_messages_per_day: number;
    is_active: boolean;
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    try {
        logStep("Function started");

        const authHeader = req.headers.get("Authorization");
        if (!authHeader) throw new Error("No authorization header provided");

        const token = authHeader.replace("Bearer ", "");
        const { data: authData } = await supabaseClient.auth.getUser(token);
        const user = authData.user;
        if (!user) throw new Error("User not authenticated");
        logStep("User authenticated", { userId: user.id });

        // Check if user is superadmin via profiles flag
        const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('is_superadmin')
            .eq('id', user.id)
            .single();

        if (profileError || !profile?.is_superadmin) {
            logStep("Unauthorized: not a superadmin", { profileError, profile });
            throw new Error("Unauthorized: superadmin access required");
        }
        logStep("Superadmin verified");

        const body = await req.json();
        const { action, plan } = body as { action: string; plan: PlanData };

        if (!plan || !plan.id) {
            logStep("Invalid payload", body);
            throw new Error("Invalid payload: 'plan' object is missing or invalid");
        }

        logStep("Request received", { action, planId: plan.id, planName: plan.name });

        const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
        if (!stripeKey) {
            logStep("MISSING_ENV: STRIPE_SECRET_KEY");
            throw new Error("Configuration Error: STRIPE_SECRET_KEY is missing in Edge Function secrets.");
        }

        // Log key prefix for debugging (safe)
        logStep("Stripe Key Check", { prefix: stripeKey.substring(0, 8) + "..." });

        const stripe = new Stripe(stripeKey, {
            apiVersion: "2024-06-20",
            httpClient: Stripe.createFetchHttpClient(),
        });

        let result: { stripe_price_id?: string; stripe_product_id?: string } = {};

        if (action === 'create') {
            // Create product in Stripe
            const product = await stripe.products.create({
                name: plan.name,
                description: plan.description || `Plano ${plan.name} - ${plan.max_groups} grupos, ${plan.max_instances} instâncias`,
                metadata: {
                    plan_id: plan.id,
                    max_groups: String(plan.max_groups),
                    max_instances: String(plan.max_instances),
                    max_messages_per_day: String(plan.max_messages_per_day),
                },
            });
            logStep("Product created", { productId: product.id });

            // Create price in Stripe (monthly recurring)
            if (plan.price_monthly > 0) {
                const price = await stripe.prices.create({
                    product: product.id,
                    unit_amount: Math.round(plan.price_monthly * 100), // Convert to cents
                    currency: 'brl',
                    recurring: { interval: 'month' },
                    metadata: {
                        plan_id: plan.id,
                    },
                });
                logStep("Price created", { priceId: price.id });

                // Update plan with stripe_price_id
                const { error: updateError } = await supabaseClient
                    .from('plans')
                    .update({ stripe_price_id: price.id })
                    .eq('id', plan.id);

                if (updateError) throw updateError;

                result = { stripe_price_id: price.id, stripe_product_id: product.id };
            } else {
                result = { stripe_product_id: product.id };
            }

        } else if (action === 'update') {
            let productId: string | null = null;
            let price: Stripe.Price | null = null;

            // Try to find existing price if ID exists
            if (plan.stripe_price_id) {
                try {
                    price = await stripe.prices.retrieve(plan.stripe_price_id);
                    productId = price.product as string;
                    logStep("Existing price found", { priceId: price.id, productId });
                } catch (e) {
                    logStep("Price lookup failed, will attempt fallback creation", { error: String(e), priceId: plan.stripe_price_id });
                    // Price not found, we'll continue with productId as null to trigger creation
                }
            }

            if (productId && price) {
                // Update existing product metadata and name
                await stripe.products.update(productId, {
                    name: plan.name,
                    description: plan.description || `Plano ${plan.name}`,
                    active: plan.is_active,
                    metadata: {
                        plan_id: plan.id,
                        max_groups: String(plan.max_groups),
                        max_instances: String(plan.max_instances),
                        max_messages_per_day: String(plan.max_messages_per_day),
                    },
                });
                logStep("Product updated", { productId });

                // Check if price changed or if it's not recurring (needs to be recurring for subscriptions)
                const currentPriceAmount = price.unit_amount || 0;
                const newPriceAmount = Math.round(plan.price_monthly * 100);
                const isRecurring = price.type === 'recurring';

                if ((currentPriceAmount !== newPriceAmount || !isRecurring) && plan.price_monthly > 0) {
                    // Archive old price and create new one
                    try {
                        await stripe.prices.update(plan.stripe_price_id, { active: false });
                    } catch (e) {
                        logStep("Warning: Could not archive old price", { error: String(e) });
                    }

                    const newPrice = await stripe.prices.create({
                        product: productId,
                        unit_amount: newPriceAmount,
                        currency: 'brl',
                        recurring: { interval: 'month' },
                        metadata: {
                            plan_id: plan.id,
                        },
                    });
                    logStep("New price created", { priceId: newPrice.id });

                    // Update plan with new stripe_price_id
                    const { error: updateError } = await supabaseClient
                        .from('plans')
                        .update({ stripe_price_id: newPrice.id })
                        .eq('id', plan.id);

                    if (updateError) throw updateError;

                    result = {
                        stripe_price_id: plan.stripe_price_id || undefined,
                        stripe_product_id: productId || undefined
                    };
                }
            } else {
                // No stripe_price_id, create new product/price
                const product = await stripe.products.create({
                    name: plan.name,
                    description: plan.description || `Plano ${plan.name}`,
                    metadata: {
                        plan_id: plan.id,
                        max_groups: String(plan.max_groups),
                        max_instances: String(plan.max_instances),
                        max_messages_per_day: String(plan.max_messages_per_day),
                    },
                });
                logStep("Product created", { productId: product.id });

                if (plan.price_monthly > 0) {
                    const price = await stripe.prices.create({
                        product: product.id,
                        unit_amount: Math.round(plan.price_monthly * 100),
                        currency: 'brl',
                        recurring: { interval: 'month' },
                        metadata: {
                            plan_id: plan.id,
                        },
                    });
                    logStep("Price created", { priceId: price.id });

                    const { error: updateError } = await supabaseClient
                        .from('plans')
                        .update({ stripe_price_id: price.id })
                        .eq('id', plan.id);

                    if (updateError) throw updateError;

                    result = { stripe_price_id: price.id, stripe_product_id: product.id };
                } else {
                    result = { stripe_product_id: product.id };
                }
            }

        } else if (action === 'deactivate') {
            if (plan.stripe_price_id) {
                try {
                    const price = await stripe.prices.retrieve(plan.stripe_price_id);
                    const productId = price.product as string;

                    await stripe.products.update(productId, { active: false });
                    await stripe.prices.update(plan.stripe_price_id, { active: false });
                    logStep("Product and price deactivated");
                } catch (e) {
                    logStep("Deactivation failed or IDs not found", { error: String(e) });
                }
            }
        }

        logStep("Operation completed", result);

        return new Response(JSON.stringify({ success: true, ...result }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logStep("ERROR", { message: errorMessage, stack: error instanceof Error ? error.stack : null });

        // IMPORTANT: Returning 200 OK with success: false to surface error in frontend data
        // bypassing the generic "Edge Function returned a non-2xx status code" error.
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
