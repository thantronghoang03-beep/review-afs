import {
  getOpenRouterApiKey,
  OPENROUTER_BASE_URL,
  OPENROUTER_MODEL,
  MAX_INPUT_TOKENS,
  REQUEST_TIMEOUT_MS,
} from "./client";
import { buildSystemPrompt } from "./system-prompt";
import { findingsInputSchema, findingsResponseZod, type FindingsResponse } from "./findings-schema";
import type { PeriodType } from "@/types/check";

interface ReviewInput {
  clientName: string;
  fiscalYear: string;
  periodCurrentStart: string;
  periodCurrentEnd: string;
  periodPriorStart: string | null;
  periodPriorEnd: string | null;
  periodType: PeriodType;
  vnDocument: string;
  enDocument: string;
  ercDocument: string | null;
  ircDocument: string | null;
}

export interface ReviewResult {
  data: FindingsResponse;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
}

const TOOL_NAME = "submit_review_findings";

function buildUserMessage(input: ReviewInput): string {
  const parts = [
    `THÔNG TIN KHÁCH HÀNG:`,
    `- Tên khách hàng: ${input.clientName}`,
    `- Năm tài chính: ${input.fiscalYear}`,
    `- Kỳ kế toán năm nay: ${input.periodCurrentStart} đến ${input.periodCurrentEnd}`,
    `- Kỳ kế toán năm trước: ${
      input.periodPriorStart && input.periodPriorEnd
        ? `${input.periodPriorStart} đến ${input.periodPriorEnd}`
        : "N/A (không có kỳ trước)"
    }`,
    `- PERIOD_TYPE (đã xác định trước, không cần suy luận lại): ${input.periodType}`,
    ``,
    `TÀI LIỆU ERC: ${input.ercDocument ? "Đã cung cấp, nội dung bên dưới." : "KHÔNG được cung cấp — bỏ qua các kiểm tra ERC/IRC liên quan, đặt categories.erc_irc.checked=false."}`,
    `TÀI LIỆU IRC: ${input.ircDocument ? "Đã cung cấp, nội dung bên dưới." : "KHÔNG được cung cấp — bỏ qua các kiểm tra ERC/IRC liên quan, đặt categories.erc_irc.checked=false."}`,
    ``,
    `=== BÁO CÁO TIẾNG VIỆT (VN) ===`,
    input.vnDocument,
    ``,
    `=== BÁO CÁO TIẾNG ANH (EN) ===`,
    input.enDocument,
  ];

  if (input.ercDocument) {
    parts.push(``, `=== TÀI LIỆU ERC ===`, input.ercDocument);
  }
  if (input.ircDocument) {
    parts.push(``, `=== TÀI LIỆU IRC ===`, input.ircDocument);
  }

  return parts.join("\n");
}

export class ReviewInputTooLargeError extends Error {
  constructor(public approxTokenCount: number) {
    super(
      `Tài liệu đầu vào quá lớn (~${approxTokenCount.toLocaleString()} tokens ước tính, vượt ngưỡng ${MAX_INPUT_TOKENS.toLocaleString()}). Không thể cắt bớt nội dung vì sẽ làm sai lệch kết quả kiểm toán — vui lòng kiểm tra lại file PDF (có thể bị scan ảnh, hoặc quá nhiều trang).`
    );
  }
}

// OpenRouter has no token-counting endpoint like Anthropic's countTokens — this is a
// deliberately rough estimate (~4 chars/token) used only as an early, cheap guardrail.
// The real ceiling is enforced by the model provider itself; this just fails fast and
// legibly instead of burning minutes on a request likely to be rejected anyway.
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export async function runReview(input: ReviewInput): Promise<ReviewResult> {
  const systemPrompt = buildSystemPrompt();
  const userMessage = buildUserMessage(input);

  const approxTokens = estimateTokens(systemPrompt) + estimateTokens(userMessage);
  if (approxTokens > MAX_INPUT_TOKENS) {
    throw new ReviewInputTooLargeError(approxTokens);
  }

  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getOpenRouterApiKey()}`,
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      max_tokens: 32000,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: TOOL_NAME,
            description: "Nộp kết quả review báo cáo kiểm toán theo đúng schema JSON đã định nghĩa.",
            parameters: findingsInputSchema,
          },
        },
      ],
      tool_choice: { type: "function", function: { name: TOOL_NAME } },
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`OpenRouter API error (${response.status}): ${text.slice(0, 500)}`);
  }

  const json = await response.json();
  const message = json.choices?.[0]?.message;
  const toolCall = message?.tool_calls?.[0];
  if (!toolCall?.function?.arguments) {
    throw new Error("OpenRouter không trả về tool call như yêu cầu.");
  }

  let parsedArgs: unknown;
  try {
    parsedArgs = JSON.parse(toolCall.function.arguments);
  } catch {
    throw new Error("OpenRouter trả về tool call với arguments không phải JSON hợp lệ.");
  }

  const data = findingsResponseZod.parse(parsedArgs);

  return {
    data,
    inputTokens: json.usage?.prompt_tokens ?? 0,
    outputTokens: json.usage?.completion_tokens ?? 0,
    cacheReadTokens: json.usage?.prompt_tokens_details?.cached_tokens ?? 0,
  };
}
