import type { CategoriesChecked } from "./finding";

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
