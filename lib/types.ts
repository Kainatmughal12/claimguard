export interface ComplianceRule {
  id: string;
  category: string;
  title: string;
  plain_english_rule: string;
  authority: string;
  applies_to_specialties: string[] | null;
  severity_default: "low" | "medium" | "high";
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
  contentType: "social_post" | "ad_copy" | "blog" | "email";
  originalText: string;
  rewrittenText: string | null;
  overallRisk: "pass" | "needs_revision" | "high_risk";
  agentSummary: string;
}

export interface FindingInput {
  ruleId: string;
  flaggedSpan: string;
  severity: "low" | "medium" | "high";
  explanation: string;
  suggestedFix: string;
}
