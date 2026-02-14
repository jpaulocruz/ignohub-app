import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
        const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        const checks = {
            stripe_key_exists: !!stripeKey,
            stripe_key_prefix: stripeKey ? stripeKey.substring(0, 7) + "..." : "MISSING",
            webhook_secret_exists: !!stripeWebhookSecret,
            supabase_url_exists: !!supabaseUrl,
            supabase_key_exists: !!supabaseKey
        };

        if (!stripeKey) {
            throw new Error("Missing STRIPE_SECRET_KEY env var");
        }

        // Try a real lightweight request to Stripe
        const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });
        const balance = await stripe.balance.retrieve();

        return new Response(JSON.stringify({
            status: "healthy",
            checks,
            stripe_connection: "success",
            balance_available: balance.available,
            message: "Stripe connection verified successfully"
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return new Response(JSON.stringify({
            status: "unhealthy",
            error: errorMessage,
            env_checks: {
                stripe_key_configured: !!Deno.env.get("STRIPE_SECRET_KEY"),
                webhook_secret_configured: !!Deno.env.get("STRIPE_WEBHOOK_SECRET")
            }
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500, // Explicitly return 500 so client knows it failed
        });
    }
});
