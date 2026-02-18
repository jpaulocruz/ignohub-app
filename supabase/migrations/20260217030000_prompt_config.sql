-- Add alert_instructions to organizations
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS alert_instructions TEXT DEFAULT NULL;

-- Insert PROMPT_SUMMARY_SYSTEM if not exists
INSERT INTO public.system_settings (key, value, description)
VALUES (
  'PROMPT_SUMMARY_SYSTEM',
  'Você é um assistente executivo de alto nível. Sua tarefa é analisar as conversas do grupo e gerar um Resumo Executivo estruturado. Foque em decisões tomadas, pontos de ação, datas importantes e tópicos polêmicos. Use uma linguagem profissional, direta e imparcial. Ignore conversas triviais (bom dia, etc) a menos que contenham contexto relevante.',
  'System-wide prompt for generating executive summaries'
) ON CONFLICT (key) DO NOTHING;
