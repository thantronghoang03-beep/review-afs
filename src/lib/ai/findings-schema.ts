import { z } from "zod";

// Nhóm hiển thị bảng chi tiết (9 nhóm theo format mẫu + 1 "khac" dự phòng). Giữ enum
// này khớp với FindingGroup / GROUP_ORDER trong src/types/finding.ts.
const GROUP_ENUM = [
  "trang_bia_muc_luc",
  "bao_cao_kiem_toan",
  "doi_chieu_tm_so_lieu",
  "erc_irc",
  "kiem_tra_logic",
  "ho_so_phap_ly",
  "hieu_luc_phap_ly",
  "thuat_ngu",
  "doi_chieu_phien_ban",
  "khac",
] as const;

const categoryStatusSchema = {
  type: "object",
  additionalProperties: false,
  required: ["checked", "skipped_reason"],
  properties: {
    checked: { type: "boolean" },
    skipped_reason: {
      type: ["string", "null"],
      description: "Null if checked=true. If checked=false, a short reason, e.g. 'ERC/IRC not provided'.",
    },
  },
};

export const findingsInputSchema = {
  type: "object",
  additionalProperties: false,
  required: ["period_type_detected", "categories", "findings", "summary"],
  properties: {
    period_type_detected: {
      type: "string",
      enum: ["first", "short_prior", "normal", "dissolution"],
      description:
        "Confirms which period-type branch of the checklist was applied — should match the PERIOD_TYPE value given in the user message; used as a sanity check.",
    },
    categories: {
      type: "object",
      additionalProperties: false,
      required: ["so_lieu", "chinh_ta", "format", "erc_irc", "phap_ly", "doi_chieu", "khac"],
      properties: {
        so_lieu: categoryStatusSchema,
        chinh_ta: categoryStatusSchema,
        format: categoryStatusSchema,
        erc_irc: categoryStatusSchema,
        phap_ly: categoryStatusSchema,
        doi_chieu: categoryStatusSchema,
        khac: categoryStatusSchema,
      },
    },
    findings: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "section",
          "group",
          "field_label",
          "page_vn",
          "page_en",
          "content_vn",
          "content_en",
          "status",
          "category",
          "note",
        ],
        properties: {
          section: {
            type: "string",
            description: "Master-prompt section reference, e.g. '11.2', '8.7', '9B', '15'.",
          },
          group: {
            type: "string",
            enum: GROUP_ENUM,
            description:
              "Which of the 10 display groups this finding belongs to (exactly one, MUST be one of the enum values above, no other string) — used to render the detail table grouped and ordered per spec, e.g. a Mục 9B legal-validity finding is 'hieu_luc_phap_ly', a Mục 11A logic-check finding is 'kiem_tra_logic'.",
          },
          field_label: { type: "string", description: "Mục kiểm tra — short label for this checked item." },
          page_vn: { type: ["integer", "null"] },
          page_en: { type: ["integer", "null"] },
          content_vn: { type: ["string", "null"] },
          content_en: { type: ["string", "null"] },
          status: {
            type: "string",
            enum: ["pass", "error", "warning", "missing_in_en", "needs_supplementing", "critical"],
          },
          category: {
            type: "string",
            enum: ["so_lieu", "chinh_ta", "format", "erc_irc", "phap_ly", "doi_chieu", "khac"],
          },
          note: { type: "string", description: "Ghi chú — explanation, matches master prompt's note format." },
        },
      },
    },
    summary: {
      type: "object",
      additionalProperties: false,
      required: ["overall_notes"],
      properties: {
        overall_notes: {
          type: "string",
          description: "Short free-text overall closing note about the review (not per-finding).",
        },
      },
    },
  },
} as const;

const categoryStatusZod = z.object({
  checked: z.boolean(),
  skipped_reason: z.string().nullable(),
});

// Anthropic's tool-use JSON schema is a strong hint to the model, not a hard grammar
// constraint the API enforces server-side — a model can (rarely) emit e.g. "12" instead
// of 12 for a page number. Previously any single such slip made zod reject the ENTIRE
// response, discarding every correctly-formed finding and wasting the whole AI call.
// These preprocessors normalize the common slips instead of failing the whole batch.
const lenientNullableInt = z.preprocess((val) => {
  if (val === null || val === undefined || val === "") return null;
  if (typeof val === "number") return Number.isFinite(val) ? Math.trunc(val) : null;
  if (typeof val === "string") {
    const match = val.match(/\d+/);
    return match ? parseInt(match[0], 10) : null;
  }
  return null;
}, z.number().int().nullable());

const lenientNullableString = z.preprocess((val) => {
  if (val === null || val === undefined) return null;
  if (typeof val === "string") return val;
  return String(val);
}, z.string().nullable());

const lenientString = z.preprocess((val) => {
  if (val === null || val === undefined) return "";
  if (typeof val === "string") return val;
  return String(val);
}, z.string());

// Một finding sai lệch 1 enum field (group/status/category) không nên làm mất toàn bộ
// response — trước đây "group" là strict enum (lenientEnum) và 1 giá trị lạ (ví dụ do
// model lặp lại nhầm 1 ví dụ cũ trong description) khiến Zod reject CẢ mảng "findings",
// mất luôn kết quả kiểm tra báo cáo kiểm toán dù chế độ phân tích rủi ro chạy song song
// vẫn thành công — đúng triệu chứng "tick cả 2 nhưng chỉ thấy kết quả phân tích rủi ro".
// Áp dụng rộng lượng cho cả 3 field enum cấp finding, rơi về 1 giá trị an toàn thay vì
// throw, để 1 lỗi nhỏ không đánh đổi toàn bộ lượt gọi API (đã tốn phí) đã chạy đúng.
function lenientEnumWithFallback<T extends readonly [string, ...string[]]>(values: T, fallback: T[number]) {
  return z.preprocess((val) => {
    const normalized = typeof val === "string" ? val.trim().toLowerCase() : val;
    return typeof normalized === "string" && (values as readonly string[]).includes(normalized)
      ? normalized
      : fallback;
  }, z.enum(values));
}

export const findingsResponseZod = z.object({
  // Chỉ là 1 field sanity-check hiển thị, không có logic nghiệp vụ nào đọc lại giá trị
  // này (xem run-check.ts) — rơi về "normal" nếu model trả giá trị lạ, không cần strict.
  period_type_detected: lenientEnumWithFallback(["first", "short_prior", "normal", "dissolution"] as const, "normal"),
  categories: z.object({
    so_lieu: categoryStatusZod,
    chinh_ta: categoryStatusZod,
    format: categoryStatusZod,
    erc_irc: categoryStatusZod,
    phap_ly: categoryStatusZod,
    doi_chieu: categoryStatusZod,
    khac: categoryStatusZod,
  }),
  findings: z.array(
    z.object({
      section: lenientString,
      group: lenientEnumWithFallback(GROUP_ENUM, "khac"),
      field_label: lenientString,
      page_vn: lenientNullableInt,
      page_en: lenientNullableInt,
      content_vn: lenientNullableString,
      content_en: lenientNullableString,
      // Fallback "warning" (chứ không phải "pass") khi status lạ — an toàn hơn: buộc
      // người dùng để ý dòng đó thay vì âm thầm coi như đã pass.
      status: lenientEnumWithFallback(
        ["pass", "error", "warning", "missing_in_en", "needs_supplementing", "critical"] as const,
        "warning"
      ),
      category: lenientEnumWithFallback(
        ["so_lieu", "chinh_ta", "format", "erc_irc", "phap_ly", "doi_chieu", "khac"] as const,
        "khac"
      ),
      note: lenientString,
    })
  ),
  summary: z.object({
    overall_notes: lenientString,
  }),
});

export type FindingsResponse = z.infer<typeof findingsResponseZod>;
