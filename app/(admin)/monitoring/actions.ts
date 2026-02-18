"use server";

import { createClient } from "@/lib/supabase/server";

export async function getUsageMetrics() {
    const supabase = await createClient();

    // Cumulative usage from message_batches grouped by organization
    const { data: usage, error } = await supabase
        .from("organizations")
        .select(`
            id,
            name,
            plan_type,
            message_batches (
                message_count,
                tokens_used
            )
        `);

    if (error) {
        console.error("Error fetching usage metrics:", error);
        return [];
    }

    // Process data to sum counts
    return usage.map((org: any) => {
        const totalMessages = org.message_batches?.reduce((acc: number, batch: any) => acc + (batch.message_count || 0), 0) || 0;
        const totalTokens = org.message_batches?.reduce((acc: number, batch: any) => acc + (batch.tokens_used || 0), 0) || 0;

        return {
            id: org.id,
            name: org.name,
            plan_type: org.plan_type,
            totalMessages,
            totalTokens,
        };
    });
}

export async function getPlanComparisonData() {
    const supabase = await createClient();

    const { data: usage, error } = await supabase
        .from("organizations")
        .select(`
            plan_type,
            message_batches (
                message_count
            )
        `);

    if (error) {
        console.error("Error fetching comparison data:", error);
        return [];
    }

    const comparison: Record<string, number> = {
        starter: 0,
        business: 0,
        enterprise: 0,
    };

    usage.forEach((org: any) => {
        const plan = org.plan_type || "starter";
        const count = org.message_batches?.reduce((acc: number, batch: any) => acc + (batch.message_count || 0), 0) || 0;
        comparison[plan] = (comparison[plan] || 0) + count;
    });

    return Object.entries(comparison).map(([name, value]) => ({ name, value }));
}
