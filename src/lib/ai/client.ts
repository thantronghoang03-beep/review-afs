import Anthropic from "@anthropic-ai/sdk";

let cachedClient: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!cachedClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not set. Add it to .env.local.");
    }
    cachedClient = new Anthropic({ apiKey });
  }
  return cachedClient;
}

export const CLAUDE_MODEL = "claude-sonnet-5";

// Conservative pre-flight budget: fail loudly rather than silently truncate audit content.
export const MAX_INPUT_TOKENS = 700_000;
