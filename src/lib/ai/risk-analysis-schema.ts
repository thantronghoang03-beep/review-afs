import { z } from "zod";

const RATIO_CATEGORY_ENUM = ["thanh_khoan", "don_bay", "sinh_loi", "hieu_qua_hoat_dong"] as const;
const RISK_LEVEL_ENUM = ["low", "medium", "high"] as const;

export const riskAnalysisInputSchema = {
  type: "object",
  additionalProperties: false,
  required: ["ratios", "warnings", "summary"],
  properties: {
    ratios: {
      type: "array",
      description:
        "Các tỷ số tài chính chuẩn, tính từ BCĐKT/BCKQKD/BCLCTT năm nay và năm trước (nếu có). Tối thiểu: Current ratio, Quick ratio, Debt/Equity, Debt/Assets, Gross margin, Net margin, ROA, ROE, Asset turnover, Inventory days, Receivable days — bỏ qua tỷ số nào không đủ dữ liệu để tính (đừng bịa số).",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["category", "name", "unit", "current_year_value", "prior_year_value", "note"],
        properties: {
          category: { type: "string", enum: RATIO_CATEGORY_ENUM },
          name: { type: "string", description: "Tên tỷ số, ví dụ 'Current ratio (Khả năng thanh toán hiện hành)'." },
          unit: { type: "string", description: "Đơn vị: '%', 'lần', 'ngày'..." },
          current_year_value: { type: ["number", "null"] },
          prior_year_value: { type: ["number", "null"], description: "Null nếu là kỳ đầu tiên hoặc thiếu dữ liệu năm trước." },
          note: { type: ["string", "null"], description: "Diễn giải ngắn nếu cần, hoặc lý do không tính được (null nếu không cần)." },
        },
      },
    },
    warnings: {
      type: "array",
      description:
        "Cảnh báo rủi ro rút ra từ các tỷ số và nội dung báo cáo — ví dụ rủi ro hoạt động liên tục, rủi ro thanh khoản, đòn bẩy tăng bất thường, biên lợi nhuận giảm mạnh, dòng tiền kinh doanh âm kéo dài. Mảng rỗng nếu không phát hiện rủi ro đáng chú ý nào.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "level", "description"],
        properties: {
          title: { type: "string" },
          level: {
            type: "string",
            enum: RISK_LEVEL_ENUM,
            description: "'high' chỉ dùng cho rủi ro nghiêm trọng có bằng chứng số liệu rõ ràng, không suy đoán.",
          },
          description: { type: "string", description: "Giải thích rủi ro dựa trên số liệu cụ thể, không chung chung." },
        },
      },
    },
    summary: {
      type: "string",
      description: "Tóm tắt ngắn gọn (3-5 câu) đánh giá tổng quan sức khỏe tài chính và rủi ro chính của công ty.",
    },
  },
} as const;

const lenientNullableNumber = z.preprocess((val) => {
  if (val === null || val === undefined || val === "") return null;
  if (typeof val === "number") return Number.isFinite(val) ? val : null;
  if (typeof val === "string") {
    const n = Number(val.replace(/,/g, ""));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}, z.number().nullable());

const lenientNullableString = z.preprocess((val) => {
  if (val === null || val === undefined) return null;
  return typeof val === "string" ? val : String(val);
}, z.string().nullable());

const lenientString = z.preprocess((val) => {
  if (val === null || val === undefined) return "";
  return typeof val === "string" ? val : String(val);
}, z.string());

function lenientEnum<T extends readonly [string, ...string[]]>(values: T) {
  return z.preprocess((val) => (typeof val === "string" ? val.trim().toLowerCase() : val), z.enum(values));
}

export const riskAnalysisResponseZod = z.object({
  ratios: z.array(
    z.object({
      category: lenientEnum(RATIO_CATEGORY_ENUM),
      name: lenientString,
      unit: lenientString,
      current_year_value: lenientNullableNumber,
      prior_year_value: lenientNullableNumber,
      note: lenientNullableString,
    })
  ),
  warnings: z.array(
    z.object({
      title: lenientString,
      level: lenientEnum(RISK_LEVEL_ENUM),
      description: lenientString,
    })
  ),
  summary: lenientString,
});

export type RiskAnalysisResponse = z.infer<typeof riskAnalysisResponseZod>;
