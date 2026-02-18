import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Load .env manually
const envPath = path.resolve(process.cwd(), '.env');
const envConfig = fs.readFileSync(envPath, 'utf8');
envConfig.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        process.env[key.trim()] = value.trim();
    }
});

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const GROUP_ID = '69be71e9-6273-4972-a051-1c413ac705a5';
const ORG_ID = '4545be6b-ed21-428c-911d-8915588b3270';

const mockMessages = [
    { author: 'User1', text: 'Pessoal, precisamos decidir sobre o novo fornecedor de embalagens. O preço subiu 15%.' },
    { author: 'User4', text: 'ALERTA CRÍTICO: Detectamos uma falha de segurança grave no sistema de pagamentos. Dados de clientes podem estar expostos agora!' },
    { author: 'User1', text: 'MEU DEUS. User4, bloqueie todos os acessos imediatamente. Temos que avisar o jurídico.' },
    { author: 'User2', text: 'Isso é um desastre. Vou começar a redigir a nota para os investidores.' },
    { author: 'User4', text: 'O vazamento parece ter vindo da API externa. Estou cortando a conexão.' },
    { author: 'User1', text: 'User4, parem tudo imediatamente. Quantas unidades foram afetadas?' },
    { author: 'User4', text: 'Acho que umas 500 unidades. Estamos isolando agora.' },
    { author: 'User2', text: 'Isso vai atrasar a entrega da Loja A e B.' },
    { author: 'User1', text: 'Anotado. User2, avise os clientes que teremos um atraso técnico de 48h.' },
    { author: 'User3', text: 'Vou ver se consigo um fornecedor local para uma entrega emergencial de 100 unidades.' },
    { author: 'User1', text: 'Ótimo. Decidido: vamos absorver o aumento de 15% por agora para não parar a linha, e em paralelo testamos a PackExpress para o próximo mês.' },
    { author: 'User5', text: 'Gente, o cliente VIP reclamou muito do atendimento no suporte ontem. Alguém viu o que ocorreu?' },
    { author: 'User1', text: 'Vou verificar isso agora.' },
];

async function insertMockMessages() {
    console.log("Inserting Mock Messages for AI testing...");

    const inserts = mockMessages.map((m, i) => ({
        group_id: GROUP_ID,
        organization_id: ORG_ID,
        author_hash: m.author,
        content_text: m.text,
        message_ts: new Date(Date.now() - (mockMessages.length - i) * 60000).toISOString(),
    }));

    const { error } = await supabase.from('messages').insert(inserts);
    if (error) console.error("Error inserting mock messages:", error);
    else console.log("Success! Inserted mock messages.");
}

insertMockMessages();
