export const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

// Overridable via env so the model slug can be bumped without a code change —
// OpenRouter's catalog naming can shift independently of Anthropic's own model ids.
export const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "anthropic/claude-sonnet-4.5";

export function getOpenRouterApiKey(): string {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set. Add it to .env.local.");
  }
  return apiKey;
}

// Conservative pre-flight budget: fail loudly rather than silently truncate audit content.
export const MAX_INPUT_TOKENS = 700_000;

// A long audit review call can legitimately run for several minutes — don't let the
// default fetch timeout cut it short.
export const REQUEST_TIMEOUT_MS = 10 * 60 * 1000;
