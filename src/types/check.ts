import type { CategoriesChecked } from "./finding";
import type { RiskAnalysis } from "./risk";

export type CheckStatus = "processing" | "done" | "error";

export type PeriodType = "first" | "short_prior" | "normal" | "dissolution";

export const PERIOD_TYPE_LABELS: Record<PeriodType, string> = {
  first: "Kỳ kiểm toán đầu tiên",
  short_prior: "Kỳ tiếp theo — Năm trước là giai đoạn",
  normal: "Kỳ tiếp theo bình thường",
  dissolution: "Kỳ giải thể",
};

export interface CheckFilePaths {
  fileVnPath: string;
  fileEnPath: string;
  fileErcLatestPath: string | null;
  fileErcOriginalPath: string | null;
  fileIrcLatestPath: string | null;
  fileIrcOriginalPath: string | null;
  // Master Prompt v6.1 — Mục 9A (hồ sơ pháp lý mở rộng: giấy phép con, ưu đãi thuế,
  // hợp đồng thuê đất...), tùy chọn. Mục 15 (đối chiếu phiên bản liền kề) không cần
  // file riêng — server tự lấy báo cáo gần nhất trước đó của cùng công ty, xem
  // getPreviousCheckForCompany() trong checks-repository.ts.
  fileLegalDossierPaths: string[];
}

export interface Check extends CheckFilePaths {
  id: string;
  companyId: string | null;
  clientName: string;
  createdBy: string | null;
  fiscalYear: string;
  periodCurrentStart: string;
  periodCurrentEnd: string;
  periodPriorStart: string | null;
  periodPriorEnd: string | null;
  periodType: PeriodType;

  status: CheckStatus;
  errorMessage: string | null;

  categoriesChecked: CategoriesChecked | null;

  claudeModel: string | null;
  claudeInputTokens: number | null;
  claudeOutputTokens: number | null;
  claudeCacheReadTokens: number | null;

  // Mục 14 điểm 5 (v6.1) — tóm tắt ngắn gọn cuối cùng của AI về lượt review, hiển thị
  // trong note-box trên trang kết quả. Null khi check chưa done.
  overallNotes: string | null;

  // Người dùng chọn chạy tác vụ nào khi tạo kiểm tra mới — ít nhất 1 trong 2 phải bật.
  runAuditReview: boolean;
  runRiskAnalysis: boolean;
  riskAnalysis: RiskAnalysis | null;
  // Mô tả tự do về hoạt động công ty (nguyên tắc doanh thu, giá vốn, chi phí...), người
  // dùng nhập khi tick "Phân tích rủi ro báo cáo tài chính" — tùy chọn, dùng làm bối
  // cảnh cho AI khi đánh giá rủi ro. Null nếu không chọn phân tích rủi ro hoặc để trống.
  businessDescription: string | null;

  // v6.6 — mỗi chế độ chạy độc lập (2 lệnh gọi API riêng); nếu chọn cả 2 và chỉ 1 cái
  // lỗi, status vẫn "done" với kết quả của cái thành công, và lỗi của cái thất bại được
  // ghi ở đây để hiển thị banner riêng — không làm mất kết quả đã chạy thành công.
  auditReviewError: string | null;
  riskAnalysisError: string | null;

  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

export interface CheckListItem {
  id: string;
  companyId: string | null;
  clientName: string;
  createdBy: string | null;
  fiscalYear: string;
  periodType: PeriodType;
  status: CheckStatus;
  createdAt: string;
  completedAt: string | null;
  totalFindings: number;
  criticalCount: number;
  mediumCount: number;
  minorCount: number;
}

export interface CheckListFilters {
  companyId?: string;
  status?: CheckStatus;
  periodType?: PeriodType;
  createdBy?: string;
  dateFrom?: string;
  dateTo?: string;
}
