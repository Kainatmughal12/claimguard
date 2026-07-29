import { z } from "zod";
import { tool } from "langchain";
import { supabaseAdmin } from "@/lib/supabase-admin";

const reviewSchema = z.object({
  clientId: z.string().uuid(),
  contentType: z.enum(["social_post", "ad_copy", "blog", "email"]),
  originalText: z.string(),
  rewrittenText: z.string().nullable(),
  overallRisk: z.enum(["pass", "needs_revision", "high_risk"]),
  agentSummary: z.string(),
});

const findingSchema = z.object({
  ruleId: z.string(),
  flaggedSpan: z.string(),
  severity: z.enum(["low", "medium", "high"]),
  explanation: z.string(),
  suggestedFix: z.string(),
});

const schema = z.object({
  review: reviewSchema,
  findings: findingSchema.array(),
});

export const saveReview = tool(
  async ({ review, findings }) => {
    // Hard constraint: every finding must cite a rule_id that exists in
    // compliance_rules. Validate here, at write time, and drop the rest —
    // this is the authoritative gate, not flagViolation.
    const citedRuleIds = [...new Set(findings.map((f) => f.ruleId))];
    const { data: validRules, error: rulesError } = await supabaseAdmin
      .from("compliance_rules")
      .select("id")
      .in("id", citedRuleIds.length > 0 ? citedRuleIds : [""]);

    if (rulesError) {
      throw new Error(`Failed to validate rule ids: ${rulesError.message}`);
    }

    const validRuleIds = new Set((validRules ?? []).map((r) => r.id));
    const validatedFindings = findings.filter((f) => validRuleIds.has(f.ruleId));

    const { data: reviewRow, error: reviewError } = await supabaseAdmin
      .from("reviews")
      .insert({
        client_id: review.clientId,
        content_type: review.contentType,
        original_text: review.originalText,
        rewritten_text: review.rewrittenText,
        overall_risk: review.overallRisk,
        agent_summary: review.agentSummary,
      })
      .select("id")
      .single();

    if (reviewError || !reviewRow) {
      throw new Error(`Failed to save review: ${reviewError?.message}`);
    }

    const reviewId = reviewRow.id as string;

    if (validatedFindings.length > 0) {
      const { error: findingsError } = await supabaseAdmin.from("findings").insert(
        validatedFindings.map((f) => ({
          review_id: reviewId,
          rule_id: f.ruleId,
          flagged_span: f.flaggedSpan,
          severity: f.severity,
          explanation: f.explanation,
          suggested_fix: f.suggestedFix,
        })),
      );

      if (findingsError) {
        throw new Error(`Failed to save findings: ${findingsError.message}`);
      }
    }

    return { reviewId };
  },
  {
    name: "saveReview",
    description:
      "Persist the completed review and its findings. Call this last, after the rewrite is delegated. Findings citing an unknown rule id are silently dropped.",
    schema,
  },
);
