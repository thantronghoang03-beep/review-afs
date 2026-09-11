import { z } from "zod";

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

export const createCheckFieldsSchema = z.object({
  companyId: z.string().trim().nullable(),
  clientName: z.string().trim().min(1, "Tên khách hàng là bắt buộc"),
  createdBy: z.string().trim().nullable(),
  fiscalYear: z.string().trim().min(1, "Năm tài chính là bắt buộc"),
  periodCurrentStart: z.string().trim().min(1, "Kỳ kế toán năm nay (ngày bắt đầu) là bắt buộc"),
  periodCurrentEnd: z.string().trim().min(1, "Kỳ kế toán năm nay (ngày kết thúc) là bắt buộc"),
  periodPriorStart: z.string().trim().nullable(),
  periodPriorEnd: z.string().trim().nullable(),
  isDissolution: z.boolean(),
  ercChanged: z.enum(["na", "yes"]),
  ircChanged: z.enum(["na", "yes"]),
  runAuditReview: z.boolean(),
  runRiskAnalysis: z.boolean(),
  businessDescription: z.string().trim().nullable(),
  isSample: z.boolean(),
}).refine((v) => v.runAuditReview || v.runRiskAnalysis, {
  message: "Chọn ít nhất 1 loại kiểm tra: Kiểm tra báo cáo kiểm toán hoặc Phân tích rủi ro báo cáo tài chính.",
  path: ["runAuditReview"],
});

export type CreateCheckFields = z.infer<typeof createCheckFieldsSchema>;

export function validateUploadedFiles(
  files: File[],
  fieldLabel: string,
  required: boolean
): string | null {
  const real = files.filter((f) => f.size > 0);
  if (real.length === 0) {
    return required ? `${fieldLabel} là bắt buộc.` : null;
  }
  for (const file of real) {
    const err = validateUploadedFile(file, fieldLabel, false);
    if (err) return err;
  }
  return null;
}

export function validateUploadedFile(
  file: File | null,
  fieldLabel: string,
  required: boolean
): string | null {
  if (!file || file.size === 0) {
    return required ? `${fieldLabel} là bắt buộc.` : null;
  }
  if (file.type && file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return `${fieldLabel} phải là file PDF.`;
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `${fieldLabel} vượt quá 50MB.`;
  }
  return null;
}
