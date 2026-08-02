import type { ClientProfile, ContentType, FindingRecord, ChatMessage } from "@/lib/types";

export interface FollowupContext {
  client: ClientProfile;
  contentType: ContentType;
  originalText: string;
  rewrittenText: string | null;
  agentSummary: string;
  findings: FindingRecord[];
  priorMessages: ChatMessage[];
}

// Plain role/content objects (BaseMessageLike) — matches the shape
// buildReviewMessage's caller already passes to agent.stream().
export type FollowupMessage = { role: "system" | "user" | "assistant"; content: string };

export function buildFollowupMessage(
  personaPrompt: string,
  context: FollowupContext,
  newUserMessage: string,
): FollowupMessage[] {
  const findingsList = context.findings.length
    ? context.findings
        .map(
          (f) =>
            `- [${f.rule_id}] (${f.severity}) "${f.flagged_span}" — ${f.explanation}${
              f.suggested_fix ? ` Suggested fix: ${f.suggested_fix}` : ""
            }`,
        )
        .join("\n")
    : "No findings — this draft passed review.";

  const systemContext = `## Client
Name: ${context.client.name}
Specialty: ${context.client.specialty}
Brand tone: ${context.client.brandTone ?? "not specified"}

## Content type
${context.contentType}

## Original draft
${context.originalText}

## Review summary
${context.agentSummary}

## Findings
${findingsList}

## Current rewrite
${context.rewrittenText ?? "No rewrite was produced."}`;

  const history: FollowupMessage[] = context.priorMessages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  // Gemini (via @langchain/google-genai) rejects a request with more than
  // one system-role message ("System message should be the first one") —
  // merge the persona and the context into a single leading system message
  // rather than letting the caller prepend its own.
  return [
    { role: "system", content: `${personaPrompt}\n\n${systemContext}` },
    ...history,
    { role: "user", content: newUserMessage },
  ];
}
