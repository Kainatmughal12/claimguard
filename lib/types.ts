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
