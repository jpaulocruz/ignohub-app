
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
    }
});

const supabase = createClient(
    env['SUPABASE_URL'],
    env['SUPABASE_SERVICE_ROLE_KEY']
);

async function main() {
    console.log('--- DEBUG: ATTEMPTING TO SAVE PROMPT DIRECTLY ---');

    const key = "PROMPT_SUMMARY_SYSTEM";
    const value = "PROMPT DE TESTE DE DEBUG - SCRIPT ISOLADO " + new Date().toISOString();
    const description = "Teste via script de debug";

    console.log(`Key: ${key}`);
    console.log(`Value: ${value}`);

    const payload: any = { key, value, description };

    const { error } = await supabase
        .from("system_settings")
        .upsert(payload, { onConflict: "key" });

    if (error) {
        console.error("❌ DB Insert Failed:", error);
    } else {
        console.log("✅ DB Insert Success!");

        // Verify read back
        const { data } = await supabase
            .from("system_settings")
            .select('*')
            .eq('key', key)
            .single();

        console.log("Read back data:", data);
    }
}

main();
