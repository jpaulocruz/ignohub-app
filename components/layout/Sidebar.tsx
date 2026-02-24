"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
    LayoutDashboard,
    MessageSquare,
    Users,
    Settings,
    LogOut,
    CreditCard,
    Shield,
    Activity,
    ChevronUp
} from "lucide-react";

import { useOrganization } from "@/hooks/use-organization";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";
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
} from "@/components/ui/sidebar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const routeKeys = [
    { key: "dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { key: "intelligence", icon: MessageSquare, href: "/inbox" },
    { key: "communities", icon: Users, href: "/groups" },
    { key: "billing", icon: CreditCard, href: "/dashboard/billing" },
    { key: "settings", icon: Settings, href: "/settings" },
    { key: "assets", icon: Shield, href: "/assets", adminOnly: true },
    { key: "monitoring", icon: Activity, href: "/monitoring", adminOnly: true },
    { key: "plans", icon: CreditCard, href: "/plans", adminOnly: true },
];

export function Sidebar({ ...props }: React.ComponentProps<typeof ShadcnSidebar>) {
    const pathname = usePathname();
    const router = useRouter();
    const { organization, role, isSuperadmin } = useOrganization();
    const supabase = createClient();
    const t = useTranslations();

    const routes = routeKeys.map(r => ({ ...r, label: t(`nav.${r.key}`) }));

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
                    <SidebarGroupLabel>{t('nav.home')}</SidebarGroupLabel>
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
                        <SidebarGroupLabel>{t('common.admin')}</SidebarGroupLabel>
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
