"use client";

import { useRef, useState } from "react";
import { ReviewForm } from "@/components/review-form";
import { OriginalRewriteView, type ViewMode } from "@/components/original-rewrite-view";
import { FindingsPanel } from "@/components/findings-panel";
import { ProgressLog } from "@/components/progress-log";
import { Skeleton } from "@/components/ui/skeleton";
import { streamReview } from "@/lib/reviewStream";
import type { Client, ContentType, FindingRecord, ReviewRecord } from "@/lib/types";

type Status = "idle" | "streaming" | "done" | "error";

interface ReviewWorkspaceProps {
  clients: Client[];
}

export function ReviewWorkspace({ clients }: ReviewWorkspaceProps) {
  const [clientId, setClientId] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState<string[]>([]);
  const [submittedText, setSubmittedText] = useState<string | null>(null);
  const [review, setReview] = useState<ReviewRecord | null>(null);
  const [findings, setFindings] = useState<FindingRecord[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeFindingId, setActiveFindingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("original");
  const abortControllerRef = useRef<AbortController | null>(null);

  const selectedClient = clients.find((c) => c.id === clientId) ?? null;

  function selectFindingFromPanel(id: string) {
    setViewMode("original");
    setActiveFindingId(id);
  }

  async function handleSubmit(input: {
    clientId: string;
    contentType: ContentType;
    originalText: string;
  }) {
    setStatus("streaming");
    setProgress([]);
    setReview(null);
    setFindings([]);
    setErrorMessage(null);
    setActiveFindingId(null);
    setViewMode("original");
    setSubmittedText(input.originalText);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      for await (const event of streamReview(input, controller.signal)) {
        if (event.type === "progress") {
          setProgress((p) => [...p, event.message]);
        } else if (event.type === "done") {
          setReview(event.review);
          setFindings(event.findings);
          setStatus("done");
        } else if (event.type === "error") {
          setErrorMessage(event.message);
          setStatus("error");
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setStatus("idle");
        setSubmittedText(null);
        return;
      }
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  function handleCancel() {
    abortControllerRef.current?.abort();
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 p-6">
      {selectedClient && (
        <p className="text-xs text-muted-foreground">
          {[selectedClient.name, selectedClient.specialty, selectedClient.state, selectedClient.brandTone]
            .filter(Boolean)
            .join(" · ")}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr_360px]">
        <div>
          <ReviewForm
            clients={clients}
            status={status}
            clientId={clientId}
            onClientIdChange={setClientId}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </div>

        <div className={submittedText === null ? "min-w-0 self-start rounded-lg border p-4" : "min-w-0 rounded-lg border p-4"}>
          {submittedText === null ? (
            <p className="text-sm text-muted-foreground">Your draft will appear here.</p>
          ) : (
            <OriginalRewriteView
              text={submittedText}
              review={review}
              findings={findings}
              activeFindingId={activeFindingId}
              onSelectFinding={setActiveFindingId}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
          )}
        </div>

        <div className="min-w-0">
          {status === "streaming" && (
            <div className="space-y-4">
              <ProgressLog messages={progress} />
              <div className="space-y-2">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          )}
          {status === "error" && <p className="text-sm text-destructive">{errorMessage}</p>}
          {status === "done" && review && (
            <FindingsPanel
              review={review}
              findings={findings}
              activeFindingId={activeFindingId}
              onSelectFinding={selectFindingFromPanel}
            />
          )}
          {status === "idle" && submittedText === null && (
            <p className="text-sm text-muted-foreground">Findings will appear here.</p>
          )}
        </div>
      </div>
    </div>
  );
}
