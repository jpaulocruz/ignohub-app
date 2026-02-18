-- Indexes for fast Dashboard queries

-- Optimize Analytics chart retrieval (organization_id + period_start)
CREATE INDEX IF NOT EXISTS idx_group_analytics_org_period ON public.group_analytics(organization_id, period_start);

-- Optimize Summaries retrieval (organization_id + created_at DESC)
CREATE INDEX IF NOT EXISTS idx_summaries_org_created ON public.summaries(organization_id, created_at DESC);

-- Optimize Member Insights retrieval (organization_id + created_at DESC)
CREATE INDEX IF NOT EXISTS idx_member_insights_org_created ON public.member_insights(organization_id, created_at DESC);

-- Optimize Message Volume calculation (organization_id + created_at for 24h filter)
CREATE INDEX IF NOT EXISTS idx_message_batches_org_created ON public.message_batches(organization_id, created_at);
