import { supabaseAdmin } from "@/lib/supabase-admin";
import type { ThreadSummary, ReviewRecord, FindingRecord, ChatMessage, Client } from "@/lib/types";

export async function getThreadSummaries(limit?: number): Promise<ThreadSummary[]> {
  let query = supabaseAdmin
    .from("reviews")
    .select("id, content_type, overall_risk, original_text, created_at, clients(name), findings(count)")
    .order("created_at", { ascending: false });

  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((row) => {
    const client = row.clients as unknown as { name: string } | null;
    const findingCount = row.findings as unknown as { count: number }[] | null;
    return {
      id: row.id,
      client_name: client?.name ?? "Unknown client",
      content_type: row.content_type,
      overall_risk: row.overall_risk,
      created_at: row.created_at,
      snippet: row.original_text.slice(0, 140),
      finding_count: findingCount?.[0]?.count ?? 0,
    };
  });
}

export interface Thread {
  review: ReviewRecord;
  findings: FindingRecord[];
  messages: ChatMessage[];
  client: Client | null;
}

export async function getThread(id: string): Promise<Thread> {
  const [{ data: review, error: reviewError }, { data: findings, error: findingsError }, { data: messages, error: messagesError }] =
    await Promise.all([
      supabaseAdmin.from("reviews").select("*, clients(id, name, specialty, state, brand_tone)").eq("id", id).single(),
      supabaseAdmin
        .from("findings")
        .select("*, compliance_rules(title, authority, category)")
        .eq("review_id", id),
      supabaseAdmin.from("messages").select("*").eq("review_id", id).order("created_at", { ascending: true }),
    ]);

  if (reviewError || !review) throw new Error(reviewError?.message ?? "Review not found");
  if (findingsError) throw new Error(findingsError.message);
  // Degrade gracefully rather than 404ing the whole thread: a thread's
  // review + findings are the core content, follow-up history is optional.
  if (messagesError) {
    console.warn(`Could not load messages for review ${id}: ${messagesError.message}`);
  }

  const clientRow = review.clients as unknown as {
    id: string;
    name: string;
    specialty: string;
    state: string | null;
    brand_tone: string | null;
  } | null;

  const client: Client | null = clientRow
    ? {
        id: clientRow.id,
        name: clientRow.name,
        specialty: clientRow.specialty,
        state: clientRow.state,
        brandTone: clientRow.brand_tone,
      }
    : null;

  return {
    review: review as ReviewRecord,
    findings: (findings ?? []) as FindingRecord[],
    messages: messagesError ? [] : ((messages ?? []) as ChatMessage[]),
    client,
  };
}
