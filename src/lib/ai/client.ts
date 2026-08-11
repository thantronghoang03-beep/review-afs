export const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

// Overridable via env so the model slug can be bumped without a code change —
// OpenRouter's catalog naming (and which models are free) shifts often.
// nvidia/nemotron-3-super-120b-a12b:free is used as the default: verified live on
// 2026-08-12 against a real audit report pair to actually catch known real defects
// (VSA 706 wording, missing BCLCTT line labels per master prompt §8.9) — an earlier
// default (nemotron-3.5-lightning:free) returned a valid response but found nothing at
// all in the same document. Still meaningfully weaker than a frontier paid model (fewer
// total checked items per run than Claude) — check https://openrouter.ai/models?max_price=0
// if this model gets deprecated/rate-limited, and re-verify quality before trusting it blindly.
export const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "nvidia/nemotron-3-super-120b-a12b:free";

export function getOpenRouterApiKey(): string {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set. Add it to .env.local.");
  }
  return apiKey;
}

// Conservative pre-flight budget: fail loudly rather than silently truncate audit content.
// The default model above has a ~262K-token context; override via OPENROUTER_MAX_INPUT_TOKENS
// if you switch to a larger- or smaller-context model.
export const MAX_INPUT_TOKENS = Number(process.env.OPENROUTER_MAX_INPUT_TOKENS) || 200_000;

// A long audit review call can legitimately run for several minutes — don't let the
// default fetch timeout cut it short.
export const REQUEST_TIMEOUT_MS = 10 * 60 * 1000;
