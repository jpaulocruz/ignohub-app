import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
    to: string;
    subject: string;
    htmlContent: string;
    userId?: string;
    emailType: string;
    templateId?: number;
    params?: Record<string, string>;
}

interface BrevoEmailPayload {
    sender: { name: string; email: string };
    to: { email: string; name?: string }[];
    subject?: string;
    htmlContent?: string;
    templateId?: number;
    params?: Record<string, string>;
}

const handler = async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
        if (!BREVO_API_KEY) {
            throw new Error("BREVO_API_KEY not configured");
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

        // Auth Check
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) throw new Error("Missing Authorization header");

        const token = authHeader.replace("Bearer ", "");
        let isAuthenticated = false;

        if (token === supabaseServiceKey) {
            isAuthenticated = true;
        } else {
            const authClient = createClient(supabaseUrl, supabaseServiceKey);
            const { data: { user }, error: authError } = await authClient.auth.getUser(token);
            if (user && !authError) isAuthenticated = true;
        }

        if (!isAuthenticated) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { to, subject, htmlContent, userId, emailType, templateId, params }: EmailRequest = await req.json();

        console.log(`[send-email] Sending ${emailType} email to ${to}`);

        const brevoPayload: BrevoEmailPayload = {
            sender: { name: "IgnoHub", email: "contato@webyou.com.br" },
            to: [{ email: to }],
        };

        if (templateId) {
            brevoPayload.templateId = templateId;
            if (params) brevoPayload.params = params;
        } else {
            brevoPayload.subject = subject;
            brevoPayload.htmlContent = htmlContent;
        }

        const brevoResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
                "api-key": BREVO_API_KEY,
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            body: JSON.stringify(brevoPayload),
        });

        const brevoData = await brevoResponse.json();

        if (!brevoResponse.ok) {
            if (userId) {
                await supabase.from("email_logs").insert({
                    user_id: userId,
                    email_type: emailType,
                    recipient: to,
                    subject: subject || `Template ${templateId}`,
                    status: "failed",
                    error_message: brevoData.message || "Unknown error",
                    sent_at: new Date().toISOString(),
                });
            }
            throw new Error(brevoData.message || "Failed to send email");
        }

        // Success logs
        if (userId) {
            await supabase.from("email_logs").insert({
                user_id: userId,
                email_type: emailType,
                recipient: to,
                subject: subject || `Template ${templateId}`,
                status: "sent",
                brevo_message_id: brevoData.messageId,
                sent_at: new Date().toISOString(),
            });
            await supabase.rpc('log_user_activity', {
                p_user_id: userId,
                p_activity_type: 'email_sent',
                p_metadata: { type: emailType, to: to, message_id: brevoData.messageId }
            });
        }

        return new Response(JSON.stringify({ success: true, messageId: brevoData.messageId }), {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
        });

    } catch (error: any) {
        console.error(`[send-email] Error: ${error.message}`);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders }
        });
    }
};

serve(handler);
