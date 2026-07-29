import { z } from "zod";
import { tool } from "langchain";
import { model } from "@/agent/model";

const schema = z.object({
  claimText: z.string().describe("The specific claim to assess, e.g. an efficacy, safety, or statistical claim."),
});

const resultSchema = z.object({
  requiresEvidence: z.boolean(),
  reasoning: z.string(),
});

const SUBSTANTIATION_PROMPT = `You assess whether a single healthcare marketing claim requires evidentiary
support (a cited source, clinical study, or similar) before it can be
published, under FTC Act §5 substantiation principles.

Judge the claim on its own. Set requiresEvidence to true if the claim asserts
efficacy, safety, a statistic, or a comparison that a reasonable reader would
take as a factual, verifiable assertion. Set it to false if the claim is
opinion, a general statement about the practice, or already appropriately
qualified (e.g. "may help", "individual results vary").

Give a one-sentence reasoning for your judgment.`;

const structuredModel = model.withStructuredOutput(resultSchema);

export const checkSubstantiation = tool(
  async ({ claimText }) => {
    return structuredModel.invoke([
      { role: "system", content: SUBSTANTIATION_PROMPT },
      { role: "user", content: claimText },
    ]);
  },
  {
    name: "checkSubstantiation",
    description:
      "Judge whether a specific claim (efficacy, safety, or a statistic) requires evidentiary support before it can be flagged or cleared. Call this on a claim before deciding whether to flag it.",
    schema,
  },
);
