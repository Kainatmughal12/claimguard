"use client";

import { cn } from "@/lib/utils";
import { SEVERITY_HIGHLIGHT_CLASS, SEVERITY_UNDERLINE_CLASS } from "@/lib/severity";
import type { FindingRecord } from "@/lib/types";

interface HighlightedTextProps {
  text: string;
  findings: FindingRecord[];
  activeFindingId: string | null;
  onSelectFinding: (id: string) => void;
}

interface Segment {
  text: string;
  finding?: FindingRecord;
}

function buildSegments(text: string, findings: FindingRecord[]): Segment[] {
  interface Range {
    start: number;
    end: number;
    finding: FindingRecord;
  }
  const ranges: Range[] = [];

  for (const finding of findings) {
    const start = text.indexOf(finding.flagged_span);
    // Exact substring not found — degrade gracefully. The finding still
    // renders normally in the findings panel, just without a highlight here.
    if (start === -1) continue;
    const end = start + finding.flagged_span.length;
    const overlaps = ranges.some((r) => start < r.end && end > r.start);
    if (overlaps) continue;
    ranges.push({ start, end, finding });
  }

  ranges.sort((a, b) => a.start - b.start);

  const segments: Segment[] = [];
  let cursor = 0;
  for (const range of ranges) {
    if (range.start > cursor) {
      segments.push({ text: text.slice(cursor, range.start) });
    }
    segments.push({ text: text.slice(range.start, range.end), finding: range.finding });
    cursor = range.end;
  }
  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor) });
  }
  return segments;
}

export function HighlightedText({
  text,
  findings,
  activeFindingId,
  onSelectFinding,
}: HighlightedTextProps) {
  const segments = buildSegments(text, findings);

  return (
    <p className="whitespace-pre-wrap text-sm leading-relaxed">
      {segments.map((segment, i) =>
        segment.finding ? (
          <mark
            key={i}
            id={`span-${segment.finding.id}`}
            tabIndex={0}
            role="button"
            onClick={() => onSelectFinding(segment.finding!.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelectFinding(segment.finding!.id);
              }
            }}
            className={cn(
              "cursor-pointer rounded-sm px-0.5 text-foreground underline decoration-1 underline-offset-2 transition-colors hover:brightness-95 dark:hover:brightness-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              SEVERITY_HIGHLIGHT_CLASS[segment.finding.severity],
              SEVERITY_UNDERLINE_CLASS[segment.finding.severity],
              activeFindingId === segment.finding.id && "ring-1 ring-ring",
            )}
          >
            {segment.text}
          </mark>
        ) : (
          <span key={i}>{segment.text}</span>
        ),
      )}
    </p>
  );
}
