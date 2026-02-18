-- Add min_messages_for_summary column to user_settings
ALTER TABLE user_settings ADD COLUMN min_messages_for_summary INTEGER DEFAULT 10;

-- Add email_summary_enabled column to user_settings
ALTER TABLE user_settings ADD COLUMN email_summary_enabled BOOLEAN DEFAULT TRUE;
