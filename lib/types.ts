export type ContentType = "social_post" | "ad_copy" | "blog" | "email";
export type Severity = "low" | "medium" | "high";
export type OverallRisk = "pass" | "needs_revision" | "high_risk";

export interface ComplianceRule {
  id: string;
  category: string;
  title: string;
  plain_english_rule: string;
  authority: string;
  applies_to_specialties: string[] | null;
  severity_default: Severity;
  example_violation: string | null;
  example_fix: string | null;
}

export interface ClientProfile {
  name: string;
  specialty: string;
  state: string | null;
  brandTone: string | null;
}

export interface ReviewInput {
  clientId: string;
  contentType: ContentType;
  originalText: string;
  rewrittenText: string | null;
  overallRisk: OverallRisk;
  agentSummary: string;
}

export interface FindingInput {
  ruleId: string;
  flaggedSpan: string;
  severity: Severity;
  explanation: string;
  suggestedFix: string;
}

export interface Client extends ClientProfile {
  id: string;
}

export interface ReviewRecord {
  id: string;
  client_id: string;
  content_type: ContentType;
  original_text: string;
  rewritten_text: string | null;
  overall_risk: OverallRisk;
  agent_summary: string;
  created_at: string;
}

export interface FindingRecord {
  id: string;
  review_id: string;
  rule_id: string;
  flagged_span: string;
  severity: Severity;
  explanation: string;
  suggested_fix: string;
  compliance_rules: {
    title: string;
    authority: string;
    category: string;
  } | null;
}

export type StreamEvent =
  | { type: "progress"; message: string }
  | { type: "done"; reviewId: string; review: ReviewRecord; findings: FindingRecord[] }
  | { type: "error"; message: string };
