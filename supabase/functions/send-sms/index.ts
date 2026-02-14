import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SmsRequest {
    to: string;
    content: string;
    userId?: string;
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        if (!BREVO_API_KEY) throw new Error("BREVO_API_KEY not configured");

        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
        const { to, content, userId } = await req.json() as SmsRequest;

        if (!to || !content) {
            throw new Error("Missing 'to' or 'content' fields");
        }

        let formattedTo = to.replace(/\D/g, "");
        if (!formattedTo.startsWith("55") && formattedTo.length >= 10) {
            formattedTo = "55" + formattedTo;
        }
        if (!formattedTo.startsWith("+")) {
            formattedTo = "+" + formattedTo;
        }

        console.log(`[send-sms] Sending SMS to ${formattedTo}`);

        const response = await fetch("https://api.brevo.com/v3/transactionalSMS/sms", {
            method: "POST",
            headers: {
                "api-key": BREVO_API_KEY,
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            body: JSON.stringify({
                sender: "ZapDigest",
                recipient: formattedTo,
                content: content,
                tag: "alert"
            }),
        });

        const data = await response.json();
        console.log("[send-sms] Brevo response:", JSON.stringify(data));

        if (!response.ok) {
            throw new Error(data.message || "Failed to send SMS via Brevo");
        }

        if (userId) {
            await supabase.rpc('log_user_activity', {
                p_user_id: userId,
                p_activity_type: 'sms_sent',
                p_metadata: { message_id: data.messageId || data.reference, to: formattedTo }
            });
        }

        return new Response(JSON.stringify({ success: true, messageId: data.messageId || data.reference }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error: any) {
        console.error("[send-sms] Error:", error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
