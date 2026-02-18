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

async function testScheduler() {
    console.log("Testing Scheduler Logic...");

    const now = new Date();
    // Use the same timezone logic as the Edge Function
    const brTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));

    const currentHour = brTime.getHours();
    const currentDay = brTime.getDay();
    const currentHourStr = currentHour.toString().padStart(2, '0');
    const daysMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const currentDayStr = daysMap[currentDay];

    console.log(`System Time (UTC): ${now.toISOString()}`);
    console.log(`Local Time (BR): ${brTime.toISOString()} (Day: ${currentDay}/${currentDayStr}, Hour: ${currentHourStr})`);

    // 1. Fetch all active orgs (imitating Edge Function logic)
    const { data: orgs, error } = await supabase
        .from('organizations')
        .select('id, name, summary_schedule_time, summary_delivery_days')
        .eq('subscription_status', 'active');

    if (error) {
        console.error("Error fetching orgs:", error);
        return;
    }

    console.log(`Found ${orgs.length} total active organizations.`);

    const matchingOrgs = orgs.filter(org => {
        // 1. Check Time (Hour match)
        if (!org.summary_schedule_time || !org.summary_schedule_time.startsWith(currentHourStr)) {
            return false;
        }

        // 2. Check Day
        const deliveryDays = org.summary_delivery_days;
        if (Array.isArray(deliveryDays)) {
            if (deliveryDays.includes(currentDay) || deliveryDays.includes(currentDayStr)) {
                return true;
            }
        }
        return false;
    });

    console.log(`Found ${matchingOrgs.length} MATCHING organizations for current time:`);
    matchingOrgs.forEach(org => {
        console.log(`- ${org.name} (${org.id}) | Time: ${org.summary_schedule_time} | Days: ${JSON.stringify(org.summary_delivery_days)}`);
    });

    // 2. Invoke Scheduler Function (FORCE RUN for testing)
    console.log("\n--- Executing Summary Generation for Matched Orgs ---");
    if (matchingOrgs.length === 0) {
        console.log("No organizations matched the current time/day.");
        console.log("To test, ensure your organization settings match the Current Time displayed above.");
    } else {
        for (const org of matchingOrgs) {
            console.log(`\nInvoking generate-summary for ${org.name}...`);
            const { data: funcData, error: funcError } = await supabase.functions.invoke('generate-summary', {
                body: {
                    organizationId: org.id,
                    hoursBack: 24,
                    sendToGroup: false, // Testing mode, maybe don't span groups? User said "testar sim".
                    isScheduled: true
                }
            });

            if (funcError) {
                console.error(`❌ Function Error for ${org.name}:`, funcError);
                // If it's a 500, let's try to see if there's more info
                if (funcError instanceof Error && 'context' in funcError) {
                    const context = (funcError as any).context;
                    if (context && typeof context.text === 'function') {
                        const bodyText = await context.text();
                        console.error("Error Body:", bodyText);
                    }
                }
            } else {
                console.log(`✅ Function Result for ${org.name}:`, funcData);
            }
        }
    }
}

testScheduler();
