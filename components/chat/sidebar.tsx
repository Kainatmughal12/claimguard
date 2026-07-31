"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PlusIcon, HistoryIcon, BookOpenIcon, ShieldCheckIcon } from "lucide-react";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarRail,
} from "@/components/ui/sidebar";
import type { ThreadSummary } from "@/lib/types";

interface AppSidebarProps {
  recentThreads: ThreadSummary[];
}

export function AppSidebar({ recentThreads }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <ShieldCheckIcon className="size-4 shrink-0 text-primary" />
          <span className="text-sm font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
            ClaimGuard
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="New review" isActive={pathname === "/"} render={<Link href="/" />}>
                  <PlusIcon />
                  <span>New review</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Review history"
                  isActive={pathname === "/history"}
                  render={<Link href="/history" />}
                >
                  <HistoryIcon />
                  <span>Review history</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Compliance rules"
                  isActive={pathname === "/rules"}
                  render={<Link href="/rules" />}
                >
                  <BookOpenIcon />
                  <span>Compliance rules</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {recentThreads.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Recent</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {recentThreads.map((thread) => (
                  <SidebarMenuItem key={thread.id}>
                    <SidebarMenuButton
                      tooltip={thread.client_name}
                      isActive={pathname === `/review/${thread.id}`}
                      render={<Link href={`/review/${thread.id}`} />}
                    >
                      <span className="truncate">{thread.client_name}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <p className="px-2 py-1 text-[0.65rem] leading-snug text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden">
          Not legal advice — a prototype rule pack for human review.
        </p>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
