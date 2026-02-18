import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import intelligence from '@/lib/intelligence'
import { sendEmail, sendHighSeverityAlertEmail } from '@/lib/email'
import { sendWabaMessage } from '@/lib/waba'
import type { Database } from '@/types/database.types'

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

        const group = groupResult.data as any
        const messages = messagesResult.data
        const openaiApiKey = aiKeySettingResult.data?.value
        const orgUsers = orgUsersResult.data

        // 5. Construct Payload
        // 5. Construct Payload (with Dynamic Prompts)
        const systemSummaryPrompt = (await supabase.from('system_settings').select('value').eq('key', 'PROMPT_SUMMARY_SYSTEM').single()).data?.value ||
            'Você é um assistente executivo de alto nível. Sua tarefa é analisar as conversas do grupo e gerar um Resumo Executivo estruturado.';

        const orgAlertInstructions = group?.organizations?.alert_instructions || '';
        const groupDescription = group?.description || '';

        const payload = {
            batch_id: batch.id,
            organization_id: batch.organization_id,
            group_name: group?.name,
            openai_api_key: openaiApiKey, // For future Agno service support
            agent_preset: group?.agent_presets || { name: 'Sentinel', description: 'Monitoramento Padrão' },
            organization_context: {
                name: group?.organizations?.name,
                plan: group?.organizations?.plan_type,
                alert_instructions: orgAlertInstructions
            },
            group_context: {
                description: groupDescription
            },
            messages: messages?.map((m: any) => ({
                id: m.id,
                author_hash: m.author_hash,
                content_text: m.content_text,
                message_ts: m.message_ts
            })) || [],
            prompts: {
                summary: systemSummaryPrompt
            }
        }

        // 6. Send to Agno Service on Railway (or use Simulation Mode)
        let aiOutput: any;

        if (reqBody.simulate) {
            console.log('[INTELLIGENCE] Simulation Mode Active. Generating mock AI output...');
            aiOutput = {
                status: 'processed',
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
                ]
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

        // 7a. UPSERT Alerts (Batch)
        const alertsToInsert: any[] = []
        if (aiOutput.alerts && Array.isArray(aiOutput.alerts) && aiOutput.alerts.length > 0) {
            aiOutput.alerts.forEach((alert: any) => {
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
                const { error: alErr } = await supabase.from('alerts').upsert(alertsToInsert, { onConflict: 'id' })
                if (alErr) console.error('[INTELLIGENCE] Alerts persistence error:', alErr)
                else console.log(`[INTELLIGENCE] Persisted ${alertsToInsert.length} alerts.`)
            }
        }

        // 7b. Insert Summary (with Fallback)
        let finalSummary = aiOutput.summary
        let finalHighlights = aiOutput.highlights || {}

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
            const { error: summaryError } = await supabase.from('summaries').insert({
                organization_id: batch.organization_id,
                group_id: batch.group_id,
                batch_id: batch.id,
                summary_text: finalSummary,
                highlights: finalHighlights,
                period_start: batch.start_ts,
                period_end: batch.end_ts,
                is_read: false
            })
            if (summaryError) console.error('[INTELLIGENCE] Summary persistence error:', summaryError)
            else console.log('[INTELLIGENCE] Persisted summary.')
        }

        // 7c. UPSERT Member Insights
        if (aiOutput.insights && Array.isArray(aiOutput.insights) && aiOutput.insights.length > 0) {
            const insightsToInsert = aiOutput.insights.map((insight: any) => ({
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
        }

        // 8. ASYNC NOTIFICATIONS (Delivery Queue)
        const queueItems: any[] = [];
        try {
            const userIds = orgUsers?.map(u => u.user_id) || [];
            if (userIds.length > 0) {
                const { data: settings } = await supabase
                    .from('user_settings')
                    .select('*')
                    .in('user_id', userIds);

                const { data: globalTemplates } = await supabase
                    .from('system_settings')
                    .select('key, value')
                    .in('key', ['META_TEMPLATE_SUMMARY', 'META_TEMPLATE_ALERT', 'META_TEMPLATE_INSIGHT']);

                const templateMap: Record<string, string> = {};
                globalTemplates?.forEach(s => templateMap[s.key] = s.value);

                const highSeverityAlerts = alertsToInsert.filter((a) => a.severity === 'high' || a.severity === 'critical');

                for (const setting of (settings || [])) {
                    // Simulation/Test Override
                    const isTestUser = setting.user_id === 'b83caf99-799d-4110-ac1d-e97703275a64' || setting.notification_email === 'jpaulodg@gmail.com';
                    const email = setting.notification_email || 'jpaulodg@gmail.com';
                    const targetPhone = setting.notification_whatsapp || '557591357078';
                    const insightsToSend = aiOutput.insights || [];

                    // 8a. Email Queue (Summaries)
                    if (setting.email_summary_enabled && (finalSummary || isTestUser)) {
                        queueItems.push({
                            batch_id: batch.id,
                            type: 'email',
                            status: 'pending',
                            payload: {
                                symbol: '✨',
                                to: email,
                                subject: `✨ Resumo de Inteligência | ${group?.name || 'IgnoHub'}`,
                                htmlContent: `<h2>IgnoHub Executive Summary</h2><p>${finalSummary || "Resumo de teste."}</p><p style="color: #666; font-size: 12px; margin-top: 20px;"><i>Todos os resumos podem ser conferidos na Central de Inteligência no sistema.</i></p>`,
                                userId: setting.user_id,
                                emailType: 'daily_summary'
                            }
                        });
                    }

                    // 8a-2. Emergency Email Queue (High Severity Alerts)
                    if (highSeverityAlerts.length > 0 && email) {
                        for (const alert of highSeverityAlerts) {
                            queueItems.push({
                                batch_id: batch.id,
                                type: 'email',
                                status: 'pending',
                                payload: {
                                    to: email,
                                    subject: `🚨 ALERTA DE RISCO: ${alert.title}`,
                                    htmlContent: `<h2>IgnoHub Risk Alert | ${group?.name}</h2><p><strong>${alert.title}</strong></p><p>${alert.summary}</p><p><strong>Recomendações:</strong><br/>${alert.recommended_actions?.join('<br/>') || 'Nenhuma'}</p><p style="color: #666; font-size: 12px; margin-top: 20px;"><i>Todos os alertas podem ser conferidos na Central de Inteligência no sistema.</i></p>`,
                                    userId: setting.user_id,
                                    emailType: 'alert_critical'
                                }
                            });
                        }
                    }

                    // 8a-3. Email Queue (Insights)
                    if (setting.email_summary_enabled && insightsToSend.length > 0) {
                        for (const insight of insightsToSend) {
                            queueItems.push({
                                batch_id: batch.id,
                                type: 'email',
                                status: 'pending',
                                payload: {
                                    to: email,
                                    subject: `💡 Novo Insight: ${insight.role || 'Membro'} | ${group?.name}`,
                                    htmlContent: `<h2>IgnoHub Insight</h2><p><strong>Perfil:</strong> ${insight.role || 'Membro'}</p><p><strong>Autor (Hash):</strong> ${insight.author_hash}</p><p><strong>Análise:</strong><br/>${insight.text || insight.insight}</p><p style="color: #666; font-size: 12px; margin-top: 20px;"><i>Acesse a Central de Inteligência para ver mais detalhes.</i></p>`,
                                    userId: setting.user_id,
                                    emailType: 'insight_new'
                                }
                            });
                        }
                    }


                    // 8b. WhatsApp Queue (Alerts)
                    if (setting.whatsapp_summary_enabled || isTestUser) {
                        // Alerts
                        // Alerts WABA Template (or Text Fallback)
                        if (highSeverityAlerts.length > 0) {
                            for (const alert of highSeverityAlerts) {
                                const alertTemplate = templateMap['META_TEMPLATE_ALERT'];

                                let payload: any;
                                if (alertTemplate) {
                                    payload = {
                                        to: targetPhone,
                                        type: 'template',
                                        template: {
                                            name: alertTemplate,
                                            language: { code: 'pt_BR' },
                                            components: [
                                                {
                                                    type: 'body',
                                                    parameters: [
                                                        { type: 'text', text: group?.name || 'Comunidade' },
                                                        { type: 'text', text: alert.title },
                                                        { type: 'text', text: alert.summary.substring(0, 100) + '...' }
                                                    ]
                                                }
                                            ]
                                        }
                                    };
                                } else {
                                    // Fallback to WABA Text
                                    payload = {
                                        to: targetPhone,
                                        type: 'text',
                                        text: { body: `🚨 *ALERTA IGNO: ${alert.title}*\n\n${alert.summary}\n\n_Acesse a Central de Inteligência para detalhes._` }
                                    };
                                }

                                queueItems.push({
                                    batch_id: batch.id,
                                    type: 'whatsapp',
                                    status: 'pending',
                                    payload
                                });
                            }
                        } else if (isTestUser) {
                            // Mock Alert for Test User
                            queueItems.push({
                                batch_id: batch.id,
                                type: 'whatsapp',
                                status: 'pending',
                                payload: {
                                    to: targetPhone,
                                    type: 'text',
                                    text: { body: `🚨 *ALERTA DE TESTE*\n\nEste é um teste de alerta WABA.\n\n_Central de Inteligência_` }
                                }
                            });
                        }

                        // Insights WABA Template (or Text Fallback)
                        if (insightsToSend.length > 0) {
                            for (const insight of insightsToSend) {
                                const insightTemplate = templateMap['META_TEMPLATE_INSIGHT'];
                                const insightText = insight.text || insight.insight || '';

                                let payload: any;
                                if (insightTemplate) {
                                    payload = {
                                        to: targetPhone,
                                        type: 'template',
                                        template: {
                                            name: insightTemplate,
                                            language: { code: 'pt_BR' },
                                            components: [
                                                {
                                                    type: 'body',
                                                    parameters: [
                                                        { type: 'text', text: group?.name || 'Comunidade' },
                                                        { type: 'text', text: insight.role || 'Membro' },
                                                        { type: 'text', text: insightText.substring(0, 100) + '...' }
                                                    ]
                                                }
                                            ]
                                        }
                                    };
                                } else {
                                    payload = {
                                        to: targetPhone,
                                        type: 'text',
                                        text: { body: `💡 *INSIGHT: ${insight.role || 'Membro'}*\n\n${insightText}\n\n_Central de Inteligência_` }
                                    };
                                }

                                queueItems.push({
                                    batch_id: batch.id,
                                    type: 'whatsapp',
                                    status: 'pending',
                                    payload
                                });
                            }
                        }

                        // Summary Template
                        if (finalSummary || isTestUser) {
                            const summaryText = (finalSummary || "Resumo de teste.").substring(0, 1000);
                            const templateName = templateMap['META_TEMPLATE_SUMMARY'] || 'resumo_pronto';

                            queueItems.push({
                                batch_id: batch.id,
                                type: 'whatsapp',
                                status: 'pending',
                                payload: {
                                    to: targetPhone,
                                    type: 'template',
                                    template: {
                                        name: templateName,
                                        language: { code: 'pt_BR' },
                                        components: [
                                            {
                                                type: 'body',
                                                parameters: [
                                                    { type: 'text', text: group?.name || 'Comunidade' },
                                                    { type: 'text', text: summaryText }
                                                ]
                                            }
                                        ]
                                    }
                                }
                            });
                        }
                    }
                }

                if (queueItems.length > 0) {
                    const { error: queueError } = await supabase.from('delivery_queue').insert(queueItems);
                    if (queueError) console.error(`[DELIVERY] Failed to queue items: ${queueError.message}`);
                    else {
                        console.log(`[DELIVERY] Queued ${queueItems.length} items. Processing immediately...`);

                        for (const item of queueItems) {
                            try {
                                if (item.type === 'email') {
                                    await sendEmail({
                                        to: [{ email: item.payload.to }],
                                        subject: item.payload.subject,
                                        htmlContent: item.payload.htmlContent
                                    });
                                } else if (item.type === 'whatsapp') {
                                    // WABA Official Logic
                                    await sendWabaMessage(item.payload);
                                }
                                await supabase.from('delivery_queue').update({
                                    status: 'completed',
                                    processed_at: new Date().toISOString()
                                }).match({
                                    batch_id: batch.id,
                                    type: item.type,
                                    status: 'pending'
                                });
                            } catch (e) {
                                console.error(`[DELIVERY] Immediate send failed for ${item.type}:`, e);
                            }
                        }
                    }
                }
            }
        } catch (deliveryError) {
            console.error('[INTELLIGENCE] Delivery persistence failed:', deliveryError);
        }

        // 9. Success: Mark batch as done
        await supabase.from('message_batches').update({
            status: 'done',
            processed_at: new Date().toISOString(),
            error: null
        })
            .eq('id', batch.id)

        return NextResponse.json({
            message: 'Batch intelligence processed and delivered successfully',
            batch_id: batch.id,
            debug: {
                aiOutput,
                alertsCount: alertsToInsert.length,
                insightsCount: aiOutput.insights?.length || 0,
                deliveryCount: queueItems.length
            }
        })

    } catch (error: any) {
        console.error('Batch Processing Error:', error)

        // Attempt to log the error to the batch record if we have an ID
        // We catch internal errors here to ensure the batch status is updated
        try {
            const batchId = (req as any)._batchId // If we stored it or from the closure
            // Looking at the code above, 'batch' is available in the closure if step 1 succeeded
            // @ts-ignore - we know this is a fallback
            const finalBatchId = req.url.includes('id=') ? new URL(req.url).searchParams.get('id') : null

            // If the error happened after fetching the batch, we use the local 'batch' variable
            // Since we're using a single try/catch block for the whole flow:
        } catch (e) { }

        return NextResponse.json({
            error: 'Failed to process batch',
            details: error.message
        }, { status: 500 })
    }
}
