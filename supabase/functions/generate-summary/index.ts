// Version: 2.1 - Refactored for dynamic AI and sending flow
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
    groupId?: string;
    hoursBack?: number;
    sendToGroup?: boolean;
}

const DEFAULT_PROMPT = `Você é um assistente executivo eficiente e analítico.
Analise as mensagens do grupo de WhatsApp "{grupo}" abaixo.

📊 **Estrutura do Resumo:**

1. 📈 **Atividade Geral**
   - Total de mensagens analisadas
   - Período de maior atividade
   - Nível de engajamento (baixo/médio/alto)

2. 👥 **Membros Mais Ativos**
   - Liste os 3-5 participantes mais ativos
   - Indique o tipo de participação (iniciador de discussões, respondedor, etc.)

3. 💬 **Principais Assuntos Discutidos**
   - Liste os 3-5 tópicos mais relevantes
   - Destaque decisões tomadas ou pendentes
   - Mencione datas/prazos importantes

4. 📌 **Destaques e Ações**
   - Decisões finalizadas ✅
   - Tarefas pendentes ⏳
   - Compromissos agendados 📅

5. 💡 **Insights**
   - Tendências observadas
   - Sugestões de acompanhamento

**Regras:**
- Ignore mensagens genéricas (Bom dia, Boa noite, Ok, etc.)
- Use formatação Markdown para WhatsApp (*Negrito*, _itálico_)
- Seja conciso mas informativo
- Use emojis para destacar seções`;

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY'); // Gateway key

        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

        // Fetch all system settings once
        const { data: systemSettings } = await supabase
            .from('system_settings')
            .select('key, value');

        const getSystemSetting = (key: string) => systemSettings?.find((s: any) => s.key === key)?.value;

        const EVOLUTION_API_URL = getSystemSetting('EVOLUTION_API_URL') || Deno.env.get('EVOLUTION_API_URL');
        const EVOLUTION_API_KEY = getSystemSetting('EVOLUTION_API_KEY') || Deno.env.get('EVOLUTION_API_KEY');

        // Get current AI settings
        const aiModel = getSystemSetting('SUMMARY_AI_MODEL') || 'google/gemini-1.5-flash';
        const aiProvider = getSystemSetting('SUMMARY_AI_PROVIDER') || 'google';

        // Get the correct API key based on the provider
        let providerApiKey: string | undefined;
        if (aiProvider === 'openai') {
            providerApiKey = getSystemSetting('OPENAI_API_KEY');
        } else if (aiProvider === 'anthropic') {
            providerApiKey = getSystemSetting('ANTHROPIC_API_KEY');
        } else if (aiProvider === 'google') {
            providerApiKey = getSystemSetting('GOOGLE_API_KEY') || getSystemSetting('LOVABLE_API_KEY') || LOVABLE_API_KEY;
        } else if (aiProvider === 'groq') {
            providerApiKey = getSystemSetting('GROQ_API_KEY');
        }

        // Default to LOVABLE_API_KEY for the gateway if no specific key is found or if using Lovable models
        const finalApiKey = providerApiKey || LOVABLE_API_KEY;

        if (!finalApiKey) {
            throw new Error(`API Key not found for provider: ${aiProvider}. Please check system_settings for ${aiProvider.toUpperCase()}_API_KEY or LOVABLE_API_KEY.`);
        }

        // Get user from auth header
        let userId: string | null = null;
        let userEmail: string | undefined;
        let token: string | undefined;

        const authHeader = req.headers.get('Authorization');
        if (authHeader) {
            token = authHeader.replace('Bearer ', '');
            const { data: { user } } = await supabase.auth.getUser(token);
            userId = user?.id || null;
            userEmail = user?.email;
        }

        const { groupId, hoursBack = 24, sendToGroup = false } = await req.json() as RequestBody;

        console.log(`Generating summary for userId: ${userId}, groupId: ${groupId || 'all'}, hours: ${hoursBack}`);
        console.log(`Using AI: ${aiModel} (${aiProvider})`);

        // Get user settings and plan
        let userSettings: any = null;
        let userPlan: any = null;

        if (userId) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('plan_id')
                .eq('user_id', userId)
                .maybeSingle();

            if (profile?.plan_id) {
                const { data: plan } = await supabase
                    .from('plans')
                    .select('*')
                    .eq('id', profile.plan_id)
                    .maybeSingle();
                userPlan = plan;
            }

            const { data: settings } = await supabase
                .from('user_settings')
                .select('*')
                .eq('user_id', userId)
                .maybeSingle();
            userSettings = settings;
        }

        // Limit Enforcement Logic
        const today = new Date().toISOString().split('T')[0];

        // Check usage via ai_token_usage table which tracks all AI requests by user
        const { count: todayusageCount, error: usageError } = await supabase
            .from('ai_token_usage')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('created_at', `${today}T00:00:00.000Z`)
            .lte('created_at', `${today}T23:59:59.999Z`);

        if (usageError) console.error('Error checking usage:', usageError);

        // Define limits (Safe defaults based on Plan)
        // Assuming max_messages_per_day roughly maps to 10x summaries (approx 50 msgs/summary)
        // If userPlan is undefined or null, default to strict limits (5)
        // -1 means unlimited
        const usageLimit = userPlan?.max_messages_per_day === -1
            ? Infinity
            : (userPlan?.max_messages_per_day ? Math.floor(userPlan.max_messages_per_day / 50) : 5);

        console.log(`Usage Check for ${userId || 'unknown'}: ${todayusageCount} / ${usageLimit} (Plan: ${userPlan?.name || 'Unknown'})`);

        if (userPlan?.max_messages_per_day !== -1 && (todayusageCount || 0) >= usageLimit) {
            return new Response(JSON.stringify({
                error: 'Limite diário de resumos atingido. Faça upgrade do seu plano para continuar.'
            }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const minMessagesForSummary = userSettings?.min_messages_for_summary ?? 10;
        const customPrompt = (userPlan?.price_monthly > 0) ? userSettings?.custom_prompt : null;

        // Get groups
        let groupsQuery = supabase
            .from('groups')
            .select('id, jid, name, instance_id')
            .eq('is_active', true);

        if (groupId) {
            groupsQuery = groupsQuery.eq('id', groupId);
        } else if (userId) {
            const { data: userInstances } = await supabase
                .from('instances')
                .select('id')
                .eq('user_id', userId);

            if (userInstances && userInstances.length > 0) {
                groupsQuery = groupsQuery.in('instance_id', userInstances.map((i: any) => i.id));
            }
        }

        const { data: groups, error: groupsError } = await groupsQuery;
        if (groupsError) throw groupsError;
        if (!groups || groups.length === 0) {
            return new Response(JSON.stringify({ message: 'No active groups found' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const results = [];
        const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();

        for (const group of groups) {
            console.log(`Processing group: ${group.name}`);

            const { data: messages, error: messagesError } = await supabase
                .from('messages')
                .select('sender_name, content, received_at')
                .eq('group_id', group.id)
                .gte('received_at', cutoffTime)
                .order('received_at', { ascending: true });

            if (messagesError || !messages || messages.length < minMessagesForSummary) {
                console.log(`Group ${group.name} skipped: ${messages?.length || 0} messages`);
                results.push({
                    group: group.name,
                    skipped: true,
                    reason: messages?.length === 0 ? 'Sem mensagens' : `Poucas mensagens (${messages?.length}/${minMessagesForSummary})`
                });
                continue;
            }

            const transcript = messages.map((m: any) => `${m.sender_name}: ${m.content}`).join('\n');
            const basePrompt = customPrompt || DEFAULT_PROMPT;
            const userPrompt = `${basePrompt.replace(/\{grupo\}/g, group.name)}\n\nTranscrições:\n${transcript}`;

            // Determine correct endpoint based on provider
            let aiEndpoint: string;
            let modelName = aiModel;

            if (aiProvider === 'openai') {
                aiEndpoint = 'https://api.openai.com/v1/chat/completions';
                // OpenAI models should not have prefix
                modelName = aiModel.replace('openai/', '');
            } else if (aiProvider === 'anthropic') {
                aiEndpoint = 'https://api.anthropic.com/v1/messages';
            } else if (aiProvider === 'groq') {
                aiEndpoint = 'https://api.groq.com/openai/v1/chat/completions';
                modelName = aiModel.replace('groq/', '');
            } else {
                // Default to Lovable Gateway for google and other providers
                aiEndpoint = 'https://ai.gateway.lovable.dev/v1/chat/completions';
            }

            console.log(`Calling AI: ${aiEndpoint} with model ${modelName}`);

            // Call AI with appropriate endpoint
            const aiResponse = await fetch(aiEndpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${finalApiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: modelName,
                    messages: [
                        { role: 'system', content: 'Você é um assistente executivo altamente eficiente.' },
                        { role: 'user', content: userPrompt }
                    ],
                    temperature: 0.3,
                }),
            });


            if (!aiResponse.ok) {
                const err = await aiResponse.text();
                console.error(`AI Error for ${group.name}: ${err}`);
                results.push({ group: group.name, error: 'Falha na IA' });
                continue;
            }

            const aiData = await aiResponse.json();
            const summaryContent = aiData.choices?.[0]?.message?.content;
            const tokensUsed = aiData.usage?.total_tokens || 0;

            if (!summaryContent) continue;

            // Save summary
            const { error: insertError } = await supabase
                .from('summaries')
                .insert({ group_id: group.id, summary_content: summaryContent });

            if (insertError) {
                console.error('Save error:', insertError);
                continue;
            }

            // Record usage
            if (userId && tokensUsed > 0) {
                await supabase.from('ai_token_usage').insert({
                    user_id: userId,
                    model: aiData.model || aiModel,
                    request_type: 'generate-summary',
                    tokens_used: tokensUsed,
                });
            }

            // 1. Send to Email (Primary method)
            if (userId) {
                const emailEnabled = userSettings?.email_summary_enabled !== false;

                if (emailEnabled) {
                    const targetEmail = userSettings?.notification_email || userEmail;
                    if (targetEmail) {
                        console.log(`Sending email summary to ${targetEmail}`);

                        await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                to: targetEmail,
                                subject: `Resumo do Grupo: ${group.name}`,
                                htmlContent: `
                  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Resumo Executivo: ${group.name}</h2>
                    <div style="white-space: pre-wrap; background: #f4f4f5; padding: 20px; border-radius: 8px;">${summaryContent}</div>
                    <p style="color: #666; font-size: 12px; margin-top: 20px;">
                      Gerado automaticamente por ZapDigest Hub
                    </p>
                  </div>
                `,
                                userId: userId,
                                emailType: 'daily_summary'
                            }),
                        });
                    }
                }
            }

            results.push({ group: group.name, success: true });
        }

        return new Response(JSON.stringify({ results }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error: any) {
        console.error('Global error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
