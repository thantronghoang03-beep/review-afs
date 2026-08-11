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
