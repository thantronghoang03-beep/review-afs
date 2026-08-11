import { z } from "zod";

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
      required: ["so_lieu", "chinh_ta", "format", "erc_irc", "khac"],
      properties: {
        so_lieu: categoryStatusSchema,
        chinh_ta: categoryStatusSchema,
        format: categoryStatusSchema,
        erc_irc: categoryStatusSchema,
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
            description: "Master-prompt section reference, e.g. '11.2' or '8.7'.",
          },
          field_label: { type: "string", description: "Mục kiểm tra — short label for this checked item." },
          page_vn: { type: ["integer", "null"] },
          page_en: { type: ["integer", "null"] },
          content_vn: { type: ["string", "null"] },
          content_en: { type: ["string", "null"] },
          status: {
            type: "string",
            enum: ["match", "difference", "warning", "missing_in_en", "needs_supplementing"],
          },
          category: {
            type: "string",
            enum: ["so_lieu", "chinh_ta", "format", "erc_irc", "khac"],
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

export const findingsResponseZod = z.object({
  period_type_detected: z.enum(["first", "short_prior", "normal", "dissolution"]),
  categories: z.object({
    so_lieu: categoryStatusZod,
    chinh_ta: categoryStatusZod,
    format: categoryStatusZod,
    erc_irc: categoryStatusZod,
    khac: categoryStatusZod,
  }),
  findings: z.array(
    z.object({
      section: z.string(),
      field_label: z.string(),
      page_vn: z.number().int().nullable(),
      page_en: z.number().int().nullable(),
      content_vn: z.string().nullable(),
      content_en: z.string().nullable(),
      status: z.enum(["match", "difference", "warning", "missing_in_en", "needs_supplementing"]),
      category: z.enum(["so_lieu", "chinh_ta", "format", "erc_irc", "khac"]),
      note: z.string(),
    })
  ),
  summary: z.object({
    overall_notes: z.string(),
  }),
});

export type FindingsResponse = z.infer<typeof findingsResponseZod>;
