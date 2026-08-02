"use client";

import { useRef, useState } from "react";
import { Hero } from "@/components/chat/hero";
import { Composer } from "@/components/chat/composer";
import { ClientChip, ContentTypeChip } from "@/components/chat/selector-chips";
import { SuggestionChips } from "@/components/chat/suggestion-chips";
import { MessageList } from "@/components/chat/message-list";
import { streamReview, streamFollowup } from "@/lib/reviewStream";
import type { Client, ChatMessage, ContentType, FindingRecord, ReviewRecord } from "@/lib/types";

type ReviewStatus = "idle" | "streaming" | "done" | "error";
type FollowupStatus = "idle" | "streaming" | "error";

export interface InitialThread {
  reviewId: string;
  originalText: string;
  review: ReviewRecord;
  findings: FindingRecord[];
  messages: ChatMessage[];
}

interface ChatShellProps {
  clients: Client[];
  initialThread?: InitialThread;
}

export function ChatShell({ clients, initialThread }: ChatShellProps) {
  const [clientId, setClientId] = useState<string | null>(null);
  const [contentType, setContentType] = useState<ContentType | null>(null);
  const [composerText, setComposerText] = useState("");

  const [originalText, setOriginalText] = useState<string | null>(initialThread?.originalText ?? null);
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>(initialThread ? "done" : "idle");
  const [reviewProgress, setReviewProgress] = useState<string[]>([]);
  const [reviewId, setReviewId] = useState<string | null>(initialThread?.reviewId ?? null);
  const [review, setReview] = useState<ReviewRecord | null>(initialThread?.review ?? null);
  const [findings, setFindings] = useState<FindingRecord[]>(initialThread?.findings ?? []);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [attemptedSubmitWithoutSelection, setAttemptedSubmitWithoutSelection] = useState(false);
  const [activeFindingId, setActiveFindingId] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const [followups, setFollowups] = useState<ChatMessage[]>(initialThread?.messages ?? []);
  const [followupStatus, setFollowupStatus] = useState<FollowupStatus>("idle");
  const [followupError, setFollowupError] = useState<string | null>(null);
  const [streamingFollowup, setStreamingFollowup] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const streamStartedAtRef = useRef(0);

  const mode: "new" | "followup" = reviewId ? "followup" : "new";
  const hasStarted = originalText !== null;

  async function handleSubmitReview() {
    if (reviewStatus === "streaming" || !composerText.trim()) return;
    if (!clientId || !contentType) {
      setAttemptedSubmitWithoutSelection(true);
      return;
    }
    setAttemptedSubmitWithoutSelection(false);

    const text = composerText;
    setOriginalText(text);
    setComposerText("");
    setReviewStatus("streaming");
    setReviewProgress([]);
    setReview(null);
    setFindings([]);
    setReviewError(null);
    setReviewId(null);
    setActiveFindingId(null);
    streamStartedAtRef.current = Date.now();

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      for await (const event of streamReview({ clientId, contentType, originalText: text }, controller.signal)) {
        if (event.type === "progress") {
          setReviewProgress((p) => [...p, event.message]);
        } else if (event.type === "done") {
          setReview(event.review);
          setFindings(event.findings);
          setReviewId(event.reviewId);
          setElapsedSeconds(Math.round((Date.now() - streamStartedAtRef.current) / 1000));
          setReviewStatus("done");
        } else if (event.type === "error") {
          setReviewError(event.message);
          setReviewStatus("error");
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setReviewStatus("idle");
        setOriginalText(null);
        setComposerText(text);
        return;
      }
      setReviewError(err instanceof Error ? err.message : "Something went wrong");
      setReviewStatus("error");
    }
  }

  async function handleSubmitFollowup() {
    if (!reviewId || !composerText.trim() || followupStatus === "streaming") return;

    const content = composerText;
    setComposerText("");
    setFollowupStatus("streaming");
    setFollowupError(null);
    setStreamingFollowup("");

    const controller = new AbortController();
    abortControllerRef.current = controller;

    let buffer = "";

    try {
      for await (const event of streamFollowup(reviewId, content, controller.signal)) {
        if (event.type === "status") {
          setStreamingFollowup(event.message);
        } else if (event.type === "token") {
          buffer += event.value;
          setStreamingFollowup(buffer);
        } else if (event.type === "done") {
          const userMessage: ChatMessage = {
            id: `local-${Date.now()}`,
            review_id: reviewId,
            role: "user",
            content,
            created_at: new Date().toISOString(),
          };
          setFollowups((f) => [...f, userMessage, event.message]);
          setStreamingFollowup(null);
          setFollowupStatus("idle");
        } else if (event.type === "error") {
          setFollowupError(event.message);
          setFollowupStatus("error");
          setStreamingFollowup(null);
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setFollowupStatus("idle");
        setStreamingFollowup(null);
        setComposerText(content);
        return;
      }
      setFollowupError(err instanceof Error ? err.message : "Something went wrong");
      setFollowupStatus("error");
      setStreamingFollowup(null);
    }
  }

  function handleComposerSubmit() {
    if (mode === "new") void handleSubmitReview();
    else void handleSubmitFollowup();
  }

  function handleCancel() {
    abortControllerRef.current?.abort();
  }

  function handleSuggestionSelect(draft: { contentType: ContentType; text: string }) {
    setContentType(draft.contentType);
    setComposerText(draft.text);
  }

  function handleReplaceOriginal(text: string) {
    setOriginalText(text);
  }

  function handleContinueConversation() {
    const el = document.getElementById("composer-textarea");
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    (el as HTMLTextAreaElement | null)?.focus();
  }

  const busy = mode === "new" ? reviewStatus === "streaming" : followupStatus === "streaming";
  const canSubmit =
    mode === "new"
      ? composerText.trim().length > 0 && reviewStatus !== "streaming"
      : composerText.trim().length > 0 && followupStatus !== "streaming";

  const missingSelectionMessage =
    mode === "new" && attemptedSubmitWithoutSelection
      ? !clientId && !contentType
        ? "Choose a client and a content type before sending."
        : !clientId
          ? "Choose a client before sending."
          : !contentType
            ? "Choose a content type before sending."
            : null
      : null;

  const composer = (
    <Composer
      value={composerText}
      onChange={setComposerText}
      onSubmit={handleComposerSubmit}
      onCancel={handleCancel}
      busy={busy}
      canSubmit={canSubmit}
      placeholder={mode === "new" ? "Paste marketing copy to review…" : "Ask a follow-up…"}
      topSlot={
        mode === "new" ? (
          <div className="px-1 pb-2">
            <div className="flex flex-wrap gap-2">
              <ClientChip
                clients={clients}
                clientId={clientId}
                onChange={setClientId}
                disabled={reviewStatus === "streaming"}
              />
              <ContentTypeChip
                contentType={contentType}
                onChange={setContentType}
                disabled={reviewStatus === "streaming"}
              />
            </div>
            {missingSelectionMessage && (
              <p className="mt-1.5 text-xs text-destructive" role="alert">
                {missingSelectionMessage}
              </p>
            )}
          </div>
        ) : undefined
      }
    />
  );

  if (!hasStarted) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-4 pt-16 pb-16">
        <Hero />
        {composer}
        <SuggestionChips onSelect={handleSuggestionSelect} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pt-6">
      <div className="flex-1 pb-4">
        <MessageList
          originalText={originalText}
          findings={findings}
          activeFindingId={activeFindingId}
          onSelectFinding={setActiveFindingId}
          reviewStatus={reviewStatus === "idle" ? "streaming" : reviewStatus}
          reviewProgress={reviewProgress}
          review={review}
          reviewError={reviewError}
          elapsedSeconds={elapsedSeconds}
          onReplaceOriginal={handleReplaceOriginal}
          onContinueConversation={handleContinueConversation}
          followups={followups}
          streamingFollowup={streamingFollowup}
          followupError={followupError}
        />
      </div>
      <div className="sticky bottom-4 pb-4">{composer}</div>
    </div>
  );
}
