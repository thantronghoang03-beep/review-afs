import type Anthropic from "@anthropic-ai/sdk";
import { getAnthropicClient, CLAUDE_MODEL } from "./client";
import { riskAnalysisInputSchema, riskAnalysisResponseZod, type RiskAnalysisResponse } from "./risk-analysis-schema";
import { isMockReviewEnabled, buildMockRiskAnalysisResponse } from "./mock-review";

const TOOL_NAME = "submit_risk_analysis";

const SYSTEM_PROMPT = `Bạn là chuyên viên phân tích tài chính của JPA Vietvalues. Nhiệm vụ: đọc Bảng cân đối kế toán, Báo cáo kết quả hoạt động kinh doanh và Báo cáo lưu chuyển tiền tệ (năm nay, và năm trước nếu có) trong nội dung được cung cấp, sau đó:

1. Tính các tỷ số tài chính chuẩn — thanh khoản (Current ratio, Quick ratio), đòn bẩy (Debt/Equity, Debt/Assets), khả năng sinh lời (Gross margin, Net margin, ROA, ROE), hiệu quả hoạt động (Asset turnover, Inventory days, Receivable days) — cho năm nay và, nếu có đủ số liệu so sánh, năm trước. Chỉ tính khi có đủ dữ liệu; nếu thiếu, bỏ qua tỷ số đó thay vì suy đoán hoặc bịa số.
2. Từ các tỷ số và nội dung báo cáo, nêu các cảnh báo rủi ro cụ thể có căn cứ số liệu rõ ràng (rủi ro hoạt động liên tục, rủi ro thanh khoản, đòn bẩy tăng bất thường, biên lợi nhuận giảm mạnh, dòng tiền kinh doanh âm kéo dài...). Không suy đoán mơ hồ — mỗi cảnh báo phải trích dẫn số liệu cụ thể làm bằng chứng. "high" chỉ dùng khi có bằng chứng số liệu rõ ràng và nghiêm trọng.
3. Viết tóm tắt ngắn gọn (3-5 câu) đánh giá tổng quan.

Đây là phân tích ĐỘC LẬP với quy trình review đối chiếu VN/EN — không cần kiểm tra chính tả, format, hay đối chiếu ERC/IRC. Chỉ tập trung vào số liệu và rủi ro tài chính.

Trả kết quả bằng cách gọi tool "${TOOL_NAME}" với dữ liệu JSON đúng schema đã cung cấp. Không sinh HTML, không sinh markdown, không viết prose bên ngoài lời gọi tool.`;

interface RiskAnalysisInput {
  clientName: string;
  fiscalYear: string;
  vnDocument: string;
  enDocument: string;
}

function buildUserMessage(input: RiskAnalysisInput): string {
  return [
    `Khách hàng: ${input.clientName}`,
    `Năm tài chính: ${input.fiscalYear}`,
    ``,
    `=== BÁO CÁO TIẾNG VIỆT (VN) ===`,
    input.vnDocument,
    ``,
    `=== BÁO CÁO TIẾNG ANH (EN) ===`,
    input.enDocument,
  ].join("\n");
}

export async function runRiskAnalysis(input: RiskAnalysisInput): Promise<RiskAnalysisResponse> {
  if (isMockReviewEnabled()) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return buildMockRiskAnalysisResponse();
  }

  const client = getAnthropicClient();
  const stream = client.messages.stream({
    model: CLAUDE_MODEL,
    max_tokens: 8000,
    system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
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

  return riskAnalysisResponseZod.parse(toolUse.input);
}
