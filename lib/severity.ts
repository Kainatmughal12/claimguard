import type { Severity } from "@/lib/types";

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
