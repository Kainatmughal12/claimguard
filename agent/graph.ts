import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { createDeepAgent } from "deepagents";

const model = new ChatGoogleGenerativeAI({
  model: "gemini-3.5-flash",
  apiKey: process.env.GOOGLE_API_KEY,
  // Free-tier Gemini is rate-limited (~10 RPM); rely on LangChain's built-in
  // exponential backoff on retryable errors (429/5xx) instead of hand-rolling it.
  maxRetries: 5,
});

export const agent = createDeepAgent({
  model,
  systemPrompt:
    "You are ClaimGuard, a healthcare marketing compliance reviewer.",
});
