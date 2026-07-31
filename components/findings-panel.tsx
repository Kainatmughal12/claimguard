"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SEVERITY_BADGE_CLASS, SEVERITY_BORDER_CLASS, SEVERITY_LABEL } from "@/lib/severity";
import { VerdictBlock } from "@/components/verdict-block";
import type { FindingRecord, ReviewRecord } from "@/lib/types";

interface FindingsPanelProps {
  review: ReviewRecord;
  findings: FindingRecord[];
  activeFindingId: string | null;
  onSelectFinding: (id: string) => void;
}

export function FindingsPanel({
  review,
  findings,
  activeFindingId,
  onSelectFinding,
}: FindingsPanelProps) {
  function selectFinding(id: string) {
    onSelectFinding(id);
    document.getElementById(`span-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <div className="space-y-6">
      <VerdictBlock review={review} findings={findings} />

      {findings.length > 0 && (
        <div>
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Findings ({findings.length})
          </h2>

          <div className="mt-2 space-y-2">
            {findings.map((finding) => (
              <Card
                key={finding.id}
                id={`finding-${finding.id}`}
                size="sm"
                tabIndex={0}
                role="button"
                onClick={() => selectFinding(finding.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    selectFinding(finding.id);
                  }
                }}
                className={cn(
                  "cursor-pointer border-l-[3px] transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  SEVERITY_BORDER_CLASS[finding.severity],
                  activeFindingId === finding.id && "ring-1 ring-ring",
                )}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="font-mono">{finding.rule_id}</CardTitle>
                    <Badge className={SEVERITY_BADGE_CLASS[finding.severity]}>
                      {SEVERITY_LABEL[finding.severity]}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    {finding.compliance_rules?.title} · {finding.compliance_rules?.authority}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm leading-relaxed">{finding.explanation}</p>
                  <div className="rounded-md bg-muted/60 p-2.5">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Suggested fix
                    </p>
                    <p className="mt-1 text-sm leading-relaxed">{finding.suggested_fix}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
