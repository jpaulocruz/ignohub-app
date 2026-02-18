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

async function checkData() {
    console.log("Searching for any active group...");

    const { data: groups } = await supabase
        .from('groups')
        .select('id, name, organization_id, organizations(name)')
        .eq('is_active', true)
        .limit(10);

    console.log("Active Groups Found:", groups);

    if (groups && groups.length > 0) {
        for (const group of groups) {
            const { count } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('group_id', group.id);

            console.log(`Group: ${group.name} (Org: ${(group as any).organizations?.name}) | Messages: ${count}`);
        }
    } else {
        console.log("No active groups found. Checking any groups...");
        const { data: allGroups } = await supabase.from('groups').select('id, name, is_active').limit(10);
        console.log("All Groups:", allGroups);
    }
}

checkData();
