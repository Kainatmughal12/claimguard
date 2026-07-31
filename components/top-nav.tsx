import { SidebarTrigger } from "@/components/ui/sidebar";

export function TopNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-sm">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <SidebarTrigger />
      </div>
    </header>
  );
}
