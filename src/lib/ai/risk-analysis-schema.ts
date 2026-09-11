import { z } from "zod";

const RATIO_CATEGORY_ENUM = ["thanh_khoan", "don_bay", "sinh_loi", "hieu_qua_hoat_dong"] as const;
const VARIANCE_LEVEL_ENUM = ["pass", "warning", "error"] as const;
const RISK_GROUP_ENUM = ["trong_yeu", "gian_lan", "hoat_dong_lien_tuc", "ben_lien_quan", "thue"] as const;
const RISK_CARD_LEVEL_ENUM = ["pass", "warning", "error", "critical"] as const;
const OVERALL_RISK_LEVEL_ENUM = ["low", "medium", "high"] as const;
const KPI_TONE_ENUM = ["good", "warn", "bad"] as const;

export const riskAnalysisInputSchema = {
  type: "object",
  additionalProperties: false,
  required: ["kpis", "overall_risk", "ratios", "variances", "risk_items", "summary"],
  properties: {
    kpis: {
      type: "array",
      description: "Mục 14B điểm 2 — 4-6 thẻ KPI nổi bật nhất (Doanh thu YoY, LNST YoY, dòng tiền HĐKD...).",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["label", "value", "comparison", "tone"],
        properties: {
          label: { type: "string" },
          value: { type: "string", description: "Giá trị năm nay, đã format (VD: '27,67 tỷ VND')." },
          comparison: { type: ["string", "null"], description: "So sánh năm trước, VD '+12% so với năm trước'." },
          tone: { type: "string", enum: KPI_TONE_ENUM },
        },
      },
    },
    overall_risk: {
      type: "object",
      additionalProperties: false,
      required: ["level", "summary"],
      description: "Mục 11C.6 — BẮT BUỘC. level là mức nặng nhất trong toàn bộ risk_items.",
      properties: {
        level: { type: "string", enum: OVERALL_RISK_LEVEL_ENUM },
        summary: { type: "string", description: "Liệt kê ngắn gọn các nhóm rủi ro chính đã phát hiện." },
      },
    },
    ratios: {
      type: "array",
      description:
        "Mục 11B.3 — tỷ số tài chính chuẩn cho năm nay/năm trước. Chỉ tính khi đủ dữ liệu, bỏ qua nếu thiếu — không bịa số.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["category", "name", "unit", "current_year_value", "prior_year_value", "note"],
        properties: {
          category: { type: "string", enum: RATIO_CATEGORY_ENUM },
          name: { type: "string" },
          unit: { type: "string" },
          current_year_value: { type: ["number", "null"] },
          prior_year_value: { type: ["number", "null"] },
          note: { type: ["string", "null"] },
        },
      },
    },
    variances: {
      type: "array",
      description:
        "Mục 11B.1 — biến động ngang. Chỉ liệt kê khoản mục có |% biến động| ≥ 20% hoặc phát sinh mới/mất hẳn.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["label", "current_year_value", "prior_year_value", "percent_change", "level", "note"],
        properties: {
          label: { type: "string" },
          current_year_value: { type: ["number", "null"] },
          prior_year_value: { type: ["number", "null"] },
          percent_change: { type: ["number", "null"], description: "Null nếu phát sinh mới hoặc mất hẳn." },
          level: { type: "string", enum: VARIANCE_LEVEL_ENUM },
          note: { type: "string" },
        },
      },
    },
    risk_items: {
      type: "array",
      description: "Mục 11C.1–11C.5 — mỗi phát hiện rủi ro thuộc đúng 1 risk_group.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["group", "title", "level", "page", "value_vn", "summary_en", "assessment"],
        properties: {
          group: { type: "string", enum: RISK_GROUP_ENUM },
          title: { type: "string" },
          level: { type: "string", enum: RISK_CARD_LEVEL_ENUM },
          page: { type: ["integer", "null"] },
          value_vn: { type: ["string", "null"], description: "Khối giá trị/số liệu chính (nội dung tiếng Việt)." },
          summary_en: { type: ["string", "null"], description: "1 dòng tóm tắt tiếng Anh, không phải cột song song." },
          assessment: { type: "string", description: "Đánh giá & khuyến nghị." },
        },
      },
    },
    summary: {
      type: "string",
      description: "Tóm tắt tổng quan 3-5 câu về sức khỏe tài chính (khác overall_risk.summary).",
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
  kpis: z.array(
    z.object({
      label: lenientString,
      value: lenientString,
      comparison: lenientNullableString,
      tone: lenientEnum(KPI_TONE_ENUM),
    })
  ),
  overall_risk: z.object({
    level: lenientEnum(OVERALL_RISK_LEVEL_ENUM),
    summary: lenientString,
  }),
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
  variances: z.array(
    z.object({
      label: lenientString,
      current_year_value: lenientNullableNumber,
      prior_year_value: lenientNullableNumber,
      percent_change: lenientNullableNumber,
      level: lenientEnum(VARIANCE_LEVEL_ENUM),
      note: lenientString,
    })
  ),
  risk_items: z.array(
    z.object({
      group: lenientEnum(RISK_GROUP_ENUM),
      title: lenientString,
      level: lenientEnum(RISK_CARD_LEVEL_ENUM),
      page: lenientNullableNumber,
      value_vn: lenientNullableString,
      summary_en: lenientNullableString,
      assessment: lenientString,
    })
  ),
  summary: lenientString,
});

export type RiskAnalysisResponse = z.infer<typeof riskAnalysisResponseZod>;
