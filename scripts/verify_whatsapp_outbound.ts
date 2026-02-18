import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifySystemBot() {
    console.log("🚀 Starting verification of System Bot logic...");

    // 1. Get current system bot(s)
    const { data: metaBots } = await supabase
        .from('admin_outbound_meta')
        .select('id, phone_number_id, is_system_bot')
        .eq('is_system_bot', true);

    const { data: evolutionBots } = await supabase
        .from('admin_collection_instances')
        .select('id, instance_name, is_system_bot')
        .eq('is_system_bot', true);

    console.log("Current Meta System Bots:", metaBots);
    console.log("Current Evolution System Bots:", evolutionBots);

    if ((metaBots?.length || 0) + (evolutionBots?.length || 0) > 1) {
        console.warn("⚠️ Warning: Multiple system bots found! The setSystemBot action should prevent this.");
    } else {
        console.log("✅ Check: Single system bot constraint (manual check).");
    }

    // 2. Verify Templates
    const { data: templates } = await supabase
        .from('admin_whatsapp_templates')
        .select('*');

    console.log("Registered Templates:", templates?.length || 0);
    templates?.forEach(t => {
        console.log(`- ${t.name} (${t.platform}, ${t.language})`);
    });

    console.log("\n✨ Verification complete.");
}

verifySystemBot().catch(console.error);
