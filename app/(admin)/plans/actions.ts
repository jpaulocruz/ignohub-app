"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getPlans() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("plans")
        .select("*")
        .order("price_monthly", { ascending: true });

    if (error) {
        console.error("Error fetching plans:", error);
        return [];
    }
    return data;
}

export async function updatePlanConfig(id: string, updates: {
    max_groups?: number;
    retention_days?: number;
    price_monthly?: number;
    name?: string;
    description?: string;
}) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("plans")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    // Trigger Stripe Sync
    await syncPlanWithStripe(data);

    revalidatePath("/admin/plans");
    return data;
}

export async function syncPlanWithStripe(plan: any) {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) throw new Error("Not authenticated");

    let result;
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/sync-plan-stripe`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${session.access_token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                action: "update",
                plan: {
                    id: plan.id,
                    name: plan.name,
                    description: plan.description,
                    price_monthly: plan.price_monthly,
                    stripe_price_id: plan.stripe_price_id,
                    max_groups: plan.max_groups,
                    max_instances: plan.max_groups,
                    max_messages_per_day: plan.max_messages_per_day || 1000,
                    is_active: true
                }
            }),
        });

        if (!response.ok) {
            const rawText = await response.text();
            console.error(`Edge Function error (${response.status}):`, rawText);
            return { success: false, error: `Edge Function returned ${response.status}` };
        }

        result = await response.json();
    } catch (err: any) {
        console.error("Failed to sync with Stripe:", err);
        return { success: false, error: err.message };
    }

    if (!result.success) {
        console.error("Stripe sync logic failed:", result.error);
    }

    return result;
}

export async function getSubscriptionAlerts() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("organizations")
        .select("id, name, subscription_status, plan_type, trial_ends_at")
        .or("subscription_status.in.(past_due,unpaid,canceled),trial_ends_at.lt.now()")
        .order("name", { ascending: true });

    if (error) {
        console.error("Error fetching alerts:", error);
        return [];
    }
    return data;
}
