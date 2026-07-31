import { cn } from "@/lib/utils";
import {
  OVERALL_RISK_BORDER_CLASS,
  OVERALL_RISK_LABEL,
  OVERALL_RISK_TEXT_CLASS,
} from "@/lib/severity";
import type { FindingRecord, ReviewRecord, Severity } from "@/lib/types";

const SEVERITY_ORDER: Severity[] = ["high", "medium", "low"];
const SEVERITY_COUNT_LABEL: Record<Severity, string> = {
  high: "high",
  medium: "medium",
  low: "low",
};

function countLine(findings: FindingRecord[]): string {
  const counts: Record<Severity, number> = { high: 0, medium: 0, low: 0 };
  for (const finding of findings) counts[finding.severity]++;

  const parts = SEVERITY_ORDER.filter((s) => counts[s] > 0).map(
    (s) => `${counts[s]} ${SEVERITY_COUNT_LABEL[s]}`,
  );

  const issueWord = findings.length === 1 ? "issue" : "issues";
  return `${findings.length} ${issueWord} found — ${parts.join(", ")}`;
}

interface VerdictBlockProps {
  review: ReviewRecord;
  findings: FindingRecord[];
}

export function VerdictBlock({ review, findings }: VerdictBlockProps) {
  const isPass = review.overall_risk === "pass";

  return (
    <div
      className={cn(
        "border-l-4 py-1 pl-4",
        OVERALL_RISK_BORDER_CLASS[review.overall_risk],
      )}
    >
      <p
        className={cn(
          "text-2xl font-semibold",
          OVERALL_RISK_TEXT_CLASS[review.overall_risk],
        )}
      >
        {OVERALL_RISK_LABEL[review.overall_risk]}
      </p>
      {!isPass && (
        <p className="mt-1 text-sm text-muted-foreground">{countLine(findings)}</p>
      )}
      <p className="mt-2 text-sm leading-relaxed">{review.agent_summary}</p>
    </div>
  );
}
