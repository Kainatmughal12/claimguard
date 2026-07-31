"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShieldAlertIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ProgressLog } from "@/components/progress-log";
import { RewriteBlock } from "@/components/chat/rewrite-block";
import { cn } from "@/lib/utils";
import {
  OVERALL_RISK_BADGE_CLASS,
  OVERALL_RISK_LABEL,
  SEVERITY_BADGE_CLASS,
  SEVERITY_BORDER_CLASS,
  SEVERITY_LABEL,
} from "@/lib/severity";
import type { FindingRecord, ReviewRecord } from "@/lib/types";

interface AssistantTurnProps {
  status: "streaming" | "done" | "error";
  progress: string[];
  elapsedSeconds: number;
  review: ReviewRecord | null;
  findings: FindingRecord[];
  errorMessage: string | null;
  activeFindingId: string | null;
  onSelectFinding: (id: string) => void;
  onReplaceOriginal: (text: string) => void;
  onContinue: () => void;
}

export function AssistantTurn({
  status,
  progress,
  elapsedSeconds,
  review,
  findings,
  errorMessage,
  activeFindingId,
  onSelectFinding,
  onReplaceOriginal,
  onContinue,
}: AssistantTurnProps) {
  const [openIds, setOpenIds] = useState<string[]>(() => (findings[0] ? [findings[0].id] : []));

  // "Adjusting state when a prop changes" pattern (react.dev) — done during
  // render, not in an effect, so opening the accordion item doesn't lag a
  // frame behind the click that set activeFindingId.
  const [syncedFindingId, setSyncedFindingId] = useState(activeFindingId);
  if (activeFindingId !== syncedFindingId) {
    setSyncedFindingId(activeFindingId);
    if (activeFindingId && !openIds.includes(activeFindingId)) {
      setOpenIds((ids) => [...ids, activeFindingId]);
    }
  }

  useEffect(() => {
    if (activeFindingId) {
      document.getElementById(`finding-${activeFindingId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeFindingId]);

  return (
    <div className="max-w-2xl space-y-4 rounded-2xl border border-border/60 bg-card/50 p-4">
      <ProgressLog messages={progress} collapsed={status === "done"} elapsedSeconds={elapsedSeconds} />

      {status === "error" && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{errorMessage}</p>
      )}

      {status === "done" && review && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          <div className="border-l-4 border-primary/40 py-1 pl-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={OVERALL_RISK_BADGE_CLASS[review.overall_risk]}>
                {OVERALL_RISK_LABEL[review.overall_risk]}
              </Badge>
              {findings.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {findings.length} issue{findings.length === 1 ? "" : "s"} found
                </span>
              )}
            </div>
            <p className="mt-2 text-sm leading-relaxed">{review.agent_summary}</p>
          </div>

          {findings.length > 0 && (
            <Accordion
              value={openIds}
              onValueChange={(v) => {
                const nextIds = v as string[];
                setOpenIds(nextIds);
                const newlyOpened = nextIds.find((id) => !openIds.includes(id));
                if (newlyOpened) onSelectFinding(newlyOpened);
              }}
            >
              {findings.map((finding) => (
                <AccordionItem key={finding.id} value={finding.id} id={`finding-${finding.id}`}>
                  <AccordionTrigger className={cn("border-l-2 pl-2.5", SEVERITY_BORDER_CLASS[finding.severity])}>
                    <span className="flex flex-1 flex-wrap items-center gap-2">
                      <ShieldAlertIcon className="size-3.5 shrink-0 text-muted-foreground" />
                      <span className="font-mono text-xs">{finding.rule_id}</span>
                      <Badge className={SEVERITY_BADGE_CLASS[finding.severity]}>
                        {SEVERITY_LABEL[finding.severity]}
                      </Badge>
                      <span className="text-xs font-normal text-muted-foreground">
                        {finding.compliance_rules?.title}
                      </span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pl-2.5">
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      &ldquo;{finding.flagged_span}&rdquo;
                    </p>
                    <p className="mt-2 text-sm leading-relaxed">{finding.explanation}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {finding.compliance_rules?.authority}
                    </p>
                    <div className="mt-2 rounded-md bg-muted/60 p-2.5">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Suggested fix
                      </p>
                      <p className="mt-1 text-sm leading-relaxed">{finding.suggested_fix}</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}

          {review.rewritten_text && (
            <RewriteBlock
              text={review.rewritten_text}
              onReplaceOriginal={onReplaceOriginal}
              onContinue={onContinue}
            />
          )}
        </motion.div>
      )}
    </div>
  );
}
