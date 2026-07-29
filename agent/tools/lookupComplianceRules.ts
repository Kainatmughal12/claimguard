import { z } from "zod";
import { tool } from "langchain";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { ComplianceRule } from "@/lib/types";

const CATEGORIES = [
  "Treatment and outcome claims",
  "Substantiation",
  "Testimonials and endorsements",
  "Superlatives and credentials",
  "Guarantees and risk language",
  "Patient privacy",
  "Required disclosures",
] as const;

const schema = z.object({
  categories: z
    .enum(CATEGORIES)
    .array()
    .optional()
    .describe(
      "Rule categories relevant to this content. Omit to load rules from every category — safer than guessing when unsure.",
    ),
  specialty: z
    .string()
    .describe("The client's specialty, e.g. 'dental', 'dermatology', 'med_spa', 'chiropractic'."),
});

export const lookupComplianceRules = tool(
  async ({ categories, specialty }): Promise<ComplianceRule[]> => {
    let query = supabaseAdmin.from("compliance_rules").select("*");

    if (categories && categories.length > 0) {
      query = query.in("category", categories);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to load compliance rules: ${error.message}`);
    }

    const rules = (data ?? []) as ComplianceRule[];
    return rules.filter(
      (rule) =>
        !rule.applies_to_specialties ||
        rule.applies_to_specialties.includes(specialty),
    );
  },
  {
    name: "lookupComplianceRules",
    description:
      "Load the compliance rules that apply to this content. Pass the categories relevant to what you're reviewing and the client's specialty. Never review from memory — this is the authority.",
    schema,
  },
);
