// Version: 2.5 - Dynamic Frequencies
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

        const { data: systemSettings } = await supabase.from('system_settings').select('key, value');
        const getSystemSetting = (key: string) => systemSettings?.find((s: any) => s.key === key)?.value;

        const aiModel = getSystemSetting('SUMMARY_AI_MODEL') || 'google/gemini-1.5-flash';
        const aiProvider = getSystemSetting('SUMMARY_AI_PROVIDER') || 'google';

        let providerApiKey: string | undefined;
        if (aiProvider === 'openai') providerApiKey = getSystemSetting('OPENAI_API_KEY');
        else if (aiProvider === 'anthropic') providerApiKey = getSystemSetting('ANTHROPIC_API_KEY');
        else if (aiProvider === 'google') providerApiKey = getSystemSetting('GOOGLE_API_KEY') || getSystemSetting('LOVABLE_API_KEY') || LOVABLE_API_KEY;
        else if (aiProvider === 'groq') providerApiKey = getSystemSetting('GROQ_API_KEY');

        const finalApiKey = providerApiKey || LOVABLE_API_KEY;
        if (!finalApiKey) throw new Error(`API Key not found for provider: ${aiProvider}`);

        const now = new Date();
        const brasiliaOffset = -3 * 60;
        const brasiliaTime = new Date(now.getTime() + (now.getTimezoneOffset() + brasiliaOffset) * 60000);
        const currentDateStr = brasiliaTime.toISOString().split('T')[0];
        const currentDayOfWeek = brasiliaTime.getDay();
        const currentTimeStr = `${brasiliaTime.getHours().toString().padStart(2, '0')}:${brasiliaTime.getMinutes().toString().padStart(2, '0')}`;

        console.log(`Auto-generate check at ${currentTimeStr} (Brasilia)`);

        const { data: usersToProcess } = await supabase
            .from('user_settings')
            .select('user_id, custom_prompt, auto_generate_time, last_auto_generate_at, auto_generate_frequency, min_messages_for_summary, email_summary_enabled, notification_email')
            .eq('auto_generate_enabled', true);

        if (!usersToProcess || usersToProcess.length === 0) return new Response(JSON.stringify({ message: 'No users' }), { headers: corsHeaders });

        const { force } = await req.json().catch(() => ({})) as { force?: boolean };

        // ... (Matching Users Logic - no change)
        const matchingUsers: any[] = usersToProcess.filter((user: any) => {
            // ... Logic remains the same ...
            if (force) return true;
            const scheduledTime = user.auto_generate_time?.slice(0, 5) || '09:00';
            const [schH, schM] = scheduledTime.split(':').map(Number);
            const [curH, curM] = currentTimeStr.split(':').map(Number);
            const diff = Math.abs((schH * 60 + schM) - (curH * 60 + curM));
            const isRightTime = diff <= 5 || diff >= (1440 - 5);
            if (!isRightTime) return false;

            const lastRun = user.last_auto_generate_at;
            const freq = user.auto_generate_frequency || 'daily';
            if (freq === 'daily') return lastRun !== currentDateStr;
            if (freq === 'every_2_days') {
                if (!lastRun) return true;
                const days = Math.floor((brasiliaTime.getTime() - new Date(lastRun).getTime()) / 86400000);
                return days >= 2;
            }
            if (freq === '3_times_week') return [1, 3, 5].includes(currentDayOfWeek) && lastRun !== currentDateStr;
            return false;
        });

        // PARALLEL PROCESSING
        const processGroup = async (group: any, uSettings: any, plan: any) => {
            try {
                const cutoff = new Date(Date.now() - 86400000).toISOString();
                const { data: messages } = await supabase.from('messages').select('sender_name, content').eq('group_id', group.id).gte('message_ts', cutoff).order('message_ts', { ascending: true });
                if (!messages || messages.length < (uSettings.min_messages_for_summary ?? 10)) return null;

                const transcript = messages.map((m: any) => `${m.sender_name}: ${m.content}`).join('\n');
                const prompt = `${(uSettings.custom_prompt || DEFAULT_PROMPT).replace(/\{grupo\}/g, group.name)}\n\nTranscrições:\n${transcript}`;

                let aiEndpoint = 'https://ai.gateway.lovable.dev/v1/chat/completions';
                let model = aiModel;
                if (aiProvider === 'openai') { aiEndpoint = 'https://api.openai.com/v1/chat/completions'; model = aiModel.replace('openai/', ''); }
                else if (aiProvider === 'anthropic') aiEndpoint = 'https://api.anthropic.com/v1/messages';
                else if (aiProvider === 'groq') { aiEndpoint = 'https://api.groq.com/openai/v1/chat/completions'; model = aiModel.replace('groq/', ''); }

                const aiRes = await fetch(aiEndpoint, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${finalApiKey}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ model, messages: [{ role: 'system', content: 'Assistente de resumos.' }, { role: 'user', content: prompt }], temperature: 0.3 }),
                });

                if (!aiRes.ok) return null;
                const aiData = await aiRes.json();
                const summary = aiData.choices?.[0]?.message?.content;
                if (!summary) return null;

                // Persistence
                await supabase.from('summaries').insert({ group_id: group.id, summary_content: summary });

                // Track Usage (Fire & Forget)
                supabase.from('ai_token_usage').insert({ user_id: uSettings.user_id, model: aiData.model || aiModel, request_type: 'auto-generate', tokens_used: aiData.usage?.total_tokens || 0 }).then();

                // Queue Email
                if (uSettings.email_summary_enabled) {
                    let email = uSettings.notification_email;
                    // We can optimize this by fetching email ONLY if missing, or passing it down
                    if (!email) { const { data } = await supabase.auth.admin.getUserById(uSettings.user_id); email = data?.user?.email; }

                    if (email) {
                        await supabase.from('delivery_queue').insert({
                            type: 'email',
                            payload: {
                                to: email,
                                subject: `Resumo Automático: ${group.name}`,
                                htmlContent: `<h2>${group.name}</h2><pre>${summary}</pre>`,
                                userId: uSettings.user_id,
                                emailType: 'auto_summary'
                            },
                            status: 'pending'
                        });
                    }
                }
                return { group: group.name, success: true };
            } catch (e) {
                console.error(`Error processing group ${group.id}:`, e);
                return { group: group.name, success: false, error: e };
            }
        };

        const processUser = async (uSettings: any) => {
            const userId = uSettings.user_id;
            await supabase.from('user_settings').update({ last_auto_generate_at: currentDateStr }).eq('user_id', userId);

            const { data: profile } = await supabase.from('profiles').select('plan_id').eq('user_id', userId).maybeSingle();
            const { data: plan } = profile?.plan_id ? await supabase.from('plans').select('*').eq('id', profile.plan_id).single() : { data: null };

            const { data: instances } = await supabase.from('instances').select('id, name').eq('user_id', userId).eq('status', 'connected');
            if (!instances?.length) return [];

            const { data: groups } = await supabase.from('groups').select('id, jid, name').eq('is_active', true).in('instance_id', instances.map((i: any) => i.id));
            if (!groups?.length) return [];

            // Process groups in parallel
            const groupResults = await Promise.all(groups.map((g: any) => processGroup(g, uSettings, plan)));
            return groupResults.filter(Boolean);
        };

        // Execute all users in parallel
        const resultsNested = await Promise.all(matchingUsers.map(processUser));
        const results = resultsNested.flat();

        return new Response(JSON.stringify({ results }), { headers: corsHeaders });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }
});
