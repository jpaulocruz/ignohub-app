"use client";

import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { useOrganization, OrganizationProvider } from "@/hooks/use-organization";
import { Loader2 } from "lucide-react";
import { TrialOverlay } from "@/components/trial-overlay";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

function DashboardContent({ children }: { children: React.ReactNode }) {
    const { organization, loading } = useOrganization();

    const isTrialExpired = organization &&
        organization.subscription_status !== 'active' &&
        organization.trial_ends_at &&
        new Date(organization.trial_ends_at) < new Date();

    return (
        <SidebarProvider>
            <Sidebar />
            <SidebarInset>
                <Navbar />
                <div className="flex flex-1 flex-col p-6 md:p-8">
                    <div className="max-w-5xl mx-auto w-full">
                        {isTrialExpired && <TrialOverlay />}
                        {loading ? (
                            <div className="flex h-64 items-center justify-center">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            children
                        )}
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <OrganizationProvider>
            <DashboardContent>{children}</DashboardContent>
        </OrganizationProvider>
    );
}
