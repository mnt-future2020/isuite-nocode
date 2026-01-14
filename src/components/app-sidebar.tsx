"use client";

import {
  CreditCardIcon,
  FolderOpenIcon,
  HistoryIcon,
  KeyIcon,
  LogOutIcon,
  StarIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { PricingModal } from "@/features/subscriptions/components/pricing-modal";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import { useHasActiveSubscription } from "@/features/subscriptions/hooks/use-subscription";

const menuItems = [
  {
    title: "Main",
    items: [
      {
        title: "Workflows",
        icon: FolderOpenIcon,
        url: "/workflows",
      },
      {
        title: "Credentials",
        icon: KeyIcon,
        url: "/credentials",
      },
      {
        title: "Executions",
        icon: HistoryIcon,
        url: "/executions",
      },
    ],
  }
];

export const AppSidebar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const { hasActiveSubscription, isLoading: subscriptionLoading } = useHasActiveSubscription();
  const userRole = (session?.user as any)?.role;

  const isStatusLoading = sessionPending || (session?.user && subscriptionLoading);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenuItem>
          <SidebarMenuButton asChild className="gap-x-4 h-10 px-4">
            <Link href="/" prefetch className="flex items-center gap-3 px-2">
              <Image src="/logos/logo.png" alt="iSuite" width={36} height={36} className="object-contain" />
              <span className="font-bold text-2xl tracking-tight">iSuite</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarHeader>
      <SidebarContent>
        {menuItems.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={item.title}
                      isActive={
                        item.url === "/"
                          ? pathname === "/"
                          : pathname.startsWith(item.url)
                      }
                      asChild
                      className="gap-x-4 h-10 px-4"
                    >
                      <Link href={item.url} prefetch>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
                {userRole === "ADMIN" && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      tooltip="Admin"
                      isActive={pathname.startsWith("/admin")}
                      asChild
                      className="gap-x-4 h-10 px-4"
                    >
                      <Link href="/admin" prefetch>
                        <ShieldCheckIcon className="size-4" />
                        <span>Admin</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          {isStatusLoading ? (
            <SidebarMenuItem className="px-4 py-2">
              <div className="flex items-center gap-x-4 animate-pulse">
                <div className="size-4 rounded bg-muted" />
                <div className="h-4 w-24 bg-muted rounded" />
              </div>
            </SidebarMenuItem>
          ) : (
            session?.user && !hasActiveSubscription && (
              <SidebarMenuItem>
                <PricingModal
                  trigger={
                    <SidebarMenuButton
                      tooltip="Upgrade Plan"
                      className="gap-x-4 h-10 px-4 text-primary font-medium hover:bg-primary/5"
                    >
                      <StarIcon className="h-4 w-4 fill-primary/10" />
                      <span>Upgrade Plan</span>
                    </SidebarMenuButton>
                  }
                />
              </SidebarMenuItem>
            )
          )}



          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Billing Portal"
              className="gap-x-4 h-10 px-4"
              onClick={() => authClient.customer.portal()}
            >
              <CreditCardIcon className="h-4 w-4" />
              <span>Billing Portal</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Sign out"
              className="gap-x-4 h-10 px-4"
              onClick={() => authClient.signOut({
                fetchOptions: {
                  onSuccess: () => {
                    router.push("/login");
                  },
                },
              })}
            >
              <LogOutIcon className="h-4 w-4" />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};
