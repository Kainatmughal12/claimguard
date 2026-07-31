import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getThread } from "@/lib/reviews";
import { ChatShell } from "@/components/chat/chat-shell";
import type { Client } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [thread, clientsResult] = await Promise.all([
    getThread(id).catch(() => null),
    supabaseAdmin.from("clients").select("id, name, specialty, state, brand_tone").order("name"),
  ]);

  if (!thread) {
    notFound();
  }

  const clients: Client[] = (clientsResult.data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    specialty: row.specialty,
    state: row.state,
    brandTone: row.brand_tone,
  }));

  return (
    <ChatShell
      clients={clients}
      initialThread={{
        reviewId: thread.review.id,
        originalText: thread.review.original_text,
        review: thread.review,
        findings: thread.findings,
        messages: thread.messages,
      }}
    />
  );
}
