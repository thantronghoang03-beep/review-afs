export const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

// Overridable via env so the model slug can be bumped without a code change —
// OpenRouter's catalog naming (and which models are free) shifts often; verified working
// (proper forced tool-call output) against OpenRouter's live API on 2026-08-12.
// nvidia/nemotron-3.5-lightning:free is used as the default: genuinely free (":free"),
// 1M-token context (needed since audit report pairs — VN+EN — can run to tens of
// thousands of tokens), and reliably returns valid structured tool-call output.
// Quality/reliability on the 874-line master prompt will be lower than Claude — check
// https://openrouter.ai/models?max_price=0 if this model gets deprecated or rate-limited.
export const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "nvidia/nemotron-3.5-lightning:free";

export function getOpenRouterApiKey(): string {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set. Add it to .env.local.");
  }
  return apiKey;
}

// Conservative pre-flight budget: fail loudly rather than silently truncate audit content.
// The default model above has a 1M-token context; override via OPENROUTER_MAX_INPUT_TOKENS
// if you switch to a smaller-context model.
export const MAX_INPUT_TOKENS = Number(process.env.OPENROUTER_MAX_INPUT_TOKENS) || 800_000;

// A long audit review call can legitimately run for several minutes — don't let the
// default fetch timeout cut it short.
export const REQUEST_TIMEOUT_MS = 10 * 60 * 1000;
