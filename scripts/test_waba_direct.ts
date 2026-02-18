
import { sendWabaMessage } from '../lib/waba';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Manual env parsing
const envPath = path.join(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.join('=').trim();
        process.env[key.trim()] = value.join('=').trim(); // for lib/waba.ts to potentially use env if needed
    }
});

// Mock Supabase client for route context not needed here as sendWabaMessage uses createAdminClient inside (which uses process.env)
// But we need to make sure process.env is populated.

async function main() {
    console.log('--- TESTING WABA DIRECT SEND ---');

    const targetPhone = '557591357078'; // User's number

    try {
        // Test Template
        console.log('Sending Template Message...');
        await sendWabaMessage({
            to: targetPhone,
            type: 'template',
            template: {
                name: 'resumo_pronto', // Known valid template
                language: { code: 'pt_BR' },
                components: [
                    {
                        type: 'body',
                        parameters: [
                            { type: 'text', text: 'Teste Direto' }, // {{1}}
                            { type: 'text', text: 'WABA-123' }      // {{2}}
                        ]
                    }
                ]
            }
        });
        console.log('✅ Template Message Sent!');
    } catch (e: any) {
        console.error('❌ Template Message Failed:', e.message || e);
    }
}

main();
