"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { SEVERITY_BADGE_CLASS, SEVERITY_LABEL } from "@/lib/severity";
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
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!review.rewritten_text) return;
    await navigator.clipboard.writeText(review.rewritten_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function selectFinding(id: string) {
    onSelectFinding(id);
    document.getElementById(`span-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-medium text-muted-foreground">
          {findings.length === 0 ? "Findings" : `Findings (${findings.length})`}
        </h2>

        {findings.length === 0 ? (
          <Card size="sm" className="mt-2 ring-severity-pass/30">
            <CardContent>
              <p className="text-sm font-medium text-severity-pass">No issues found.</p>
              <p className="mt-1 text-sm text-muted-foreground">{review.agent_summary}</p>
            </CardContent>
          </Card>
        ) : (
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
        )}
      </div>

      {review.rewritten_text && (
        <div>
          <Separator className="my-4" />
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground">Rewrite</h2>
            <Button size="sm" variant="outline" onClick={handleCopy}>
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <Card size="sm" className="mt-2">
            <CardContent>
              <p className="whitespace-pre-wrap text-sm">{review.rewritten_text}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
