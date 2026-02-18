import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Load .env manually
const envPath = path.resolve(process.cwd(), '.env');
const envConfig = fs.readFileSync(envPath, 'utf8');
envConfig.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) process.env[key.trim()] = value.trim();
});

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function sendTestAlert() {
    console.log("🔔 Iniciando teste de alerta via Meta API (ID Corrigido)...");

    // 1. Buscar credenciais do bot do sistema
    const { data: bot, error: botError } = await s
        .from('admin_outbound_meta')
        .select('*')
        .eq('is_system_bot', true)
        .eq('is_active', true)
        .maybeSingle();

    if (botError || !bot) {
        console.error("❌ Erro ao buscar bot do sistema:", botError);
        return;
    }

    // 2. Definir o número de destino (jpaulodg)
    const targetPhone = "557591357078"; // Número de teste do usuário

    console.log(`📡 Enviando para: ${targetPhone} via Phone ID: ${bot.phone_number_id}`);

    // 3. Montar a mensagem de alerta (Sentinel Style)
    const alertMessage = {
        messaging_product: 'whatsapp',
        to: targetPhone,
        type: 'text',
        text: {
            body: `🛡️ *IGNOHUB SENTINEL - ALERTA CRÍTICO*\n\nEste é um teste real via API Meta para validar as notificações do usuário jpaulodg@gmail.com.\n\n*Severidade:* CRÍTICO\n*Status:* Ativo\n*Horário:* ${new Date().toLocaleString('pt-BR')}\n\n✅ Sistema de Alertas operando corretamente.`
        }
    };

    // 4. Disparar via Meta API
    try {
        const response = await fetch(`https://graph.facebook.com/v17.0/${bot.phone_number_id}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${bot.access_token_encrypted}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(alertMessage)
        });

        const result = await response.json();

        if (response.ok) {
            console.log("✅ Alerta enviado com sucesso!");
            console.log("Resultado:", JSON.stringify(result, null, 2));
        } else {
            console.error("❌ Falha no envio da Meta API:");
            console.error(JSON.stringify(result, null, 2));
        }
    } catch (error) {
        console.error("❌ Erro na requisição HTTP:", error);
    }
}

sendTestAlert();
