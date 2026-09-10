export type FindingStatus =
  | "pass"
  | "error"
  | "warning"
  | "missing_in_en"
  | "needs_supplementing"
  | "critical";

export type FindingCategory =
  | "so_lieu"
  | "chinh_ta"
  | "format"
  | "erc_irc"
  | "phap_ly"
  | "doi_chieu"
  | "khac";

export type FindingSeverity = "critical" | "medium" | "minor";

// Master Prompt v6.1 — Mục 14, thành phần #6: bảng chi tiết PHẢI nhóm theo đúng 17 mục
// này, theo đúng thứ tự này. Mỗi finding thuộc đúng 1 group.
export type FindingGroup =
  | "trang_bia_muc_luc"
  | "bao_cao_bgd"
  | "bao_cao_kiem_toan"
  | "bcdkt"
  | "bckqkd"
  | "bclctt"
  | "thuyet_minh"
  | "tinh_toan_lai_bcdkt"
  | "tinh_toan_lai_bckqkd"
  | "tinh_toan_lai_bclctt"
  | "cross_check_ngang"
  | "erc_irc"
  | "ho_so_phap_ly"
  | "hieu_luc_phap_ly"
  | "thuat_ngu"
  | "doi_chieu_phien_ban"
  | "khac";

export interface Finding {
  id: string;
  checkId: string;
  section: string;
  group: FindingGroup;
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

// Labels và ý nghĩa lấy nguyên văn theo Master Prompt v6.1 — Mục 7.6 (Legend bắt buộc).
export const STATUS_LABELS: Record<FindingStatus, string> = {
  pass: "Pass",
  error: "Error",
  warning: "Warning",
  missing_in_en: "Missing in EN",
  needs_supplementing: "Cần bổ sung",
  critical: "Critical",
};

export const STATUS_LEGEND: Record<FindingStatus, string> = {
  pass: "Đúng, nhất quán. Đã đối chiếu và không phát hiện sai lệch — không cần xử lý thêm.",
  error: "Sai hoặc số liệu/nội dung không khớp. Cần sửa trước khi phát hành báo cáo.",
  warning:
    "Lỗi nhỏ, chưa chuẩn, hoặc thiếu tài liệu để xác minh (ngữ pháp, phong cách, wording, chưa có bản gốc đối chiếu...). Nên xử lý nhưng không bắt buộc phải sửa ngay.",
  missing_in_en: "Thiếu bản dịch một bên. Có ở VN nhưng thiếu ở EN, hoặc ngược lại.",
  needs_supplementing:
    "Thiếu mã TM/Notes hoặc thiếu thuyết minh tương ứng. Riêng cho gap đối chiếu giữa mặt báo cáo và Thuyết minh.",
  critical:
    "Sai phạm nghiêm trọng — rủi ro pháp lý/kiểm toán cao (căn cứ pháp lý hết hiệu lực, hoạt động chưa có giấy phép con, vi phạm điều kiện ưu đãi thuế...). PHẢI xử lý trước khi phát hành.",
};

export const SEVERITY_LABELS: Record<FindingSeverity, string> = {
  critical: "Nghiêm trọng",
  medium: "Trung bình",
  minor: "Nhẹ",
};

// Thứ tự nhóm hiển thị bảng chi tiết, đúng nguyên văn thứ tự Mục 14 điểm 6.
export const GROUP_ORDER: FindingGroup[] = [
  "trang_bia_muc_luc",
  "bao_cao_bgd",
  "bao_cao_kiem_toan",
  "bcdkt",
  "bckqkd",
  "bclctt",
  "thuyet_minh",
  "tinh_toan_lai_bcdkt",
  "tinh_toan_lai_bckqkd",
  "tinh_toan_lai_bclctt",
  "cross_check_ngang",
  "erc_irc",
  "ho_so_phap_ly",
  "hieu_luc_phap_ly",
  "thuat_ngu",
  "doi_chieu_phien_ban",
  "khac",
];

export const GROUP_LABELS: Record<FindingGroup, string> = {
  trang_bia_muc_luc: "1. Trang bìa & Mục lục",
  bao_cao_bgd: "2. Báo cáo BGĐ / HĐTV / TGĐ",
  bao_cao_kiem_toan: "3. Báo cáo kiểm toán độc lập",
  bcdkt: "4. Bảng cân đối kế toán (BCĐKT)",
  bckqkd: "5. Báo cáo kết quả hoạt động kinh doanh (BCKQKD)",
  bclctt: "6. Báo cáo lưu chuyển tiền tệ (BCLCTT)",
  thuyet_minh: "7. Thuyết minh báo cáo tài chính",
  tinh_toan_lai_bcdkt: "8. Tính toán lại — BCĐKT",
  tinh_toan_lai_bckqkd: "9. Tính toán lại — BCKQKD",
  tinh_toan_lai_bclctt: "10. Tính toán lại — BCLCTT",
  cross_check_ngang: "11. Cross-check ngang (3 mặt báo cáo)",
  erc_irc: "12. ERC / IRC đối chiếu",
  ho_so_phap_ly: "13. Hồ sơ pháp lý mở rộng",
  hieu_luc_phap_ly: "14. Hiệu lực căn cứ pháp lý",
  thuat_ngu: "15. Thuật ngữ & wording",
  doi_chieu_phien_ban: "16. Đối chiếu với phiên bản liền kề",
  khac: "17. Khác",
};

// Findings created before this grouping existed (v6.1 rollout, pre-grouping) have no
// `group` in the DB — fall back to "khac" so old check history still renders instead
// of crashing on an undefined lookup.
export function normalizeFindingGroup(group: FindingGroup | string | null | undefined): FindingGroup {
  return group && group in GROUP_LABELS ? (group as FindingGroup) : "khac";
}

export const CATEGORY_LABELS: Record<FindingCategory, string> = {
  so_lieu: "Số liệu",
  chinh_ta: "Chính tả",
  format: "Format",
  erc_irc: "ERC/IRC",
  phap_ly: "Hồ sơ pháp lý & hiệu lực văn bản",
  doi_chieu: "Đối chiếu phiên bản liền kề",
  khac: "Khác",
};

// Findings created before the v6.1 rollout still carry the old v5.0 status strings
// ("match"/"difference") in the database. Every place that keys off status (badges,
// filters, exports, stats) should normalize through this first so old check history
// keeps rendering correctly instead of hitting an undefined lookup.
const LEGACY_STATUS_ALIASES: Record<string, FindingStatus> = {
  match: "pass",
  difference: "error",
};

export function normalizeFindingStatus(status: FindingStatus | string): FindingStatus {
  return (LEGACY_STATUS_ALIASES[status] ?? status) as FindingStatus;
}

// Fixed server-side policy — severity is derived from status, never decided by the AI.
// "critical" (legal/compliance) and "error" (số liệu/nội dung sai) both land in the
// "critical" severity bucket used for stats — both must be fixed before publishing.
export const SEVERITY_BY_STATUS: Record<FindingStatus, FindingSeverity | null> = {
  pass: null,
  error: "critical",
  critical: "critical",
  needs_supplementing: "medium",
  missing_in_en: "medium",
  warning: "minor",
};
