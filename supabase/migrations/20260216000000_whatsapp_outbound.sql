-- Migration: WhatsApp Outbound & Templates
-- Date: 2026-02-16

-- 1. Create WhatsApp Templates table
CREATE TABLE IF NOT EXISTS public.admin_whatsapp_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('meta', 'evolution')),
    category TEXT DEFAULT 'MARKETING',
    language TEXT DEFAULT 'pt_BR',
    content TEXT, -- JSON or text representation of the template
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add is_system_bot to outbound tables
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pf_column_exists('public', 'admin_outbound_meta', 'is_system_bot')) THEN
        ALTER TABLE public.admin_outbound_meta ADD COLUMN is_system_bot BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pf_column_exists('public', 'admin_collection_instances', 'is_system_bot')) THEN
        ALTER TABLE public.admin_collection_instances ADD COLUMN is_system_bot BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.admin_whatsapp_templates ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies (Super Admin access)
-- Assuming we have a way to identify admins. Since this is an admin table, 
-- we typically allow service role or authenticated admins.
-- For now, mirroring existing admin patterns in the codebase.

CREATE POLICY "Admin All" ON public.admin_whatsapp_templates
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- Indices
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_name ON public.admin_whatsapp_templates(name);
