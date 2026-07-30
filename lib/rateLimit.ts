// Shared Gemini rate-limit detection/messaging, used by both the streaming
// review route and scripts/test-agent.ts so the two don't drift.

export function isRateLimitError(err: unknown): boolean {
  const message = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return (
    message.includes("429") ||
    message.includes("rate limit") ||
    message.includes("resource_exhausted") ||
    message.includes("quota")
  );
}

// Gemini's own error text often includes a hint like "Please retry in
// 40.11916297s" — prefer that over a blind guess when present.
export function extractRetryDelaySeconds(err: unknown): number | null {
  const message = err instanceof Error ? err.message : String(err);
  const match = message.match(/retry in ([\d.]+)s/i);
  return match ? Math.ceil(parseFloat(match[1])) : null;
}

// The one place any caught error becomes user-facing text. Raw provider
// error strings (stack-trace-like, implementation-specific) never reach
// the client directly.
export function sanitizeErrorMessage(err: unknown): string {
  if (isRateLimitError(err)) {
    const delay = extractRetryDelaySeconds(err);
    return delay
      ? `Model rate limit reached (free tier). Retrying automatically in ~${delay}s…`
      : "Model rate limit reached (free tier). Retrying automatically…";
  }
  return "Something went wrong while reviewing this draft. Please try again.";
}
