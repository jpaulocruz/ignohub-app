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
const ORG_ID = '4545be6b-ed21-428c-911d-8915588b3270';

async function verifyResults() {
    const batchId = 'f55c8be6-0ae0-4c1d-b7bb-fe41018a036e';
    console.log(`Checking Batch ${batchId}...`);

    const { data: batch } = await supabase
        .from('message_batches')
        .select('*')
        .eq('id', batchId)
        .single();

    console.log("BATCH STATUS:", batch?.status, "ERROR:", batch?.error);

    if (batch?.status === 'done') {
        const { data: summary } = await supabase
            .from('summaries')
            .select('*')
            .eq('organization_id', ORG_ID)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        console.log("LATEST SUMMARY SAVED:", summary?.summary_text?.substring(0, 500));
    }
}

verifyResults();
