import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { model } from "@/agent/model";
import { buildFollowupMessage } from "@/agent/buildFollowupMessage";
import { FOLLOWUP_CHAT_PROMPT } from "@/agent/prompts";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getThread } from "@/lib/reviews";
import { isRateLimitError, extractRetryDelaySeconds, sanitizeErrorMessage } from "@/lib/rateLimit";
import type { FollowupStreamEvent, ChatMessage } from "@/lib/types";

const requestSchema = z.object({
  content: z.string().min(1),
});

// This path makes a single non-tool-calling model call, so it's far less
// rate-limit-exposed than the review route's multi-tool-call run — a couple
// of retries at a shorter backoff is enough.
const MAX_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 10_000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: reviewId } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { content: userContent } = parsed.data;

  let thread;
  try {
    thread = await getThread(reviewId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Review not found";
    return NextResponse.json({ error: message }, { status: 404 });
  }

  const { review: reviewRow, findings, messages: priorMessages, client } = thread;

  const messages = [
    { role: "system" as const, content: FOLLOWUP_CHAT_PROMPT },
    ...buildFollowupMessage(
      {
        client: client ?? { name: "Unknown client", specialty: "unknown", state: null, brandTone: null },
        contentType: reviewRow.content_type,
        originalText: reviewRow.original_text,
        rewrittenText: reviewRow.rewritten_text,
        agentSummary: reviewRow.agent_summary,
        findings,
        priorMessages,
      },
      userContent,
    ),
  ];

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: FollowupStreamEvent) => {
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      };

      let assistantText = "";

      try {
        let attempt = 0;
        let succeeded = false;

        while (attempt < MAX_ATTEMPTS && !succeeded) {
          attempt++;
          assistantText = "";

          try {
            const modelStream = await model.stream(messages, { signal: request.signal });

            for await (const chunk of modelStream) {
              const value = typeof chunk.content === "string" ? chunk.content : "";
              if (value) {
                assistantText += value;
                send({ type: "token", value });
              }
            }

            succeeded = true;
          } catch (err) {
            if (assistantText) {
              // Partial output already streamed to the client — treat what
              // we have as final rather than retrying and duplicating text.
              succeeded = true;
              break;
            }

            if (isRateLimitError(err) && attempt < MAX_ATTEMPTS) {
              const delaySeconds =
                extractRetryDelaySeconds(err) ?? (RETRY_BASE_DELAY_MS / 1000) * attempt;
              send({ type: "status", message: sanitizeErrorMessage(err) });
              await sleep(delaySeconds * 1000);
              continue;
            }

            send({ type: "error", message: sanitizeErrorMessage(err) });
            return;
          }
        }

        if (!assistantText.trim()) {
          send({ type: "error", message: "No response was generated. Please try again." });
          return;
        }

        const { error: userInsertError } = await supabaseAdmin
          .from("messages")
          .insert({ review_id: reviewId, role: "user", content: userContent });

        if (userInsertError) {
          send({ type: "error", message: `Failed to save message: ${userInsertError.message}` });
          return;
        }

        const { data: assistantRow, error: assistantInsertError } = await supabaseAdmin
          .from("messages")
          .insert({ review_id: reviewId, role: "assistant", content: assistantText })
          .select("*")
          .single();

        if (assistantInsertError || !assistantRow) {
          send({ type: "error", message: `Failed to save reply: ${assistantInsertError?.message}` });
          return;
        }

        send({ type: "done", message: assistantRow as ChatMessage });
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
