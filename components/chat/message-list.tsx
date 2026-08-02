"use client";

import { motion } from "framer-motion";
import { HighlightedText } from "@/components/highlighted-text";
import { AssistantTurn } from "@/components/chat/assistant-turn";
import type { ChatMessage, FindingRecord, ReviewRecord } from "@/lib/types";

function UserBubble({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="ml-auto max-w-xl rounded-2xl rounded-tr-sm bg-primary/15 px-4 py-2.5 text-sm leading-relaxed"
    >
      {children}
    </motion.div>
  );
}

// Draft and rewrite text render on this surface — "paper on a desk," not a
// chat bubble, per the review-desk direction. Card is already subtly
// lighter than the page background, so no new token is needed.
function DocumentSurface({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="rounded-xl border border-border/70 bg-card/70 px-5 py-4 shadow-md shadow-black/25"
    >
      {children}
    </motion.div>
  );
}

function AssistantBubble({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="max-w-xl whitespace-pre-wrap rounded-2xl rounded-tl-sm bg-card/60 px-4 py-2.5 text-sm leading-relaxed"
    >
      {children}
    </motion.div>
  );
}

interface MessageListProps {
  originalText: string;
  findings: FindingRecord[];
  activeFindingId: string | null;
  onSelectFinding: (id: string) => void;
  reviewStatus: "streaming" | "done" | "error";
  reviewProgress: string[];
  review: ReviewRecord | null;
  reviewError: string | null;
  elapsedSeconds: number;
  onReplaceOriginal: (text: string) => void;
  onContinueConversation: () => void;
  followups: ChatMessage[];
  streamingFollowup: string | null;
  followupError: string | null;
}

export function MessageList({
  originalText,
  findings,
  activeFindingId,
  onSelectFinding,
  reviewStatus,
  reviewProgress,
  review,
  reviewError,
  elapsedSeconds,
  onReplaceOriginal,
  onContinueConversation,
  followups,
  streamingFollowup,
  followupError,
}: MessageListProps) {
  return (
    <div className="space-y-4">
      <DocumentSurface>
        <HighlightedText
          text={originalText}
          findings={findings}
          activeFindingId={activeFindingId}
          onSelectFinding={onSelectFinding}
        />
      </DocumentSurface>

      <AssistantTurn
        status={reviewStatus}
        progress={reviewProgress}
        elapsedSeconds={elapsedSeconds}
        review={review}
        findings={findings}
        errorMessage={reviewError}
        activeFindingId={activeFindingId}
        onSelectFinding={onSelectFinding}
        onReplaceOriginal={onReplaceOriginal}
        onContinue={onContinueConversation}
      />

      {followups.map((message) =>
        message.role === "user" ? (
          <UserBubble key={message.id}>{message.content}</UserBubble>
        ) : (
          <AssistantBubble key={message.id}>{message.content}</AssistantBubble>
        ),
      )}

      {streamingFollowup !== null && <AssistantBubble>{streamingFollowup}</AssistantBubble>}

      {followupError && (
        <p className="max-w-xl rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {followupError}
        </p>
      )}
    </div>
  );
}
