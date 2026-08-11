import type Anthropic from "@anthropic-ai/sdk";
import { getAnthropicClient, CLAUDE_MODEL, MAX_INPUT_TOKENS } from "./client";
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

export async function countReviewTokens(input: ReviewInput): Promise<number> {
  const client = getAnthropicClient();
  const result = await client.messages.countTokens({
    model: CLAUDE_MODEL,
    system: buildSystemPrompt(),
    messages: [{ role: "user", content: buildUserMessage(input) }],
  });
  return result.input_tokens;
}

export class ReviewInputTooLargeError extends Error {
  constructor(public tokenCount: number) {
    super(
      `Tài liệu đầu vào quá lớn (~${tokenCount.toLocaleString()} tokens, vượt ngưỡng ${MAX_INPUT_TOKENS.toLocaleString()}). Không thể cắt bớt nội dung vì sẽ làm sai lệch kết quả kiểm toán — vui lòng kiểm tra lại file PDF (có thể bị scan ảnh, hoặc quá nhiều trang).`
    );
  }
}

export async function runReview(input: ReviewInput): Promise<ReviewResult> {
  const tokenCount = await countReviewTokens(input);
  if (tokenCount > MAX_INPUT_TOKENS) {
    throw new ReviewInputTooLargeError(tokenCount);
  }

  const client = getAnthropicClient();
  // Findings output can legitimately need tens of thousands of tokens for large audit
  // reports; max_tokens this high requires streaming per the SDK's long-request rule.
  const stream = client.messages.stream({
    model: CLAUDE_MODEL,
    max_tokens: 32000,
    system: [
      {
        type: "text",
        text: buildSystemPrompt(),
        cache_control: { type: "ephemeral" },
      },
    ],
    tools: [
      {
        name: TOOL_NAME,
        description: "Nộp kết quả review báo cáo kiểm toán theo đúng schema JSON đã định nghĩa.",
        input_schema: findingsInputSchema as unknown as Anthropic.Tool.InputSchema,
      },
    ],
    tool_choice: { type: "tool", name: TOOL_NAME },
    messages: [{ role: "user", content: buildUserMessage(input) }],
  });
  const response = await stream.finalMessage();

  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Claude không trả về tool_use block như yêu cầu.");
  }

  const data = findingsResponseZod.parse(toolUse.input);

  return {
    data,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
  };
}
