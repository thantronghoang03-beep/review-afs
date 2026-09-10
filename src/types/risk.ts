// "Phân tích rủi ro báo cáo tài chính" — tính năng độc lập với quy trình review
// Master Prompt v6.1. Người dùng tick chọn chạy riêng, chạy cùng, hoặc không chạy khi
// tạo kiểm tra mới. Tính các tỷ số tài chính chuẩn (thanh khoản, đòn bẩy, khả năng
// sinh lời, hiệu quả hoạt động) so sánh năm nay/năm trước, và AI nêu cảnh báo rủi ro
// dựa trên các tỷ số đó.

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

export type RiskLevel = "low" | "medium" | "high";

export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  low: "Thấp",
  medium: "Trung bình",
  high: "Cao",
};

export interface RiskWarning {
  title: string;
  level: RiskLevel;
  description: string;
}

export interface RiskAnalysis {
  ratios: RiskRatio[];
  warnings: RiskWarning[];
  summary: string;
}
