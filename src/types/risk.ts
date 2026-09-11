// "Phân tích rủi ro báo cáo tài chính" — Master Prompt v6.6, Mục 11B (phân tích số
// liệu) + Mục 11C (đánh giá rủi ro), hiển thị theo Mục 14B (dashboard dạng thẻ, KHÔNG
// dùng bảng, KHÔNG tách cột VN/EN song song). Tính năng độc lập hoàn toàn với quy
// trình "Kiểm tra báo cáo kiểm toán" (Mục 14A) — chạy bằng 1 lệnh gọi Claude riêng,
// với <che_do_chay>phan_tich_rui_ro</che_do_chay>.

// Mục 7.6 rút gọn còn 4 mức cho chế độ này (Mục 14B điểm 4) — bỏ Missing in EN / Cần
// bổ sung vì không áp dụng cho phân tích rủi ro.
export type RiskCardLevel = "pass" | "warning" | "error" | "critical";

export const RISK_CARD_LEVEL_LABELS: Record<RiskCardLevel, string> = {
  pass: "Rủi ro thấp",
  warning: "Rủi ro trung bình",
  error: "Rủi ro cao",
  critical: "Rủi ro nghiêm trọng",
};

export type RiskRatioCategory = "thanh_khoan" | "don_bay" | "sinh_loi" | "hieu_qua_hoat_dong";

export const RISK_RATIO_CATEGORY_LABELS: Record<RiskRatioCategory, string> = {
  thanh_khoan: "Thanh khoản",
  don_bay: "Đòn bẩy tài chính",
  sinh_loi: "Khả năng sinh lời",
  hieu_qua_hoat_dong: "Hiệu quả hoạt động",
};

export interface RiskRatio {
  category: RiskRatioCategory;
  name: string;
  unit: string; // "%", "lần", "ngày"...
  currentYearValue: number | null;
  priorYearValue: number | null;
  note: string | null;
}

// Mục 11B.1 — phân tích biến động ngang. Chỉ các khoản mục có |% biến động| ≥ 20% hoặc
// phát sinh mới/mất hẳn mới cần ghi (biến động nhỏ, hợp lý thì không cần liệt kê).
export interface RiskVariance {
  label: string;
  currentYearValue: number | null;
  priorYearValue: number | null;
  percentChange: number | null; // null nếu phát sinh mới hoặc mất hẳn (không tính được %)
  level: "pass" | "warning" | "error";
  note: string;
}

// Mục 11C.1–11C.5 — 5 nhóm rủi ro theo thông lệ kiểm toán.
export type RiskGroup = "trong_yeu" | "gian_lan" | "hoat_dong_lien_tuc" | "ben_lien_quan" | "thue";

export const RISK_GROUP_LABELS: Record<RiskGroup, string> = {
  trong_yeu: "Rủi ro trọng yếu (11C.1)",
  gian_lan: "Rủi ro gian lận & sai sót trọng yếu (11C.2)",
  hoat_dong_lien_tuc: "Rủi ro hoạt động liên tục (11C.3)",
  ben_lien_quan: "Rủi ro giao dịch bên liên quan (11C.4)",
  thue: "Rủi ro thuế (11C.5)",
};

export const RISK_GROUP_ORDER: RiskGroup[] = [
  "trong_yeu",
  "gian_lan",
  "hoat_dong_lien_tuc",
  "ben_lien_quan",
  "thue",
];

export interface RiskItem {
  group: RiskGroup;
  title: string;
  level: RiskCardLevel;
  page: number | null;
  valueVn: string | null; // khối giá trị/số liệu chính (nội dung VN)
  summaryEn: string | null; // 1 dòng tóm tắt EN nhỏ, không phải cột song song
  assessment: string; // đánh giá & khuyến nghị
}

// Mục 11C.6 — bắt buộc có, hiển thị thành banner rủi ro tổng thể tách riêng.
export interface OverallRisk {
  level: "low" | "medium" | "high";
  summary: string;
}

export const OVERALL_RISK_LABELS: Record<OverallRisk["level"], string> = {
  low: "THẤP",
  medium: "TRUNG BÌNH",
  high: "CAO",
};

export interface RiskKpi {
  label: string;
  value: string;
  comparison: string | null;
  tone: "good" | "warn" | "bad";
}

export interface RiskAnalysis {
  kpis: RiskKpi[];
  overallRisk: OverallRisk;
  ratios: RiskRatio[];
  variances: RiskVariance[];
  riskItems: RiskItem[];
  summary: string;
}
