import { z } from "zod";
import { tool } from "langchain";
import { supabaseAdmin } from "@/lib/supabase-admin";

const schema = z.object({
  span: z
    .string()
    .describe("The exact substring from the original text, copied character for character."),
  ruleId: z.string().describe("The id of a rule you actually loaded via lookupComplianceRules."),
  severity: z.enum(["low", "medium", "high"]),
  explanation: z.string().describe("One or two sentences, in plain language, addressed to a marketer."),
  suggestedFix: z.string().describe("A concrete alternative phrasing, not general advice."),
});

export const flagViolation = tool(
  async ({ ruleId }) => {
    const { data, error } = await supabaseAdmin
      .from("compliance_rules")
      .select("id")
      .eq("id", ruleId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to validate rule id ${ruleId}: ${error.message}`);
    }

    if (!data) {
      return {
        ok: false,
        reason: `"${ruleId}" is not a rule id from lookupComplianceRules. Only cite rule ids you actually loaded.`,
      };
    }

    return { ok: true };
  },
  {
    name: "flagViolation",
    description:
      "Record a single compliance finding. Call once per distinct problem, after checking the rule id came from lookupComplianceRules. Does not persist the finding — saveReview does that at the end.",
    schema,
  },
);
