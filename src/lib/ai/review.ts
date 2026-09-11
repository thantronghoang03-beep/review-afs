import type Anthropic from "@anthropic-ai/sdk";
import { getAnthropicClient, CLAUDE_MODEL, MAX_INPUT_TOKENS } from "./client";
import { buildSystemPrompt } from "./system-prompt";
import { findingsInputSchema, findingsResponseZod, type FindingsResponse } from "./findings-schema";
import { isMockReviewEnabled, buildMockFindingsResponse } from "./mock-review";
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
  // null = ERC/IRC không được cung cấp; "na" = cung cấp và không thay đổi; "yes" = có
  // thay đổi so với bản gốc (kèm cờ đã có bản gốc để đối chiếu hay chưa).
  ercChanged: "na" | "yes" | null;
  ircChanged: "na" | "yes" | null;
  ercHasOriginal: boolean;
  ircHasOriginal: boolean;
  // Mục 2 / Mục 15 (v6.1) — bản Draft/Issue liền kề trước đó, tùy chọn.
  draftDocument: string | null;
  // Mục 2 / Mục 9A (v6.1) — hồ sơ pháp lý mở rộng (giấy phép con, ưu đãi thuế, hợp
  // đồng thuê đất...), tùy chọn, có thể ghép nhiều file.
  legalDossierDocument: string | null;
  // "Bắt đầu kiểm tra mẫu" trên form — ép trả kết quả mẫu, không gọi Claude thật, bất
  // kể biến môi trường MOCK_AI_REVIEW. Khác với MOCK_AI_REVIEW (áp dụng toàn hệ thống),
  // đây là lựa chọn của người dùng cho TỪNG lượt kiểm tra.
  forceMock?: boolean;
}

export interface ReviewResult {
  data: FindingsResponse;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
}

const TOOL_NAME = "submit_review_findings";

// Mirrors master prompt's "Logic xử lý ghi chú ERC/IRC" exactly:
// - N/A (không thay đổi) → không cần bản gốc, ghi nhận bình thường, không Warning.
// - Có thay đổi nhưng không cung cấp bản gốc → AI PHẢI ghi Warning "chưa xác minh được".
// - Có đủ bản gốc và bản mới nhất → đối chiếu đầy đủ, không Warning.
function describeErcIrcStatus(
  label: "ERC" | "IRC",
  documentProvided: boolean,
  changed: "na" | "yes" | null,
  hasOriginal: boolean
): string {
  if (!documentProvided) {
    return `TÀI LIỆU ${label}: KHÔNG được cung cấp — bỏ qua các kiểm tra ${label} liên quan, đặt categories.erc_irc.checked=false với skipped_reason phù hợp.`;
  }
  if (changed === "yes" && !hasOriginal) {
    return `TÀI LIỆU ${label}: Đã cung cấp bản mới nhất. Người dùng xác nhận CÓ thay đổi so với bản gốc nhưng KHÔNG cung cấp bản gốc để đối chiếu — theo Mục 9, PHẢI ghi Warning "Chưa xác minh được so với bản gốc — cần cung cấp ${label} lần đầu" vào các mục ${label} liên quan.`;
  }
  if (changed === "yes" && hasOriginal) {
    return `TÀI LIỆU ${label}: Đã cung cấp CẢ bản mới nhất và bản gốc (người dùng xác nhận có thay đổi) — đối chiếu đầy đủ theo Mục 9, không cần ghi Warning về việc thiếu bản gốc.`;
  }
  return `TÀI LIỆU ${label}: Đã cung cấp bản mới nhất. Người dùng xác nhận KHÔNG có thay đổi so với bản gốc — ghi nhận bình thường, không cần Warning về bản gốc.`;
}

// Mục 2 (Master Prompt v6.1) quy định input trong user message phải bọc trong đúng bộ
// thẻ này để model nhận diện đủ ngữ cảnh — giữ nguyên tên thẻ, kể cả khi giá trị là N/A.
function buildUserMessage(input: ReviewInput): string {
  const notesParts = [
    `THÔNG TIN KHÁCH HÀNG:`,
    `- Tên khách hàng: ${input.clientName}`,
    `- Năm tài chính: ${input.fiscalYear}`,
    `- PERIOD_TYPE (đã xác định trước, không cần suy luận lại): ${input.periodType}`,
    ``,
    describeErcIrcStatus("IRC", Boolean(input.ircDocument), input.ircChanged, input.ircHasOriginal),
    describeErcIrcStatus("ERC", Boolean(input.ercDocument), input.ercChanged, input.ercHasOriginal),
  ].join("\n");

  const tags = [
    ["che_do_chay", "kiem_tra_bao_cao"],
    ["bao_cao_en", input.enDocument],
    ["bao_cao_vn", input.vnDocument],
    ["erc_moi_nhat", input.ercDocument ?? "N/A"],
    ["erc_goc", input.ercHasOriginal ? "(xem trong erc_moi_nhat ở trên — bao gồm cả bản gốc)" : "N/A"],
    ["irc_moi_nhat", input.ircDocument ?? "N/A"],
    ["irc_goc", input.ircHasOriginal ? "(xem trong irc_moi_nhat ở trên — bao gồm cả bản gốc)" : "N/A"],
    ["draft_truoc", input.draftDocument ?? "N/A"],
    ["ho_so_phap_ly", input.legalDossierDocument ?? "N/A"],
    [
      "nien_do_nam_truoc",
      input.periodPriorStart && input.periodPriorEnd
        ? `${input.periodPriorStart} đến ${input.periodPriorEnd}`
        : "N/A",
    ],
    ["nien_do_nam_nay", `${input.periodCurrentStart} đến ${input.periodCurrentEnd}`],
  ] as const;

  const tagBlocks = tags.map(([tag, content]) => `<${tag}>\n${content}\n</${tag}>`);

  return [notesParts, ``, ...tagBlocks].join("\n");
}

export async function countReviewTokens(input: ReviewInput): Promise<number> {
  const client = getAnthropicClient();
  const result = await client.messages.countTokens({
    model: CLAUDE_MODEL,
    system: buildSystemPrompt("kiem_tra_bao_cao"),
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

let cachedSystemBlocks: Anthropic.TextBlockParam[] | null = null;
function getSystemBlocks(): Anthropic.TextBlockParam[] {
  if (!cachedSystemBlocks) {
    cachedSystemBlocks = [
      {
        type: "text",
        text: buildSystemPrompt("kiem_tra_bao_cao"),
        cache_control: { type: "ephemeral" },
      },
    ];
  }
  return cachedSystemBlocks;
}

// Mục 0 điểm 3 / Mục 9B (v6.1): bắt buộc bật web_search để model tự tra cứu hiệu lực
// Luật/Nghị định/Thông tư trước khi kết luận Critical. web_search là "server tool" —
// Anthropic tự thực thi và nối kết quả vào cùng một message, không cần vòng lặp
// client-side cho riêng bước tra cứu.
const REVIEW_TOOLS: Anthropic.ToolUnion[] = [
  { type: "web_search_20250305", name: "web_search" },
  {
    name: TOOL_NAME,
    description: "Nộp kết quả review báo cáo kiểm toán theo đúng schema JSON đã định nghĩa.",
    input_schema: findingsInputSchema as unknown as Anthropic.Tool.InputSchema,
  },
];

function extractToolUse(response: Anthropic.Message): Anthropic.ToolUseBlock | null {
  const block = response.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === TOOL_NAME
  );
  return block ?? null;
}

export async function runReview(input: ReviewInput): Promise<ReviewResult> {
  // Chế độ thử nghiệm không cần ANTHROPIC_API_KEY và không gọi Claude — trả về ngay
  // một bộ finding mẫu cố định để test luồng xử lý/giao diện. Bật bằng biến môi
  // trường MOCK_AI_REVIEW=true trong .env.local, HOẶC do người dùng bấm "Bắt đầu kiểm
  // tra mẫu" cho riêng lượt này (input.forceMock).
  if (isMockReviewEnabled() || input.forceMock) {
    // Giả lập độ trễ xử lý thật để trạng thái "Đang xử lý" trên UI có thời gian hiển thị.
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return {
      data: buildMockFindingsResponse({
        clientName: input.clientName,
        periodType: input.periodType,
        ercDocument: input.ercDocument,
        ircDocument: input.ircDocument,
        legalDossierDocument: input.legalDossierDocument,
        draftDocument: input.draftDocument,
      }),
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 0,
    };
  }

  const tokenCount = await countReviewTokens(input);
  if (tokenCount > MAX_INPUT_TOKENS) {
    throw new ReviewInputTooLargeError(tokenCount);
  }

  const client = getAnthropicClient();
  const userMessage: Anthropic.MessageParam = { role: "user", content: buildUserMessage(input) };

  // Findings output can legitimately need tens of thousands of tokens for large audit
  // reports; max_tokens this high requires streaming per the SDK's long-request rule.
  // tool_choice is "auto" (not forced) here so the model is free to call "web_search"
  // one or more times first, per Mục 9B — a forced single-tool choice would block that.
  // 64000 (not 32000): Sonnet 5 runs adaptive thinking by default and thinking tokens
  // count against max_tokens same as visible output — a report with many web_search
  // round-trips + a long findings array could exhaust a smaller budget mid-JSON before
  // ever reaching "findings"/"summary", producing a syntactically-valid but incomplete
  // tool_use.input (missing required keys) instead of a clean truncation error.
  const firstStream = client.messages.stream({
    model: CLAUDE_MODEL,
    max_tokens: 64000,
    system: getSystemBlocks(),
    tools: REVIEW_TOOLS,
    tool_choice: { type: "auto" },
    messages: [userMessage],
  });
  const firstResponse = await firstStream.finalMessage();

  let toolUse = extractToolUse(firstResponse);
  let followUpResponse: Anthropic.Message | null = null;

  if (!toolUse) {
    // Model finished (e.g. after its own web_search round-trips) without calling
    // submit_review_findings — continue the same conversation and force it this time,
    // per system-prompt.ts: "LƯỢT GỌI TOOL CUỐI CÙNG bắt buộc phải là submit_review_findings".
    const followUpStream = client.messages.stream({
      model: CLAUDE_MODEL,
      max_tokens: 64000,
      system: getSystemBlocks(),
      tools: REVIEW_TOOLS,
      tool_choice: { type: "tool", name: TOOL_NAME },
      messages: [
        userMessage,
        { role: "assistant", content: firstResponse.content },
        {
          role: "user",
          content:
            "Hãy nộp kết quả review đầy đủ ngay bây giờ bằng cách gọi tool submit_review_findings, dựa trên toàn bộ nội dung và kết quả tra cứu đã có ở trên.",
        },
      ],
    });
    followUpResponse = await followUpStream.finalMessage();
    toolUse = extractToolUse(followUpResponse);
  }

  if (!toolUse) {
    throw new Error("Claude không trả về tool_use block như yêu cầu.");
  }

  // Nếu bị cắt giữa chừng vì hết max_tokens (kể cả token dùng cho "suy nghĩ" nội bộ —
  // Sonnet 5 mặc định bật adaptive thinking, tính chung vào max_tokens), tool_use.input
  // có thể là JSON hợp lệ về cú pháp nhưng THIẾU hẳn các field bắt buộc cuối schema
  // ("findings"/"summary") vì model chưa sinh tới đó — Zod sẽ báo "expected array,
  // received undefined" rất khó hiểu. Bắt lỗi này sớm, báo rõ nguyên nhân thay vì để
  // lỗi Zod thô rơi thẳng vào audit_review_error.
  const lastResponse = followUpResponse ?? firstResponse;
  if (lastResponse.stop_reason === "max_tokens") {
    throw new Error(
      "Claude bị cắt giữa chừng vì báo cáo quá dài/quá nhiều phát hiện, chưa kịp hoàn thành kết quả (hết max_tokens). Vui lòng thử lại — nếu vẫn lặp lại, có thể cần chia nhỏ báo cáo hoặc báo cho đội kỹ thuật để tăng giới hạn."
    );
  }

  const data = findingsResponseZod.parse(toolUse.input);

  return {
    data,
    inputTokens: firstResponse.usage.input_tokens + (followUpResponse?.usage.input_tokens ?? 0),
    outputTokens: firstResponse.usage.output_tokens + (followUpResponse?.usage.output_tokens ?? 0),
    cacheReadTokens:
      (firstResponse.usage.cache_read_input_tokens ?? 0) +
      (followUpResponse?.usage.cache_read_input_tokens ?? 0),
  };
}
