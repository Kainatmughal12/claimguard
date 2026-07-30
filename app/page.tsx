import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { ReviewWorkspace } from "@/components/review-workspace";
import type { Client } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { data, error } = await supabaseAdmin
    .from("clients")
    .select("id, name, specialty, state, brand_tone")
    .order("name");

  if (error) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <p className="text-sm text-destructive">Couldn&apos;t load clients: {error.message}</p>
      </main>
    );
  }

  const clients: Client[] = (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    specialty: row.specialty,
    state: row.state,
    brandTone: row.brand_tone,
  }));

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <div>
          <h1 className="text-sm font-medium">ClaimGuard</h1>
          <p className="text-xs text-muted-foreground">
            AI-assisted compliance review for healthcare marketing copy — not legal advice.
          </p>
        </div>
        <nav className="flex gap-4 text-sm text-muted-foreground">
          <Link href="/" className="text-foreground">
            Review
          </Link>
          <Link href="/rules" className="hover:text-foreground">
            Rules
          </Link>
        </nav>
      </header>
      <ReviewWorkspace clients={clients} />
    </div>
  );
}
