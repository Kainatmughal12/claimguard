"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SEVERITY_BADGE_CLASS, SEVERITY_LABEL } from "@/lib/severity";
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
    <div className="space-y-4">
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
                onClick={() => selectFinding(finding.id)}
                className={cn(
                  "cursor-pointer",
                  activeFindingId === finding.id && "ring-1 ring-ring",
                )}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="font-mono">{finding.rule_id}</CardTitle>
                      <CardDescription>
                        {finding.compliance_rules?.title} · {finding.compliance_rules?.authority}
                      </CardDescription>
                    </div>
                    <Badge className={SEVERITY_BADGE_CLASS[finding.severity]}>
                      {SEVERITY_LABEL[finding.severity]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  <p className="text-sm">{finding.explanation}</p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Fix:</span>{" "}
                    {finding.suggested_fix}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
