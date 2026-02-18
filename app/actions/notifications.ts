"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function getNotifications() {
    const supabase = await createClient();

    // Get current user to determine scope
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: profile } = await supabase
        .from("profiles")
        .select("is_superadmin")
        .eq("id", user.id)
        .single();

    let query = supabase.from("notifications").select("*").order("created_at", { ascending: false });

    if (profile?.is_superadmin) {
        // Super admins see infrastructure alerts + their own org alerts
        // For now, simplicity: they see everything with scope 'super_admin' 
        // OR notifications linked to their organizations
        query = query.or(`scope.eq.super_admin,user_id.eq.${user.id}`);
    } else {
        // Regular users only see their own or their org's notifications
        query = query.eq("user_id", user.id);
    }

    const { data, error } = await query.limit(50);
    if (error) throw error;
    return data || [];
}

export async function markAsRead(notificationId: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId);

    if (error) throw error;
    revalidatePath("/");
    return { success: true };
}

export async function markAllAsRead() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

    if (error) throw error;
    revalidatePath("/");
    return { success: true };
}

/**
 * System-level function to create notifications.
 * Can be called from Edge Functions or Server Actions.
 */
export async function createNotification(data: {
    title: string;
    message: string;
    type: "error" | "warning" | "info" | "success";
    scope: "super_admin" | "organization";
    organization_id?: string;
    user_id?: string;
    metadata?: any;
}) {
    const supabase = createAdminClient();
    const { error } = await supabase.from("notifications").insert(data);
    if (error) console.error("Failed to create notification:", error);
    return { success: !error };
}
