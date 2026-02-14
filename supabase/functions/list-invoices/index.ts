import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
    const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
    console.log(`[LIST-INVOICES] ${step}${detailsStr}`);
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

        const authHeader = req.headers.get("Authorization");
        if (!authHeader) throw new Error("No authorization header provided");

        const token = authHeader.replace("Bearer ", "");
        const { data: userData } = await supabaseClient.auth.getUser(token);
        const user = userData.user;
        if (!user?.email) throw new Error("User not authenticated");
        logStep("User authenticated", { email: user.email });

        const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
        if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

        const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

        // Find customer by email
        const customers = await stripe.customers.list({ email: user.email, limit: 1 });

        if (customers.data.length === 0) {
            logStep("No customer found", { email: user.email });
            return new Response(JSON.stringify([]), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        const customerId = customers.data[0].id;
        logStep("Customer found", { customerId });

        const invoices = await stripe.invoices.list({
            customer: customerId,
            limit: 10,
        });

        const formattedInvoices = invoices.data.map((invoice) => ({
            id: invoice.id,
            amount_paid: invoice.amount_paid / 100,
            currency: invoice.currency,
            status: invoice.status,
            created: new Date(invoice.created * 1000).toISOString(),
            invoice_pdf: invoice.invoice_pdf,
            number: invoice.number,
        }));

        logStep("Invoices fetched", { count: formattedInvoices.length });

        return new Response(JSON.stringify(formattedInvoices), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error) {
        logStep("ERROR", { message: error.message });
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
