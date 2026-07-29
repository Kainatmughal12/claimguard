import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

// Split out from graph.ts so tools (e.g. checkSubstantiation) can reuse the
// same client/retry config without an import cycle through graph.ts, which
// itself imports the tools.
export const model = new ChatGoogleGenerativeAI({
  // gemini-3.5-flash's free tier is capped at ~20 requests/day, which a
  // multi-tool-call agent burns through in a single run. gemini-3.5-flash-lite
  // is a separate per-model quota bucket with a much higher free-tier cap.
  model: "gemini-3.5-flash-lite",
  apiKey: process.env.GOOGLE_API_KEY,
  // Free-tier Gemini is rate-limited (~10 RPM); rely on LangChain's built-in
  // exponential backoff on retryable errors (429/5xx) instead of hand-rolling it.
  maxRetries: 5,
});
