"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HighlightedText } from "@/components/highlighted-text";
import type { FindingRecord, ReviewRecord } from "@/lib/types";

export type ViewMode = "original" | "rewritten";

interface OriginalRewriteViewProps {
  text: string;
  review: ReviewRecord | null;
  findings: FindingRecord[];
  activeFindingId: string | null;
  onSelectFinding: (id: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function OriginalRewriteView({
  text,
  review,
  findings,
  activeFindingId,
  onSelectFinding,
  viewMode,
  onViewModeChange,
}: OriginalRewriteViewProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!review?.rewritten_text) return;
    await navigator.clipboard.writeText(review.rewritten_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (!review?.rewritten_text) {
    return (
      <HighlightedText
        text={text}
        findings={findings}
        activeFindingId={activeFindingId}
        onSelectFinding={onSelectFinding}
      />
    );
  }

  return (
    <Tabs value={viewMode} onValueChange={(value) => onViewModeChange(value as ViewMode)}>
      <div className="flex items-center justify-between">
        <TabsList>
          <TabsTrigger value="original">Original</TabsTrigger>
          <TabsTrigger value="rewritten">Rewritten</TabsTrigger>
        </TabsList>
        {viewMode === "rewritten" && (
          <Button size="sm" variant="outline" onClick={handleCopy}>
            {copied ? "Copied" : "Copy"}
          </Button>
        )}
      </div>
      <TabsContent value="original">
        <HighlightedText
          text={text}
          findings={findings}
          activeFindingId={activeFindingId}
          onSelectFinding={onSelectFinding}
        />
      </TabsContent>
      <TabsContent value="rewritten">
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{review.rewritten_text}</p>
      </TabsContent>
    </Tabs>
  );
}
