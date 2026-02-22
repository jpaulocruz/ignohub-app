"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
    LayoutDashboard, MessageSquare, Users, Settings,
    LogOut, CreditCard, Shield, Activity, ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useOrganization } from "@/hooks/use-organization";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { IgnoHubLogo } from "@/components/ui/logo";
import { Badge } from "@/components/ui/badge";
import {
    Sidebar as ShadcnSidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarGroupLabel,
    SidebarGroupContent,
    SidebarRail,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const routes = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { label: "Intelligence", icon: MessageSquare, href: "/inbox" },
    { label: "Communities", icon: Users, href: "/groups" },
    { label: "Billing", icon: CreditCard, href: "/dashboard/billing" },
    { label: "Settings", icon: Settings, href: "/settings" },
    { label: "Assets", icon: Shield, href: "/assets", adminOnly: true },
    { label: "Monitoring", icon: Activity, href: "/monitoring", adminOnly: true },
    { label: "Plans", icon: CreditCard, href: "/plans", adminOnly: true },
];

export function Sidebar({ ...props }: React.ComponentProps<typeof ShadcnSidebar>) {
    const pathname = usePathname();
    const router = useRouter();
    const { organization, role, isSuperadmin } = useOrganization();
    const supabase = createClient();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    return (
        <ShadcnSidebar collapsible="icon" {...props}>
            <SidebarHeader className="h-16 px-4 flex items-center border-b border-border justify-start font-semibold text-lg flex-row gap-3 group-data-[collapsible=icon]:justify-center">
                <IgnoHubLogo />
                <span className="font-bold text-xl tracking-tight text-foreground lowercase group-data-[collapsible=icon]:hidden">
                    ignohub
                </span>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Home</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {routes.filter(r => !r.adminOnly || isSuperadmin).slice(0, 5).map((route) => {
                                const isActive = pathname === route.href;
                                return (
                                    <SidebarMenuItem key={route.href}>
                                        <SidebarMenuButton asChild isActive={isActive} tooltip={route.label}>
                                            <Link href={route.href}>
                                                <route.icon className="h-4 w-4 shrink-0" />
                                                <span>{route.label}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {isSuperadmin && (
                    <SidebarGroup>
                        <SidebarGroupLabel>Admin</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {routes.filter(r => r.adminOnly).map((route) => {
                                    const isActive = pathname === route.href;
                                    return (
                                        <SidebarMenuItem key={route.href}>
                                            <SidebarMenuButton asChild isActive={isActive} tooltip={route.label}>
                                                <Link href={route.href} className="flex items-center gap-2 justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <route.icon className="h-4 w-4 shrink-0" />
                                                        <span>{route.label}</span>
                                                    </div>
                                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                                        Admin
                                                    </Badge>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    )
                                })}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}
            </SidebarContent>

            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton
                                    size="lg"
                                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground items-center justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8 rounded-lg">
                                            <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xs font-semibold">
                                                {organization?.name?.[0]?.toUpperCase() || 'O'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                                            <span className="truncate font-semibold">{organization?.name || 'Organization'}</span>
                                            <span className="truncate text-xs capitalize text-muted-foreground">{role || 'Member'}</span>
                                        </div>
                                    </div>
                                    <ChevronUp className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent side="top" align="start" className="w-[--radix-popper-anchor-width] min-w-56">
                                <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Log out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </ShadcnSidebar>
    );
}
