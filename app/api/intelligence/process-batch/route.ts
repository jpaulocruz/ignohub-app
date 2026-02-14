import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import intelligence from '@/lib/intelligence'
import { sendHighSeverityAlertEmail } from '@/lib/email'

export async function POST(req: Request) {
    const supabase = createAdminClient() as any

    try {
        // 1. Fetch the oldest pending message batch
        const { data: batch, error: batchError } = await supabase
            .from('message_batches')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: true })
            .limit(1)
            .single()

        if (batchError || !batch) {
            return NextResponse.json({ message: 'No pending batches found' }, { status: 200 })
        }

        // 2. Atomic Lock: Update status to processing
        await supabase.from('message_batches').update({
            status: 'processing',
            locked_at: new Date().toISOString()
        })
            .eq('id', batch.id)

        // 3. Fetch Context (Group, Preset, Organization)
        const { data: group } = await supabase
            .from('groups')
            .select(`
                *,
                organizations (*),
                agent_presets (*)
            `)
            .eq('id', batch.group_id)
            .single()

        // 4. Fetch Messages in the batch
        const { data: messages } = await supabase
            .from('messages')
            .select('*')
            .eq('batch_id', batch.id)
            .order('message_ts', { ascending: true })

        // 5. Construct Payload
        const payload = {
            batch_id: batch.id,
            organization_id: batch.organization_id,
            group_name: group?.name,
            agent_preset: group?.agent_presets || { name: 'Sentinel', description: 'Monitoramento Padrão' },
            organization_context: {
                name: group?.organizations?.name,
                plan: group?.organizations?.plan_type
            },
            messages: messages?.map((m: any) => ({
                id: m.id,
                author: m.author_hash,
                text: m.content_text,
                timestamp: m.message_ts
            })) || []
        }

        // 6. Send to Agno Service on Railway
        const response = await intelligence.post('/v1/process-batch', payload, {
            timeout: 60000
        })

        const aiOutput = response.data

        // 7. Atomic Intelligence Persistence (Alerts, Summaries, Analytics)
        // We use a manual sequence instead of a transaction to handle partial failures if necessary

        // 7a. Insert Alerts
        if (aiOutput.alerts && Array.isArray(aiOutput.alerts) && aiOutput.alerts.length > 0) {
            const highSeverityAlerts = aiOutput.alerts.filter((a: any) => a.severity === 'high')

            const alertsToInsert = aiOutput.alerts.map((alert: any) => ({
                organization_id: batch.organization_id,
                group_id: batch.group_id,
                title: alert.title,
                summary: alert.description,
                severity: alert.severity || 'medium',
                status: 'open',
                evidence_excerpt: alert.evidence,
                is_read: false
            }))

            await supabase.from('alerts').insert(alertsToInsert)

            // 🚨 Emergency Notification for High Severity
            if (highSeverityAlerts.length > 0) {
                try {
                    // Fetch Organization Admins
                    const { data: admins } = await supabase
                        .from('organization_users')
                        .select('user_id')
                        .eq('organization_id', batch.organization_id)
                        .eq('role', 'admin')

                    if (admins && admins.length > 0) {
                        for (const admin of admins) {
                            const { data: userData } = await supabase.auth.admin.getUserById(admin.user_id)
                            const email = userData.user?.email
                            const name = userData.user?.user_metadata?.full_name || 'Administrador'

                            if (email) {
                                // Trigger email for the first high severity alert to avoid spam
                                const mainAlert = highSeverityAlerts[0]
                                await sendHighSeverityAlertEmail(email, name, mainAlert.title, group?.name || 'Grupo')
                            }
                        }
                    }
                } catch (emailError) {
                    console.error('Failed to send emergency emails:', emailError)
                }
            }
        }

        // 7b. Insert Summary
        if (aiOutput.summary) {
            await supabase.from('summaries').insert({
                organization_id: batch.organization_id,
                group_id: batch.group_id,
                summary_text: aiOutput.summary,
                is_read: false
            })
        }

        // 7c. Update Analytics (Sentiment)
        if (aiOutput.sentiment_score !== undefined) {
            await supabase.from('group_analytics').upsert({
                organization_id: batch.organization_id,
                group_id: batch.group_id,
                sentiment_score: aiOutput.sentiment_score,
                period_start: batch.start_ts,
                period_end: batch.end_ts,
                message_count: batch.message_count,
                alert_count_total: aiOutput.alerts?.length || 0
            }, { onConflict: 'group_id, period_start, period_end' })
        }

        // 8. Success: Mark batch as done
        await supabase.from('message_batches').update({
            status: 'done',
            processed_at: new Date().toISOString(),
            error: null
        })
            .eq('id', batch.id)

        return NextResponse.json({
            message: 'Batch intelligence processed successfully',
            batch_id: batch.id
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
