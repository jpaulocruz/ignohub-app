import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardLayout as DashboardShell } from "@/components/layout/DashboardLayout";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Triple Protection Layer 2: Server-side superadmin check
    const { data: profile } = await supabase
        .from("profiles")
        .select("is_superadmin")
        .eq("id", user.id)
        .single();

    if (!profile?.is_superadmin) {
        redirect("/403");
    }

    return (
        <DashboardShell>
            <div className="max-w-[1200px] mx-auto">
                {children}
            </div>
        </DashboardShell>
    );
}
