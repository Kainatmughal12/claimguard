import type { Metadata } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
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

// Reserved for the copy under review — draft, rewrite, flagged spans — never
// for UI chrome. Serif signals "manuscript under review," sans signals "tool."
const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
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
      className={`dark ${geistSans.variable} ${geistMono.variable} ${newsreader.variable} h-full antialiased`}
    >
      <body className="h-full flex flex-col overflow-hidden">
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
