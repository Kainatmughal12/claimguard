import type { ContentType, StreamEvent, FollowupStreamEvent } from "@/lib/types";

export interface ReviewStreamInput {
  clientId: string;
  contentType: ContentType;
  originalText: string;
}

async function* streamNdjson<T>(response: Response): AsyncGenerator<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? `Request failed with status ${response.status}`);
  }
  if (!response.body) {
    throw new Error("No response body");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim()) continue;
      yield JSON.parse(line) as T;
    }
  }

  if (buffer.trim()) {
    yield JSON.parse(buffer) as T;
  }
}

export async function* streamReview(
  input: ReviewStreamInput,
  signal?: AbortSignal,
): AsyncGenerator<StreamEvent> {
  const response = await fetch("/api/review", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal,
  });

  yield* streamNdjson<StreamEvent>(response);
}

export async function* streamFollowup(
  reviewId: string,
  content: string,
  signal?: AbortSignal,
): AsyncGenerator<FollowupStreamEvent> {
  const response = await fetch(`/api/reviews/${reviewId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
    signal,
  });

  yield* streamNdjson<FollowupStreamEvent>(response);
}
