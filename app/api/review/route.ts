import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { agent } from "@/agent/graph";
import { buildReviewMessage } from "@/agent/buildReviewMessage";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isRateLimitError, extractRetryDelaySeconds, sanitizeErrorMessage } from "@/lib/rateLimit";
import type { StreamEvent, ReviewRecord, FindingRecord } from "@/lib/types";

const requestSchema = z.object({
  clientId: z.string().uuid(),
  contentType: z.enum(["social_post", "ad_copy", "blog", "email"]),
  originalText: z.string().min(1),
});

// A full run makes several model calls (main loop + checkSubstantiation +
// the rewriter subagent); Gemini's free tier caps at ~15 requests/minute,
// which can exhaust a single call's own maxRetries (agent/model.ts) mid-run.
// This is the run-level retry on top of that per-call one.
const MAX_RUN_ATTEMPTS = 4;
const RETRY_BASE_DELAY_MS = 15_000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { clientId, contentType, originalText } = parsed.data;
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: StreamEvent) => {
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      };

      let reviewId: string | undefined;

      try {
        let attempt = 0;

        while (attempt < MAX_RUN_ATTEMPTS && !reviewId) {
          attempt++;

          try {
            // Plain .stream() with streamMode "updates" yields state after each
            // completed graph node — not LLM tokens mid-generation. Deliberately
            // NOT using the experimental streamEvents(..., {version:"v3"}) here:
            // it forces token-level model streaming, which is currently broken
            // for Gemini + tool-calling together (@langchain/google-genai +
            // deepagents both have open issues on this). Node-level updates
            // sidestep that entirely since each model turn still resolves via a
            // normal non-streaming call internally.
            const stream = await agent.stream(
              {
                messages: [
                  {
                    role: "user",
                    content: buildReviewMessage({ clientId, contentType, text: originalText }),
                  },
                ],
              },
              { streamMode: "updates", signal: request.signal },
            );

            for await (const chunk of stream) {
              for (const nodeUpdate of Object.values(chunk as Record<string, unknown>)) {
                const messages = ((nodeUpdate as { messages?: unknown[] })?.messages ?? []) as Array<
                  Record<string, unknown>
                >;

                for (const message of messages) {
                  const toolCalls = message.tool_calls as
                    | Array<{ name: string; args: Record<string, unknown> }>
                    | undefined;

                  if (toolCalls?.length) {
                    for (const call of toolCalls) {
                      switch (call.name) {
                        case "getClientProfile":
                          send({ type: "progress", message: "Loading client profile…" });
                          break;
                        case "lookupComplianceRules":
                          send({
                            type: "progress",
                            message: "Looking up applicable compliance rules…",
                          });
                          break;
                        case "flagViolation":
                          send({
                            type: "progress",
                            message: `Flagged ${call.args.ruleId} (${call.args.severity}): "${call.args.span}"`,
                          });
                          break;
                        case "checkSubstantiation":
                          send({
                            type: "progress",
                            message: "Checking substantiation for a claim…",
                          });
                          break;
                        case "task":
                          if (call.args.subagent_type === "rewriter") {
                            send({
                              type: "progress",
                              message: "Delegating rewrite to sub-agent…",
                            });
                          }
                          break;
                        case "saveReview":
                          send({ type: "progress", message: "Saving review…" });
                          break;
                      }
                    }
                  }

                  // ToolMessages carry the tool's name and its (often JSON-stringified) result.
                  const toolName = message.name as string | undefined;
                  if (toolName === "task") {
                    send({ type: "progress", message: "Rewrite complete" });
                  }
                  if (toolName && typeof message.content === "string") {
                    try {
                      const parsed = JSON.parse(message.content);
                      if (toolName === "getClientProfile" && parsed?.name) {
                        send({ type: "progress", message: `Loaded profile for ${parsed.name}` });
                      }
                      if (toolName === "lookupComplianceRules" && Array.isArray(parsed)) {
                        send({ type: "progress", message: `Retrieved ${parsed.length} rules` });
                      }
                      if (toolName === "saveReview" && parsed?.reviewId) {
                        reviewId = parsed.reviewId as string;
                      }
                    } catch {
                      // Non-JSON tool content (e.g. a plain string return) — nothing to parse.
                    }
                  }
                }
              }
            }

            break; // generator completed without throwing — done, no retry needed
          } catch (err) {
            if (reviewId) {
              // saveReview already succeeded before this (e.g. the model's
              // trailing wrap-up text) — the review is safely persisted,
              // nothing to retry, not a failure.
              break;
            }

            if (isRateLimitError(err) && attempt < MAX_RUN_ATTEMPTS) {
              const delaySeconds =
                extractRetryDelaySeconds(err) ?? (RETRY_BASE_DELAY_MS / 1000) * attempt;
              send({ type: "progress", message: sanitizeErrorMessage(err) });
              await sleep(delaySeconds * 1000);
              continue;
            }

            send({ type: "error", message: sanitizeErrorMessage(err) });
            return;
          }
        }

        if (!reviewId) {
          send({ type: "error", message: "Review completed but was not saved." });
          return;
        }

        const [{ data: reviewRow, error: reviewError }, { data: findingsRows, error: findingsError }] =
          await Promise.all([
            supabaseAdmin.from("reviews").select("*").eq("id", reviewId).single(),
            supabaseAdmin
              .from("findings")
              .select("*, compliance_rules(title, authority, category)")
              .eq("review_id", reviewId),
          ]);

        if (reviewError || !reviewRow) {
          send({ type: "error", message: `Failed to load saved review: ${reviewError?.message}` });
          return;
        }
        if (findingsError) {
          send({ type: "error", message: `Failed to load findings: ${findingsError.message}` });
          return;
        }

        send({
          type: "done",
          reviewId,
          review: reviewRow as ReviewRecord,
          findings: (findingsRows ?? []) as FindingRecord[],
        });
      } catch (err) {
        send({ type: "error", message: sanitizeErrorMessage(err) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
