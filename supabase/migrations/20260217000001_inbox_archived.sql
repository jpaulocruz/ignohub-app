-- Add is_archived column to summaries
ALTER TABLE summaries ADD COLUMN is_archived BOOLEAN DEFAULT FALSE;

-- Add is_archived column to member_insights
ALTER TABLE member_insights ADD COLUMN is_archived BOOLEAN DEFAULT FALSE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_summaries_archived ON summaries(is_archived);
CREATE INDEX IF NOT EXISTS idx_member_insights_archived ON member_insights(is_archived);
