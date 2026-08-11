export type FindingStatus =
  | "match"
  | "difference"
  | "warning"
  | "missing_in_en"
  | "needs_supplementing";

export type FindingCategory = "so_lieu" | "chinh_ta" | "format" | "erc_irc" | "khac";

export type FindingSeverity = "critical" | "medium" | "minor";

export interface Finding {
  id: string;
  checkId: string;
  section: string;
  fieldLabel: string;
  pageVn: number | null;
  pageEn: number | null;
  contentVn: string | null;
  contentEn: string | null;
  status: FindingStatus;
  category: FindingCategory;
  severity: FindingSeverity | null;
  note: string | null;
  displayOrder: number;
}

export interface CategoryStatus {
  checked: boolean;
  skippedReason: string | null;
}

export type CategoriesChecked = Record<FindingCategory, CategoryStatus>;

export const STATUS_LABELS: Record<FindingStatus, string> = {
  match: "Match",
  difference: "Difference",
  warning: "Warning",
  missing_in_en: "Missing in EN",
  needs_supplementing: "Cần bổ sung",
};

export const SEVERITY_LABELS: Record<FindingSeverity, string> = {
  critical: "Nghiêm trọng",
  medium: "Trung bình",
  minor: "Nhẹ",
};

export const CATEGORY_LABELS: Record<FindingCategory, string> = {
  so_lieu: "Số liệu",
  chinh_ta: "Chính tả",
  format: "Format",
  erc_irc: "ERC/IRC",
  khac: "Khác",
};

// Fixed server-side policy — severity is derived from status, never decided by the AI.
export const SEVERITY_BY_STATUS: Record<FindingStatus, FindingSeverity | null> = {
  match: null,
  difference: "critical",
  needs_supplementing: "medium",
  missing_in_en: "medium",
  warning: "minor",
};
