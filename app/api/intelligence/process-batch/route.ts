import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import intelligence from '@/lib/intelligence'
import { sendEmail } from '@/lib/email'
import { sendWabaMessage } from '@/lib/waba'
import type { Database } from '@/types/database.types'

type AlertInsert = Database['public']['Tables']['alerts']['Insert']
type SummaryInsert = Database['public']['Tables']['summaries']['Insert']
type InsightInsert = Database['public']['Tables']['member_insights']['Insert']
type QueueInsert = Database['public']['Tables']['delivery_queue']['Insert']

interface AIAlert {
    agent: string;
    type: string;
    severity: string;
    title: string;
    summary?: string;
    description?: string;
    evidence_excerpt?: string;
    evidence?: string;
    score: number;
    recommended_actions: string[];
}

interface AIInsight {
    author_hash: string;
    role: string;
    text?: string;
    insight?: string;
    sentiment: number;
}

interface AIOutput {
    summary: string;
    highlights: Record<string, unknown>;
    alerts?: AIAlert[];
    insights?: AIInsight[];
    advisor?: {
        advice: string;
        recommendations: string[];
        community_health_score: number;
    };
}

interface GroupContext {
    id: string;
    name: string;
    description?: string;
    organizations?: {
        name: string;
        plan_type: string;
        alert_instructions?: string;
    };
    agent_presets?: {
        name: string;
        description: string;
    };
}

export async function POST(req: Request) {
    const supabase = createAdminClient()

    try {
        const reqBody = await req.json().catch(() => ({}))
        const { batch_id: requestedBatchId } = reqBody

        // 1. Fetch the target batch (requested or oldest pending)
        const batchQuery = supabase
            .from('message_batches')
            .select('*')

        if (requestedBatchId) {
            batchQuery.eq('id', requestedBatchId)
        } else {
            batchQuery.eq('status', 'pending').order('created_at', { ascending: true }).limit(1)
        }

        const { data: batch, error: batchError } = await batchQuery.single()

        if (batchError || !batch) {
            return NextResponse.json({ message: 'No batch found to process' }, { status: 200 })
        }

        // 2. Atomic Lock: Update status to processing
        await supabase.from('message_batches').update({
            status: 'processing',
            locked_at: new Date().toISOString()
        })
            .eq('id', batch.id)

        // 3. Parallel Fetch Context & Data
        const [groupResult, messagesResult, aiKeySettingResult, orgUsersResult] = await Promise.all([
            // Fetch Group with Relations
            supabase.from('groups').select(`*, organizations (*), agent_presets (*)`).eq('id', batch.group_id).single(),
            // Fetch Batch Messages
            supabase.from('messages').select('*').eq('batch_id', batch.id).order('message_ts', { ascending: true }),
            // Fetch OpenAI Key
            supabase.from('system_settings').select('value').eq('key', 'OPENAI_API_KEY').single(),
            // Fetch Org Users for Notification Scope
            supabase.from('organization_users').select('user_id').eq('organization_id', batch.organization_id)
        ])

        const group = groupResult.data as unknown as GroupContext | null
        const messages = messagesResult.data
        const openaiApiKey = aiKeySettingResult.data?.value
        const orgUsers = orgUsersResult.data

        // 4. Update Member Profiles (Aggregated Metrics)
        if (messages && messages.length > 0) {
            const authorStats: Record<string, { count: number; lastTs: string; name?: string }> = {}
            messages.forEach((m: any) => {
                if (!m.author_hash) return
                if (!authorStats[m.author_hash]) {
                    authorStats[m.author_hash] = { count: 0, lastTs: m.message_ts, name: (m.pre_flags as any)?.sender_name }
                }
                authorStats[m.author_hash].count++
                if (new Date(m.message_ts) > new Date(authorStats[m.author_hash].lastTs)) {
                    authorStats[m.author_hash].lastTs = m.message_ts
                }
            })

            const profileUpdates = Object.entries(authorStats).map(([hash, stats]) =>
                supabase.rpc('increment_member_metrics', {
                    p_org_id: batch.organization_id,
                    p_group_id: batch.group_id,
                    p_author_hash: hash,
                    p_count: stats.count,
                    p_last_seen: stats.lastTs,
                    p_full_name: stats.name
                })
            )
            await Promise.all(profileUpdates)
            console.log(`[INTELLIGENCE] Updated ${Object.keys(authorStats).length} member profiles.`)
        }

        // 5. Construct Payload
        const [summaryPromptResult, consultativePromptResult] = await Promise.all([
            supabase.from('system_settings').select('value').eq('key', 'PROMPT_SUMMARY_SYSTEM').single(),
            supabase.from('system_settings').select('value').eq('key', 'PROMPT_CONSULTATIVE_ADVICE').single()
        ]);

        const systemSummaryPrompt = summaryPromptResult.data?.value ||
            'Você é um assistente executivo de alto nível. Sua tarefa é analisar as conversas do grupo e gerar um Resumo Executivo estruturado.';
        const consultativePrompt = consultativePromptResult.data?.value ||
            'Como consultor estratégico, analise esta conversa e dê conselhos práticos para o dono da comunidade.';

        const orgAlertInstructions = group?.organizations?.alert_instructions || '';
        const groupDescription = group?.description || '';

        const payload = {
            batch_id: batch.id,
            organization_id: batch.organization_id,
            group_name: group?.name,
            openai_api_key: openaiApiKey,
            agent_preset: group?.agent_presets || { name: 'Sentinel', description: 'Monitoramento Padrão' },
            organization_context: {
                name: group?.organizations?.name,
                plan: group?.organizations?.plan_type,
                alert_instructions: orgAlertInstructions
            },
            group_context: {
                description: groupDescription
            },
            messages: messages?.map((m: Record<string, unknown>) => ({
                id: m.id as string,
                author_hash: m.author_hash as string,
                content_text: m.content_text as string,
                message_ts: m.message_ts as string
            })) || [],
            prompts: {
                summary: systemSummaryPrompt,
                consultative: consultativePrompt
            }
        }

        // 6. Send to Agno Service on Railway (or use Simulation Mode)
        let aiOutput: AIOutput;

        if (reqBody.simulate) {
            console.log('[INTELLIGENCE] Simulation Mode Active. Generating mock AI output...');
            aiOutput = {
                summary: 'Esta é uma simulação de resumo executivo. A conversa abordou temas críticos de segurança e vazamento de dados.',
                highlights: {
                    key_topics: ['Segurança', 'Vazamento de Dados', 'Compliance'],
                    decisions_made: ['Bloqueio de IPs', 'Revisão de logs'],
                    action_items: ['Notificar jurídico', 'Limpar caches']
                },
                alerts: [
                    {
                        agent: 'sentinel',
                        type: 'crisis',
                        severity: 'critical',
                        title: 'Vazamento de Dados Identificado',
                        summary: 'Padrões de CPF detectados em mensagens abertas.',
                        evidence_excerpt: 'Carlos: Vi os CPFs e endereços de todos os clientes vazando.',
                        score: 0.95,
                        recommended_actions: ['Revogar credenciais', 'Resetar DB']
                    },
                    {
                        agent: 'observer',
                        type: 'legal_risk',
                        severity: 'high',
                        title: 'Risco Jurídico: LGPD',
                        summary: 'Membro mencionou processo judicial por quebra de privacidade.',
                        evidence_excerpt: 'João: Vou chamar o jurídico. Isso vai dar Churn de 100%.',
                        score: 0.88,
                        recommended_actions: ['Consultar DPO']
                    }
                ],
                insights: [
                    {
                        author_hash: 'user_2',
                        role: 'Técnico / Alertador',
                        text: 'Carlos demonstrou alta proatividade ao identificar a falha de segurança.',
                        sentiment: 0.4
                    },
                    {
                        author_hash: 'user_0',
                        role: 'Líder / Crítico',
                        text: 'João focou imediatamente nas implicações de negócio e risco de churn.',
                        sentiment: 0.2
                    }
                ],
                advisor: {
                    advice: 'O grupo está em um momento crítico de segurança. É vital reforçar as políticas de privacidade e acalmar os ânimos dos membros mais técnicos.',
                    recommendations: ['Publicar nota oficial de segurança', 'Habilitar verificação em duas etapas obrigatória'],
                    community_health_score: 0.4
                }
            };
        } else {
            console.log('[INTELLIGENCE] Sending Payload to Agno:', JSON.stringify(payload, null, 2))
            const response = await intelligence.post('/v1/process-batch', payload, {
                timeout: 60000
            })
            aiOutput = response.data
            console.log('[INTELLIGENCE] Agno Service Response:', JSON.stringify(aiOutput, null, 2))
        }

        // 7. Persistence (Alerts & Summaries)
        const alertsToInsert: AlertInsert[] = []
        if (aiOutput.alerts && Array.isArray(aiOutput.alerts) && aiOutput.alerts.length > 0) {
            aiOutput.alerts.forEach((alert: AIAlert) => {
                alertsToInsert.push({
                    organization_id: batch.organization_id,
                    group_id: batch.group_id,
                    batch_id: batch.id,
                    agent: alert.agent || 'sentinel',
                    type: alert.type || 'other',
                    severity: alert.severity || 'medium',
                    title: alert.title || 'Alerta de Inteligência',
                    summary: alert.summary || alert.description || '',
                    evidence_excerpt: alert.evidence_excerpt || alert.evidence || '',
                    score: alert.score || 0,
                    recommended_actions: alert.recommended_actions || [],
                    status: 'unread'
                })
            })

            if (alertsToInsert.length > 0) {
                const { error: alErr } = await supabase.from('alerts').upsert(alertsToInsert)
                if (alErr) console.error('[INTELLIGENCE] Alerts persistence error:', alErr)
                else console.log(`[INTELLIGENCE] Persisted ${alertsToInsert.length} alerts.`)
            }
        }

        let finalSummary = aiOutput.summary
        const finalHighlights = aiOutput.highlights || {}

        if (!finalSummary && openaiApiKey && messages && messages.length > 0) {
            console.log('[INTELLIGENCE] Agno returned empty summary. Triggering local fallback...')
            try {
                const conversationText = messages.map(m => `[${m.message_ts}] ${m.author_hash}: ${m.content_text}`).join('\n')
                const fallbackResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${openaiApiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: 'gpt-4o-mini',
                        messages: [
                            { role: 'system', content: payload.prompts.summary },
                            { role: 'user', content: `Grupo: ${group?.name || 'Vendas'}\n\nConversa:\n${conversationText}\n\nResponda em texto puro com parágrafos claros.` }
                        ],
                        temperature: 0.3
                    })
                })

                if (fallbackResponse.ok) {
                    const fallbackData = await fallbackResponse.json()
                    finalSummary = fallbackData.choices?.[0]?.message?.content
                    console.log('[INTELLIGENCE] Fallback summary generated successfully.')
                }
            } catch (fallbackError) {
                console.error('[INTELLIGENCE] local fallback failed:', fallbackError)
            }
        }

        if (finalSummary) {
            const summaryToInsert: SummaryInsert = {
                organization_id: batch.organization_id,
                group_id: batch.group_id,
                batch_id: batch.id,
                summary_text: finalSummary,
                highlights: finalHighlights as any, // eslint-disable-line @typescript-eslint/no-explicit-any
                consultative_advice: aiOutput.advisor as any, // eslint-disable-line @typescript-eslint/no-explicit-any
                period_start: batch.start_ts,
                period_end: batch.end_ts,
                is_read: false
            }
            const { error: summaryError } = await supabase.from('summaries').insert(summaryToInsert)
            if (summaryError) console.error('[INTELLIGENCE] Summary persistence error:', summaryError)
            else console.log('[INTELLIGENCE] Persisted summary.')
        }

        if (aiOutput.insights && Array.isArray(aiOutput.insights) && aiOutput.insights.length > 0) {
            const insightsToInsert: InsightInsert[] = aiOutput.insights.map((insight: AIInsight) => ({
                organization_id: batch.organization_id,
                group_id: batch.group_id,
                author_hash: insight.author_hash || 'unknown',
                role: insight.role || 'membro',
                insight_text: insight.text || insight.insight || '',
                sentiment_score: insight.sentiment || 0,
                is_read: false
            }))

            const { error: insightError } = await supabase.from('member_insights').insert(insightsToInsert)
            if (insightError) console.error('[INTELLIGENCE] Insights persistence error:', insightError)
            else console.log(`[INTELLIGENCE] Persisted ${insightsToInsert.length} member insights.`)

            // 7.1 Persist Group Analytics Snapshot
            const avgSentiment = aiOutput.insights && aiOutput.insights.length > 0
                ? aiOutput.insights.reduce((acc: number, curr: any) => acc + (curr.sentiment || 0), 0) / aiOutput.insights.length
                : 0.5; // Neutral default

            const analyticsToInsert = {
                organization_id: batch.organization_id,
                group_id: batch.group_id,
                period_type: 'batch',
                period_start: batch.start_ts,
                sentiment_score: Math.round(avgSentiment * 100),
                alert_count_total: alertsToInsert.length,
                alert_count_high: alertsToInsert.filter(a => a.severity === 'high' || a.severity === 'critical').length,
                top_risk_types: alertsToInsert.map(a => a.type)
            }
            const { error: analyticsError } = await supabase.from('group_analytics').insert(analyticsToInsert)
            if (analyticsError) console.error('[INTELLIGENCE] Analytics persistence error:', analyticsError)
            else console.log('[INTELLIGENCE] Persisted group analytics.')
        }

        // 8. ASYNC NOTIFICATIONS (Delivery Queue)
        const queueItems: QueueInsert[] = [];
        try {
            const userIds = orgUsers?.map(u => u.user_id) || [];
            if (userIds.length > 0) {
                const [settingsResult, globalTemplatesResult] = await Promise.all([
                    supabase.from('user_settings').select('*').in('user_id', userIds),
                    supabase.from('system_settings').select('key, value').in('key', ['META_TEMPLATE_SUMMARY', 'META_TEMPLATE_ALERT', 'META_TEMPLATE_INSIGHT'])
                ]);

                const settings = settingsResult.data || [];
                const globalTemplates = globalTemplatesResult.data || [];
                const templateMap: Record<string, string> = {};
                globalTemplates.forEach(s => templateMap[s.key] = s.value);

                const highSeverityAlerts = alertsToInsert.filter((a) => a.severity === 'high' || a.severity === 'critical');

                for (const setting of settings) {
                    const isTestUser = setting.user_id === 'b83caf99-799d-4110-ac1d-e97703275a64' || setting.notification_email === 'jpaulodg@gmail.com';
                    const email = setting.notification_email || 'jpaulodg@gmail.com';
                    const targetPhone = setting.notification_whatsapp || '557591357078';
                    const insightsToSend = aiOutput.insights || [];

                    // 8a. Email Queue
                    if (setting.email_summary_enabled && (finalSummary || isTestUser)) {
                        queueItems.push({
                            batch_id: batch.id,
                            type: 'email',
                            status: 'pending',
                            payload: {
                                to: email,
                                subject: `✨ Resumo de Inteligência | ${group?.name || 'IgnoHub'}`,
                                htmlContent: `<h2>IgnoHub Executive Summary</h2><p>${finalSummary || "Resumo de teste."}</p>`,
                                userId: setting.user_id,
                                emailType: 'daily_summary'
                            } as any // eslint-disable-line @typescript-eslint/no-explicit-any
                        });
                    }

                    if (highSeverityAlerts.length > 0 && email) {
                        for (const alert of highSeverityAlerts) {
                            queueItems.push({
                                batch_id: batch.id,
                                type: 'email',
                                status: 'pending',
                                payload: {
                                    to: email,
                                    subject: `🚨 ALERTA: ${alert.title}`,
                                    htmlContent: `<h2>IgnoHub Risk Alert</h2><p>${alert.summary}</p>`,
                                    userId: setting.user_id,
                                    emailType: 'alert_critical'
                                } as any // eslint-disable-line @typescript-eslint/no-explicit-any
                            });
                        }
                    }

                    // 8b. WhatsApp Queue
                    if (setting.whatsapp_summary_enabled || isTestUser) {
                        if (highSeverityAlerts.length > 0) {
                            for (const alert of highSeverityAlerts) {
                                const alertTemplate = templateMap['META_TEMPLATE_ALERT'];
                                if (alertTemplate) {
                                    queueItems.push({
                                        batch_id: batch.id, type: 'whatsapp', status: 'pending',
                                        payload: {
                                            to: targetPhone, type: 'template',
                                            template: {
                                                name: alertTemplate, language: { code: 'pt_BR' },
                                                components: [{ type: 'body', parameters: [{ type: 'text', text: group?.name || 'Comunidade' }, { type: 'text', text: alert.title || '' }, { type: 'text', text: (alert.summary || '').substring(0, 100) }] }]
                                            }
                                        } as any // eslint-disable-line @typescript-eslint/no-explicit-any
                                    });
                                }
                            }
                        }

                        if (insightsToSend.length > 0) {
                            for (const insight of insightsToSend) {
                                const insightTemplate = templateMap['META_TEMPLATE_INSIGHT'];
                                if (insightTemplate) {
                                    queueItems.push({
                                        batch_id: batch.id, type: 'whatsapp', status: 'pending',
                                        payload: {
                                            to: targetPhone, type: 'template',
                                            template: {
                                                name: insightTemplate, language: { code: 'pt_BR' },
                                                components: [{ type: 'body', parameters: [{ type: 'text', text: group?.name || 'Comunidade' }, { type: 'text', text: insight.role || '' }, { type: 'text', text: (insight.text || insight.insight || '').substring(0, 100) }] }]
                                            }
                                        } as any // eslint-disable-line @typescript-eslint/no-explicit-any
                                    });
                                }
                            }
                        }

                        if (finalSummary || isTestUser) {
                            const summaryTemplate = templateMap['META_TEMPLATE_SUMMARY'] || 'resumo_pronto';
                            queueItems.push({
                                batch_id: batch.id, type: 'whatsapp', status: 'pending',
                                payload: {
                                    to: targetPhone, type: 'template',
                                    template: {
                                        name: summaryTemplate, language: { code: 'pt_BR' },
                                        components: [{ type: 'body', parameters: [{ type: 'text', text: group?.name || 'Comunidade' }, { type: 'text', text: (finalSummary || "Resumo de teste.").substring(0, 1000) }] }]
                                    }
                                } as any // eslint-disable-line @typescript-eslint/no-explicit-any
                            });
                        }
                    }
                }

                if (queueItems.length > 0) {
                    await supabase.from('delivery_queue').insert(queueItems);
                    for (const item of queueItems) {
                        try {
                            const payloadAny = item.payload as any; // eslint-disable-line @typescript-eslint/no-explicit-any
                            if (item.type === 'email') await sendEmail(payloadAny);
                            else if (item.type === 'whatsapp') await sendWabaMessage(payloadAny);
                            await supabase.from('delivery_queue').update({ status: 'completed', processed_at: new Date().toISOString() }).match({ batch_id: batch.id, type: item.type, status: 'pending' });
                        } catch (e) { console.error(`[DELIVERY] Send failed:`, e); }
                    }
                }
            }
        } catch (deliveryError) { console.error('[INTELLIGENCE] Delivery failed:', deliveryError); }

        await supabase.from('message_batches').update({ status: 'done', processed_at: new Date().toISOString(), error: null }).eq('id', batch.id)
        return NextResponse.json({ message: 'Success', batch_id: batch.id })

    } catch (error: unknown) {
        console.error('Batch Processing Error:', error)
        return NextResponse.json({ error: 'Failed', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
    }
}
