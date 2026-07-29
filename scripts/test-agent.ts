// Manual verification script for step 3 — run 6-8 sample drafts through the
// real agent and eyeball the output. Not an assertion-based test suite.
//
// Usage: npx tsx scripts/test-agent.ts
import { agent } from "../agent/graph";
import { buildReviewMessage } from "../agent/buildReviewMessage";
import type { ContentType } from "../lib/types";

interface Draft {
  label: "clean" | "flagrant" | "borderline";
  clientId: string;
  clientName: string;
  contentType: ContentType;
  text: string;
}

const DRAFTS: Draft[] = [
  {
    label: "clean",
    clientId: "fcf02b32-e149-4899-8d92-27669cd46ad2",
    clientName: "Maple Street Dental",
    contentType: "social_post",
    text: "Fall is here! We're welcoming new patients at Maple Street Dental. Schedule your cleaning and exam today — our team is ready to help you keep your smile healthy. Call or book online.",
  },
  {
    label: "clean",
    clientId: "49e97159-0b21-479f-8875-0600b8b67908",
    clientName: "Bright Sky Dermatology",
    contentType: "email",
    text: "Hi there — this is a reminder that your annual skin check with Bright Sky Dermatology is coming up next week. If you need to reschedule, just reply to this email or call our office. We look forward to seeing you.",
  },
  {
    label: "flagrant",
    clientId: "84133b03-6ac1-43ba-917d-d38910f1d59f",
    clientName: "Willow & Glow Med Spa",
    contentType: "ad_copy",
    text: "Introducing our new fat-dissolving treatment — guaranteed to melt away stubborn fat with zero risk and zero downtime! 95% of our clients see permanent results after just one session. Completely safe, completely painless. Book now and see the difference in your before and after photos!",
  },
  {
    label: "flagrant",
    clientId: "4bac44f1-8987-4fb8-91fc-63fc79f83b77",
    clientName: "Cascade Chiropractic & Wellness",
    contentType: "blog",
    text: "Regular chiropractic adjustments prevent heart disease and boost your immune system — it's clinically proven. One patient, Maria, 42, came to us with chronic migraines and after two visits she was completely cured. Our chiropractors are specialists in functional neurology, and we're proud to be the #1 rated clinic in the region.",
  },
  {
    label: "flagrant",
    clientId: "fcf02b32-e149-4899-8d92-27669cd46ad2",
    clientName: "Maple Street Dental",
    contentType: "email",
    text: "Our whitening treatment is 100% guaranteed to give you a permanently brighter smile — no risk, no hassle. Featuring our medical-grade advanced whitening science, trusted by dentists everywhere.",
  },
  {
    label: "borderline",
    clientId: "fcf02b32-e149-4899-8d92-27669cd46ad2",
    clientName: "Maple Street Dental",
    contentType: "social_post",
    text: "Voted a favorite dental practice by our patients three years running! We think that says something about the care we provide. New patients welcome.",
  },
  {
    label: "borderline",
    clientId: "49e97159-0b21-479f-8875-0600b8b67908",
    clientName: "Bright Sky Dermatology",
    contentType: "ad_copy",
    text: "Recommended by dermatologists for sensitive skin care.",
  },
  {
    label: "borderline",
    clientId: "84133b03-6ac1-43ba-917d-d38910f1d59f",
    clientName: "Willow & Glow Med Spa",
    contentType: "email",
    text: "Limited time: $99 introductory facial package for new clients. Book this month and save.",
  },
];

// Gemini free tier is ~10 RPM, and a single draft can involve several model
// calls (main agent loop + checkSubstantiation + the rewriter subagent).
// The model client already retries individual calls (agent/model.ts,
// maxRetries: 5); this is the outer safety net for when a whole draft's
// agent.invoke() still throws after that's exhausted.
const DELAY_BETWEEN_DRAFTS_MS = 10_000;
const MAX_ATTEMPTS_PER_DRAFT = 4;
const RETRY_BASE_DELAY_MS = 15_000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRateLimitError(err: unknown): boolean {
  const message = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return (
    message.includes("429") ||
    message.includes("rate limit") ||
    message.includes("resource_exhausted") ||
    message.includes("quota")
  );
}

interface ToolCall {
  name: string;
  args: Record<string, unknown>;
}

function extractToolCalls(messages: unknown[]): ToolCall[] {
  const calls: ToolCall[] = [];
  for (const message of messages) {
    const toolCalls = (message as { tool_calls?: ToolCall[] }).tool_calls;
    if (toolCalls) calls.push(...toolCalls);
  }
  return calls;
}

async function runDraft(draft: Draft) {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS_PER_DRAFT; attempt++) {
    try {
      const result = await agent.invoke({
        messages: [
          {
            role: "user",
            content: buildReviewMessage({
              clientId: draft.clientId,
              contentType: draft.contentType,
              text: draft.text,
            }),
          },
        ],
      });
      return { ok: true as const, result };
    } catch (err) {
      if (isRateLimitError(err) && attempt < MAX_ATTEMPTS_PER_DRAFT) {
        const backoffMs = RETRY_BASE_DELAY_MS * attempt;
        console.log(
          `  [rate-limited, retrying in ${backoffMs / 1000}s — attempt ${attempt}/${MAX_ATTEMPTS_PER_DRAFT}]`,
        );
        await sleep(backoffMs);
        continue;
      }
      return { ok: false as const, error: err };
    }
  }
  return { ok: false as const, error: new Error("exhausted retries") };
}

async function main() {
  console.log(`Running ${DRAFTS.length} sample drafts against the ClaimGuard agent.\n`);

  for (const [i, draft] of DRAFTS.entries()) {
    console.log(
      `\n=== [${i + 1}/${DRAFTS.length}] ${draft.label.toUpperCase()} — ${draft.clientName} (${draft.contentType}) ===`,
    );
    console.log(`Draft: ${draft.text}\n`);

    const outcome = await runDraft(draft);

    if (!outcome.ok) {
      const message = outcome.error instanceof Error ? outcome.error.message : String(outcome.error);
      console.log(`  [ERROR] ${message}`);
    } else {
      const toolCalls = extractToolCalls(outcome.result.messages as unknown[]);
      const flagCalls = toolCalls.filter((c) => c.name === "flagViolation");
      const saveCall = toolCalls.find((c) => c.name === "saveReview");

      console.log(`  Flags raised: ${flagCalls.length}`);
      for (const flag of flagCalls) {
        console.log(`    - [${flag.args.severity}] ${flag.args.ruleId}: "${flag.args.span}"`);
        console.log(`      ${flag.args.explanation}`);
      }

      if (saveCall) {
        const review = saveCall.args.review as Record<string, unknown>;
        console.log(`  Overall risk: ${review.overallRisk}`);
        console.log(`  Agent summary: ${review.agentSummary}`);
        if (review.rewrittenText) {
          console.log(`  Rewrite:\n${review.rewrittenText}`);
        }
      } else {
        console.log("  [WARNING] No saveReview call found — review was not persisted.");
      }
    }

    if (i < DRAFTS.length - 1) {
      console.log(`  (waiting ${DELAY_BETWEEN_DRAFTS_MS / 1000}s before the next draft)`);
      await sleep(DELAY_BETWEEN_DRAFTS_MS);
    }
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Fatal error running test-agent script:", err);
  process.exitCode = 1;
});
