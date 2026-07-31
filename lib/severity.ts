import type { OverallRisk, Severity } from "@/lib/types";

// Single source of truth for severity color usage — reused identically by
// the finding-card badge and the text-highlight background so the same
// color always means the same thing everywhere on screen.
export const SEVERITY_LABEL: Record<Severity, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

export const SEVERITY_BADGE_CLASS: Record<Severity, string> = {
  high: "bg-severity-high/10 text-severity-high dark:bg-severity-high/20",
  medium: "bg-severity-medium/10 text-severity-medium dark:bg-severity-medium/20",
  low: "bg-severity-low/10 text-severity-low dark:bg-severity-low/20",
};

export const SEVERITY_HIGHLIGHT_CLASS: Record<Severity, string> = {
  high: "bg-severity-high/15 dark:bg-severity-high/25",
  medium: "bg-severity-medium/15 dark:bg-severity-medium/25",
  low: "bg-severity-low/15 dark:bg-severity-low/25",
};

export const SEVERITY_BORDER_CLASS: Record<Severity, string> = {
  high: "border-severity-high",
  medium: "border-severity-medium",
  low: "border-severity-low",
};

export const SEVERITY_UNDERLINE_CLASS: Record<Severity, string> = {
  high: "decoration-severity-high",
  medium: "decoration-severity-medium",
  low: "decoration-severity-low",
};

// Overall risk reuses the same severity color system: high_risk maps to the
// same red as a high-severity finding, needs_revision to the medium amber,
// and pass to the color reserved for the all-clear state.
export const OVERALL_RISK_LABEL: Record<OverallRisk, string> = {
  high_risk: "High Risk",
  needs_revision: "Needs Revision",
  pass: "Pass",
};

export const OVERALL_RISK_BADGE_CLASS: Record<OverallRisk, string> = {
  high_risk: "bg-severity-high/10 text-severity-high dark:bg-severity-high/20",
  needs_revision: "bg-severity-medium/10 text-severity-medium dark:bg-severity-medium/20",
  pass: "bg-severity-pass/10 text-severity-pass dark:bg-severity-pass/20",
};

export const OVERALL_RISK_TEXT_CLASS: Record<OverallRisk, string> = {
  high_risk: "text-severity-high",
  needs_revision: "text-severity-medium",
  pass: "text-severity-pass",
};

export const OVERALL_RISK_BORDER_CLASS: Record<OverallRisk, string> = {
  high_risk: "border-severity-high",
  needs_revision: "border-severity-medium",
  pass: "border-severity-pass",
};
