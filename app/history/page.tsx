import Link from "next/link";
import { HistoryIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getThreadSummaries } from "@/lib/reviews";
import { OVERALL_RISK_BADGE_CLASS, OVERALL_RISK_LABEL } from "@/lib/severity";
import { CONTENT_TYPES } from "@/lib/content-types";
import type { ThreadSummary } from "@/lib/types";

export const dynamic = "force-dynamic";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default async function HistoryPage() {
  let threads: ThreadSummary[];
  let loadError: string | null = null;

  try {
    threads = await getThreadSummaries();
  } catch (err) {
    threads = [];
    loadError = err instanceof Error ? err.message : "Couldn't load review history.";
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 min-h-0 overflow-y-auto px-6 py-10">
      <h1 className="text-xl font-semibold tracking-tight">Review history</h1>
      <p className="mt-1 text-sm text-muted-foreground">Past compliance reviews, most recent first.</p>

      {loadError && <p className="mt-6 text-sm text-destructive">{loadError}</p>}

      {!loadError && threads.length === 0 && (
        <div className="mt-16 flex flex-col items-center gap-3 text-center">
          <HistoryIcon className="size-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            No reviews yet — start one from the composer and it will show up here.
          </p>
          <Link href="/" className="text-sm text-primary underline underline-offset-2">
            Start a review
          </Link>
        </div>
      )}

      <div className="mt-6 space-y-2">
        {threads.map((thread) => (
          <Link
            key={thread.id}
            href={`/review/${thread.id}`}
            className="block rounded-xl border border-border/60 bg-card/50 p-4 transition-colors hover:border-primary/40 hover:bg-card/80"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">{thread.client_name}</span>
                <Badge variant="secondary" className="text-xs">
                  {CONTENT_TYPES.find((c) => c.value === thread.content_type)?.label ?? thread.content_type}
                </Badge>
                {thread.overall_risk && (
                  <Badge className={OVERALL_RISK_BADGE_CLASS[thread.overall_risk]}>
                    {OVERALL_RISK_LABEL[thread.overall_risk]}
                  </Badge>
                )}
              </div>
              <span className="text-xs text-muted-foreground">{formatDate(thread.created_at)}</span>
            </div>
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{thread.snippet}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
