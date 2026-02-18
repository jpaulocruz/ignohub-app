-- Create delivery_queue table for async processing
CREATE TABLE IF NOT EXISTS public.delivery_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID, -- Optional link to message_batches
    type TEXT NOT NULL CHECK (type IN ('email', 'whatsapp')),
    payload JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    retry_count INT DEFAULT 0
);

-- Index for queue processing
CREATE INDEX IF NOT EXISTS idx_delivery_queue_status_created ON public.delivery_queue(status, created_at);

-- Messages indexes for faster batch retrieval
CREATE INDEX IF NOT EXISTS idx_messages_batch_id ON public.messages(batch_id);
CREATE INDEX IF NOT EXISTS idx_messages_group_ts ON public.messages(group_id, message_ts DESC);

-- Alerts indexes for faster reporting/dashboard
CREATE INDEX IF NOT EXISTS idx_alerts_batch_severity ON public.alerts(batch_id, severity);
CREATE INDEX IF NOT EXISTS idx_alerts_org_status ON public.alerts(organization_id, status);

-- Groups index for fast JID lookup (webhook critical path)
CREATE INDEX IF NOT EXISTS idx_groups_jid ON public.groups(jid) WHERE jid IS NOT NULL;
