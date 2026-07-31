import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/chat/sidebar";
import { TopNav } from "@/components/top-nav";
import { getThreadSummaries } from "@/lib/reviews";
import "./globals.css";

export const dynamic = "force-dynamic";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Display face reserved for headline moments (hero, verdict) — a serif with
// editorial/regulatory gravitas, deliberately distinct from the sans used
// for interface chrome, so the "verdict" of a review reads as a judgment
// rendered, not another UI label.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
});

export const metadata: Metadata = {
  title: "ClaimGuard",
  description: "Healthcare marketing compliance review, powered by AI. Not legal advice.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const recentThreads = await getThreadSummaries(5).catch(() => []);

  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <TooltipProvider delay={200}>
          <SidebarProvider>
            <AppSidebar recentThreads={recentThreads} />
            <SidebarInset>
              <TopNav />
              {children}
            </SidebarInset>
          </SidebarProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
