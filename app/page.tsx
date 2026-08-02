import { supabaseAdmin } from "@/lib/supabase-admin";
import { ChatShell } from "@/components/chat/chat-shell";
import type { Client } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { data, error } = await supabaseAdmin
    .from("clients")
    .select("id, name, specialty, state, brand_tone")
    .order("name");

  if (error) {
    return (
      <main className="flex flex-1 min-h-0 items-center justify-center overflow-y-auto p-8">
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

  return <ChatShell clients={clients} />;
}
