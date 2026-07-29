import { createDeepAgent } from "deepagents";
import { model } from "./model";
import { MAIN_AGENT_PROMPT, REWRITER_PROMPT } from "./prompts";
import {
  getClientProfile,
  lookupComplianceRules,
  flagViolation,
  checkSubstantiation,
  saveReview,
} from "./tools";

export { model } from "./model";

export const agent = createDeepAgent({
  model,
  systemPrompt: MAIN_AGENT_PROMPT,
  tools: [getClientProfile, lookupComplianceRules, flagViolation, checkSubstantiation, saveReview],
  subagents: [
    {
      name: "rewriter",
      description:
        "Rewrites the reviewed marketing copy to resolve every flagged compliance issue while preserving marketing intent and the client's brand tone. Call this once, after all findings are flagged and the overall risk is decided — never write the rewrite yourself. This subagent has no memory of the review conversation: in the task description, include the full original draft text, the complete list of findings (each with its flagged span, rule id, and suggested fix), and the client's brand tone. Returns the rewritten copy as plain text.",
      systemPrompt: REWRITER_PROMPT,
      tools: [],
    },
  ],
});
