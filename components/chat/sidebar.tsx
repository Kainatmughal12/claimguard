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
import { cn } from "@/lib/utils";
import { formatRelativeDate } from "@/lib/format";
import { CONTENT_TYPES } from "@/lib/content-types";
import { OVERALL_RISK_LABEL, OVERALL_RISK_TEXT_CLASS } from "@/lib/severity";
import type { ThreadSummary } from "@/lib/types";

function RecentThreadRow({ thread, active }: { thread: ThreadSummary; active: boolean }) {
  const contentTypeLabel = CONTENT_TYPES.find((c) => c.value === thread.content_type)?.label ?? thread.content_type;
  const riskClass = thread.overall_risk ? OVERALL_RISK_TEXT_CLASS[thread.overall_risk] : "text-muted-foreground";
  const riskLabel = thread.overall_risk ? OVERALL_RISK_LABEL[thread.overall_risk] : "Pending";

  return (
    <Link
      href={`/review/${thread.id}`}
      title={thread.snippet}
      className={cn(
        "flex gap-2 rounded-md px-2 py-1.5 text-sidebar-foreground transition-all duration-200 ease-out hover:bg-sidebar-accent active:scale-[0.98] group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0",
        active && "bg-sidebar-accent",
      )}
    >
      <span
        className={cn("mt-1.5 size-1.5 shrink-0 rounded-full bg-current", riskClass)}
        aria-hidden
        title={riskLabel}
      />
      <span className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
        <span className="block truncate text-xs font-medium">{thread.client_name}</span>
        <span className="block truncate text-[0.7rem] text-sidebar-foreground/60">
          {contentTypeLabel} · {thread.finding_count} issue{thread.finding_count === 1 ? "" : "s"} ·{" "}
          {formatRelativeDate(thread.created_at)}
        </span>
        <span className="block truncate text-[0.7rem] text-sidebar-foreground/40">{thread.snippet}</span>
      </span>
    </Link>
  );
}

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
                    <RecentThreadRow thread={thread} active={pathname === `/review/${thread.id}`} />
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
