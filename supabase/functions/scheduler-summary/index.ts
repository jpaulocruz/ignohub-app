import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

        // Create client with Service Role to access all organizations
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // Get current time details in America/Sao_Paulo (UTC-3)
        // This ensures the scheduler respects the user's local time in Brazil.
        const now = new Date();
        const brTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));

        const currentHour = brTime.getHours(); // 0-23 in Brazil
        const currentMinute = brTime.getMinutes();
        const currentDay = brTime.getDay(); // 0 (Sun) - 6 (Sat)
        const daysMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        const currentDayStr = daysMap[currentDay];

        // Calculate "HH:00" string for exact matching if needed, 
        // but robust logic usually checks for a range or exact hour match.
        // Since this runs typically hourly, we match the hour.

        // Helper to format time as "HH:mm:ss" or just "HH:mm" for comparison
        // The column summary_schedule_time is type `time`.
        // We look for organizations that have programmed this hour.

        console.log(`Scheduler running at ${now.toISOString()} (Day: ${currentDay}/${currentDayStr}, Hour: ${currentHour})`);

        // Fetch organizations that:
        // 1. Have active subscription (optional, but good practice)
        // 2. Have summary_delivery_days containing the current day
        // 3. Have summary_schedule_time within the current hour (e.g. 09:00:00 matches 9am run)

        // Note: filtering JSONB array in Supabase/Postgres:
        // summary_delivery_days @> '[currentDay]'

        // Note: filtering Time column:
        // extract(hour from summary_schedule_time) = currentHour

        // Fetch organizations that match EITHER integer day OR string day
        // .or(`summary_delivery_days.cs.${currentDay},summary_delivery_days.cs.${currentDayStr}`) 
        // Supabase .or with .contains is tricky. 
        // It's easier to fetch based on one if we standardize, OR fetch all active and filter in code (if dataset is small).
        // Given we filter by time hour, the dataset shouldn't be huge.

        // Let's try to filter by time first, then filter days in memory for robustness against mixed types.

        const { data: orgs, error: orgsError } = await supabase
            .from('organizations')
            .select('id, name, summary_schedule_time, summary_delivery_days')
            //.filter('summary_schedule_time', 'gte', `${currentHour.toString().padStart(2, '0')}:00:00`)
            //.filter('summary_schedule_time', 'lt', `${(currentHour + 1).toString().padStart(2, '0')}:00:00`)
            // Actually, we can just filter by hour in memory too to avoid timezone issues.
            // But for performance, let's keep the DB filter for time if possible.
            // Let's widen the search to just get all orgs for now and filter logically.
            .eq('subscription_status', 'active'); // Optional

        if (orgsError) throw orgsError;

        console.log(`Found ${orgs?.length || 0} active organizations.`);

        const results = [];
        const hourStr = currentHour.toString().padStart(2, '0');

        if (orgs && orgs.length > 0) {
            for (const org of orgs) {
                // 1. Check Time (Hour match)
                // summary_schedule_time is "HH:MM:SS"
                if (!org.summary_schedule_time || !org.summary_schedule_time.startsWith(hourStr)) {
                    continue;
                }

                // 2. Check Day
                const deliveryDays = org.summary_delivery_days;
                let dayMatch = false;

                if (Array.isArray(deliveryDays)) {
                    // Check if it contains currentDay (int) or currentDayStr (string)
                    // deliveryDays could be ["mon", "wed"] or [1, 3]
                    if (deliveryDays.includes(currentDay) || deliveryDays.includes(currentDayStr)) {
                        dayMatch = true;
                    }
                }

                if (!dayMatch) continue;

                console.log(`Triggering summary for Org: ${org.name} (${org.id})`);

                // Invoke generate-summary function
                // We pass organizationId. The function needs to be updated to handle this.
                const { data, error } = await supabase.functions.invoke('generate-summary', {
                    body: {
                        organizationId: org.id,
                        hoursBack: 24, // Or dynamic based on schedule frequency
                        sendToGroup: false, // Default preferences
                        isScheduled: true
                    }
                });

                results.push({
                    org: org.name,
                    success: !error,
                    error: error,
                    data: data
                });
            }
        }

        return new Response(JSON.stringify({
            success: true,
            processed: results.length,
            details: results
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('Scheduler Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
