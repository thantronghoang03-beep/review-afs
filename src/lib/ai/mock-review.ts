import type { FindingsResponse } from "./findings-schema";
import type { RiskAnalysisResponse } from "./risk-analysis-schema";
import type { PeriodType } from "@/types/check";

// Cho phép chạy thử toàn bộ luồng "Tạo kiểm tra mới" → xử lý → "Kết quả kiểm tra" trên
// web thật mà KHÔNG cần ANTHROPIC_API_KEY và không tốn phí gọi API — bật bằng biến môi
// trường MOCK_AI_REVIEW=true (xem README/hướng dẫn). Trả về ngay một bộ finding mẫu cố
// định thay vì gọi Claude, để kiểm tra UI/luồng xử lý/export mà không cần API key thật.
export function isMockReviewEnabled(): boolean {
  return process.env.MOCK_AI_REVIEW === "true";
}

interface MockReviewInput {
  clientName: string;
  periodType: PeriodType;
  ercDocument: string | null;
  ircDocument: string | null;
  legalDossierDocument: string | null;
  draftDocument: string | null;
}

export function buildMockFindingsResponse(input: MockReviewInput): FindingsResponse {
  const hasErcIrc = Boolean(input.ercDocument || input.ircDocument);
  const hasLegalDossier = Boolean(input.legalDossierDocument);
  const hasDraft = Boolean(input.draftDocument);

  return {
    period_type_detected: input.periodType,
    categories: {
      so_lieu: { checked: true, skipped_reason: null },
      chinh_ta: { checked: true, skipped_reason: null },
      format: { checked: true, skipped_reason: null },
      erc_irc: hasErcIrc
        ? { checked: true, skipped_reason: null }
        : { checked: false, skipped_reason: "ERC/IRC không được cung cấp — MOCK MODE" },
      phap_ly: hasLegalDossier
        ? { checked: true, skipped_reason: null }
        : {
            checked: false,
            skipped_reason:
              "Chưa cung cấp hồ sơ pháp lý mở rộng (giấy phép con, ưu đãi thuế, hợp đồng thuê đất...) — khuyến nghị bổ sung để đối chiếu đầy đủ. (MOCK MODE)",
          },
      doi_chieu: hasDraft
        ? { checked: true, skipped_reason: null }
        : { checked: false, skipped_reason: "Không có bản kiểm tra trước đó của công ty này để đối chiếu — MOCK MODE" },
      khac: { checked: true, skipped_reason: null },
    },
    findings: [
      {
        section: "1",
        group: "trang_bia_muc_luc",
        field_label: "Trang bìa — tên công ty, kỳ báo cáo",
        page_vn: 1,
        page_en: 1,
        content_vn: input.clientName,
        content_en: input.clientName,
        status: "pass",
        category: "format",
        note: "[MOCK] Tiêu đề bìa nhất quán giữa VN và EN.",
      },
      {
        section: "7.3",
        group: "trang_bia_muc_luc",
        field_label: "Số trang mục lục — Bảng cân đối kế toán",
        page_vn: 5,
        page_en: 5,
        content_vn: "Mục lục ghi tr.5",
        content_en: "Table of contents: p.6",
        status: "error",
        category: "format",
        note: "[MOCK] Mục lục EN ghi tr.6 nhưng thực tế bắt đầu từ tr.5 — cần sửa cho khớp VN.",
      },
      {
        section: "8.7",
        group: "bao_cao_kiem_toan",
        field_label: "Ngữ pháp — Báo cáo Ban Giám đốc",
        page_vn: null,
        page_en: 3,
        content_vn: null,
        content_en: "The General Directors is responsible for...",
        status: "warning",
        category: "chinh_ta",
        note: "[MOCK] Sửa thành 'The General Director is responsible for...'.",
      },
      {
        section: "7.4 Hướng A",
        group: "doi_chieu_tm_so_lieu",
        field_label: "BCĐKT dòng 141 — Hàng tồn kho",
        page_vn: 4,
        page_en: 4,
        content_vn: "TM = 5.4",
        content_en: null,
        status: "needs_supplementing",
        category: "so_lieu",
        note: "[MOCK] Cột TM ghi 5.4 nhưng không tìm thấy note thuyết minh tương ứng — cần bổ sung.",
      },
      {
        section: "11.1.A",
        group: "doi_chieu_tm_so_lieu",
        field_label: "BCĐKT — Tổng cộng tài sản (dòng 270)",
        page_vn: 4,
        page_en: 4,
        content_vn: "12.450.000.000",
        content_en: "12,450,000,000",
        status: "error",
        category: "so_lieu",
        note: "[MOCK] Tính lại = 12.480.000.000, báo cáo ghi 12.450.000.000 — chênh lệch 30.000.000.",
      },
      {
        section: "9",
        group: "erc_irc",
        field_label: "Vốn điều lệ đối chiếu ERC",
        page_vn: null,
        page_en: null,
        content_vn: hasErcIrc ? "50.000.000.000 VND" : null,
        content_en: hasErcIrc ? "50,000,000,000 VND" : null,
        status: hasErcIrc ? "pass" : "warning",
        category: "erc_irc",
        note: hasErcIrc
          ? "[MOCK] Khớp ERC mới nhất."
          : "[MOCK] Chưa cung cấp ERC/IRC — không thể đối chiếu.",
      },
      {
        section: "9A",
        group: "ho_so_phap_ly",
        field_label: "Ngành nghề kinh doanh có điều kiện",
        page_vn: null,
        page_en: null,
        content_vn: null,
        content_en: null,
        status: hasLegalDossier ? "critical" : "pass",
        category: "phap_ly",
        note: hasLegalDossier
          ? "[MOCK] Không thấy giấy phép con tương ứng trong hồ sơ pháp lý — rủi ro pháp lý cao, cần xác minh với khách hàng."
          : "[MOCK] Chưa cung cấp hồ sơ pháp lý mở rộng — bỏ qua kiểm tra này.",
      },
      {
        section: "9B",
        group: "hieu_luc_phap_ly",
        field_label: "Hiệu lực căn cứ pháp lý — Thông tư 200/2014/TT-BTC",
        page_vn: null,
        page_en: null,
        content_vn: null,
        content_en: null,
        status: "warning",
        category: "phap_ly",
        note: "[MOCK] Không tra cứu web_search thật trong chế độ mock — cần kiểm tra thủ công.",
      },
      {
        section: "12A",
        group: "thuat_ngu",
        field_label: "Thuật ngữ 'Công ty mẹ'",
        page_vn: null,
        page_en: 8,
        content_vn: null,
        content_en: "Holding Company",
        status: "error",
        category: "khac",
        note: "[MOCK] Sai thuật ngữ chuẩn JPA — phải dùng 'Parent company'.",
      },
      {
        section: "15",
        group: "doi_chieu_phien_ban",
        field_label: "Đối chiếu bản kiểm tra trước đó — Note 1.6",
        page_vn: null,
        page_en: null,
        content_vn: null,
        content_en: null,
        status: "pass",
        category: "doi_chieu",
        note: hasDraft
          ? "[MOCK] Không có khác biệt so với lượt kiểm tra gần nhất của công ty này."
          : "[MOCK] Không có bản trước đó để đối chiếu.",
      },
    ],
    summary: {
      overall_notes:
        "[CHẾ ĐỘ THỬ NGHIỆM — MOCK_AI_REVIEW=true, không gọi Claude API thật] Đây là dữ liệu giả lập cố định dùng để kiểm tra luồng xử lý và giao diện kết quả, không phải kết quả review thật.",
    },
  };
}

export function buildMockRiskAnalysisResponse(): RiskAnalysisResponse {
  return {
    ratios: [
      { category: "thanh_khoan", name: "Current ratio (Khả năng thanh toán hiện hành)", unit: "lần", current_year_value: 1.8, prior_year_value: 2.1, note: "[MOCK]" },
      { category: "thanh_khoan", name: "Quick ratio (Khả năng thanh toán nhanh)", unit: "lần", current_year_value: 1.2, prior_year_value: 1.5, note: "[MOCK]" },
      { category: "don_bay", name: "Debt/Equity", unit: "lần", current_year_value: 0.9, prior_year_value: 0.7, note: "[MOCK]" },
      { category: "don_bay", name: "Debt/Assets", unit: "%", current_year_value: 47, prior_year_value: 41, note: "[MOCK]" },
      { category: "sinh_loi", name: "Gross margin", unit: "%", current_year_value: 32.5, prior_year_value: 34.1, note: "[MOCK]" },
      { category: "sinh_loi", name: "Net margin", unit: "%", current_year_value: 6.2, prior_year_value: 8.0, note: "[MOCK]" },
      { category: "sinh_loi", name: "ROA", unit: "%", current_year_value: 5.1, prior_year_value: 6.4, note: "[MOCK]" },
      { category: "sinh_loi", name: "ROE", unit: "%", current_year_value: 9.6, prior_year_value: 11.2, note: "[MOCK]" },
      { category: "hieu_qua_hoat_dong", name: "Asset turnover", unit: "lần", current_year_value: 0.82, prior_year_value: 0.80, note: "[MOCK]" },
      { category: "hieu_qua_hoat_dong", name: "Receivable days", unit: "ngày", current_year_value: 58, prior_year_value: 45, note: "[MOCK]" },
    ],
    warnings: [
      {
        title: "[MOCK] Đòn bẩy tài chính tăng",
        level: "medium",
        description: "[MOCK] Debt/Equity tăng từ 0.7 lên 0.9 lần, cho thấy công ty phụ thuộc nhiều hơn vào nợ vay để tài trợ hoạt động.",
      },
      {
        title: "[MOCK] Vòng quay phải thu chậm lại",
        level: "low",
        description: "[MOCK] Receivable days tăng từ 45 lên 58 ngày — cần theo dõi khả năng thu hồi công nợ.",
      },
    ],
    summary:
      "[MOCK — CHẾ ĐỘ THỬ NGHIỆM] Sức khỏe tài chính nhìn chung ổn định nhưng có dấu hiệu suy giảm nhẹ về khả năng thanh toán và biên lợi nhuận so với năm trước; đòn bẩy tài chính tăng cần theo dõi.",
  };
}
