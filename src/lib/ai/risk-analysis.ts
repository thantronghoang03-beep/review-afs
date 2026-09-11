import type Anthropic from "@anthropic-ai/sdk";
import { getAnthropicClient, CLAUDE_MODEL } from "./client";
import { buildSystemPrompt } from "./system-prompt";
import { riskAnalysisInputSchema, riskAnalysisResponseZod, type RiskAnalysisResponse } from "./risk-analysis-schema";
import { isMockReviewEnabled, buildMockRiskAnalysisResponse } from "./mock-review";
import type { PeriodType } from "@/types/check";

const TOOL_NAME = "submit_risk_analysis";

interface RiskAnalysisInput {
  clientName: string;
  fiscalYear: string;
  periodType: PeriodType;
  periodCurrentStart: string;
  periodCurrentEnd: string;
  periodPriorStart: string | null;
  periodPriorEnd: string | null;
  vnDocument: string;
  enDocument: string;
  // Người dùng mô tả tự do về hoạt động công ty (nguyên tắc doanh thu, giá vốn, cơ cấu
  // chi phí...) khi tick "Phân tích rủi ro báo cáo tài chính" — tùy chọn, dùng làm bối
  // cảnh để đối chiếu số liệu với thực tế hoạt động, không bắt buộc.
  businessDescription: string | null;
  // "Bắt đầu kiểm tra mẫu" trên form — ép trả kết quả mẫu, không gọi Claude thật.
  forceMock?: boolean;
}

// Mục 2 (v6.6) — cùng bộ thẻ input với chế độ kiem_tra_bao_cao, nhưng chế độ này (Mục
// 2.1) chỉ cần BCTC VN/EN + niên độ làm nền cho Mục 11B/11C — không cần ERC/IRC/hồ sơ
// pháp lý/bản liền kề (những thẻ đó thuộc phạm vi kiem_tra_bao_cao). "mo_ta_hoat_dong"
// là thẻ mở rộng riêng của app (không có trong Mục 2 gốc) để truyền bối cảnh hoạt động.
function buildUserMessage(input: RiskAnalysisInput): string {
  const notes = [
    `THÔNG TIN KHÁCH HÀNG:`,
    `- Tên khách hàng: ${input.clientName}`,
    `- Năm tài chính: ${input.fiscalYear}`,
    `- PERIOD_TYPE (đã xác định trước, không cần suy luận lại): ${input.periodType}`,
  ].join("\n");

  const tags = [
    ["che_do_chay", "phan_tich_rui_ro"],
    ["bao_cao_en", input.enDocument],
    ["bao_cao_vn", input.vnDocument],
    [
      "nien_do_nam_truoc",
      input.periodPriorStart && input.periodPriorEnd
        ? `${input.periodPriorStart} đến ${input.periodPriorEnd}`
        : "N/A",
    ],
    ["nien_do_nam_nay", `${input.periodCurrentStart} đến ${input.periodCurrentEnd}`],
    ["mo_ta_hoat_dong", input.businessDescription?.trim() || "N/A — không có mô tả, bỏ qua bước đối chiếu bối cảnh hoạt động"],
  ] as const;

  const tagBlocks = tags.map(([tag, content]) => `<${tag}>\n${content}\n</${tag}>`);

  return [notes, ``, ...tagBlocks].join("\n");
}

let cachedSystemBlocks: Anthropic.TextBlockParam[] | null = null;
function getSystemBlocks(): Anthropic.TextBlockParam[] {
  if (!cachedSystemBlocks) {
    cachedSystemBlocks = [
      {
        type: "text",
        text: buildSystemPrompt("phan_tich_rui_ro"),
        cache_control: { type: "ephemeral" },
      },
    ];
  }
  return cachedSystemBlocks;
}

export async function runRiskAnalysis(input: RiskAnalysisInput): Promise<RiskAnalysisResponse> {
  if (isMockReviewEnabled() || input.forceMock) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return buildMockRiskAnalysisResponse();
  }

  const client = getAnthropicClient();
  // Mục 0 điểm 6 (v6.6): web_search chỉ cần cho Mục 9B, ngoài phạm vi chế độ này —
  // không bật tool này ở đây để giảm độ trễ/chi phí, dùng tool_choice ép buộc luôn.
  // 32000 (không phải 16000): Sonnet 5 mặc định bật adaptive thinking, tính chung vào
  // max_tokens — báo cáo phức tạp (nhiều risk_items/ratios/variances) có thể cần nhiều
  // token suy nghĩ hơn trước khi sinh JSON kết quả.
  const stream = client.messages.stream({
    model: CLAUDE_MODEL,
    max_tokens: 32000,
    system: getSystemBlocks(),
    tools: [
      {
        name: TOOL_NAME,
        description: "Nộp kết quả phân tích rủi ro báo cáo tài chính theo đúng schema JSON đã định nghĩa.",
        input_schema: riskAnalysisInputSchema as unknown as Anthropic.Tool.InputSchema,
      },
    ],
    tool_choice: { type: "tool", name: TOOL_NAME },
    messages: [{ role: "user", content: buildUserMessage(input) }],
  });
  const response = await stream.finalMessage();

  const toolUse = response.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === TOOL_NAME
  );
  if (!toolUse) {
    throw new Error("Claude không trả về tool_use block như yêu cầu cho phân tích rủi ro.");
  }

  // Xem review.ts: hết max_tokens giữa chừng (kể cả token "suy nghĩ" nội bộ) có thể để
  // lại tool_use.input hợp lệ cú pháp nhưng thiếu field bắt buộc cuối schema — báo lỗi
  // rõ ràng thay vì để Zod ném lỗi khó hiểu.
  if (response.stop_reason === "max_tokens") {
    throw new Error(
      "Claude bị cắt giữa chừng vì phân tích quá dài, chưa kịp hoàn thành kết quả (hết max_tokens). Vui lòng thử lại — nếu vẫn lặp lại, báo cho đội kỹ thuật để tăng giới hạn."
    );
  }

  return riskAnalysisResponseZod.parse(toolUse.input);
}
