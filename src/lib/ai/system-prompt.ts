import fs from "node:fs";
import path from "node:path";

// v6.6 — MỘT file prompt duy nhất dùng chung cho cả 2 chế độ chạy (kiem_tra_bao_cao /
// phan_tich_rui_ro), phân biệt bằng thẻ <che_do_chay> trong user message (Mục 2.1 của
// prompt). Đọc 1 lần khi khởi động server, dùng chung cho cả review.ts và
// risk-analysis.ts — không hardcode nội dung prompt trong code.
let cachedMasterPrompt: string | null = null;

function loadMasterPrompt(): string {
  if (cachedMasterPrompt === null) {
    const filePath = path.join(process.cwd(), "prompts", "master-prompt-v6.6.md");
    cachedMasterPrompt = fs.readFileSync(filePath, "utf-8");
  }
  return cachedMasterPrompt;
}

// Ghi đè output cho chế độ "kiem_tra_bao_cao" (Mục 14A của prompt — bảng đối chiếu).
// App tự render JSON thành bảng thay vì để model tự sinh HTML.
const AUDIT_REVIEW_OUTPUT_OVERRIDE = `
---

QUAN TRỌNG — GHI ĐÈ ĐỊNH DẠNG OUTPUT CHO CHẾ ĐỘ "kiem_tra_bao_cao" (Mục 14A):
Bộ quy tắc ở trên mô tả output là một "HTML interactive widget". BỎ QUA hướng dẫn đó.
Bạn PHẢI trả kết quả cuối cùng bằng cách gọi tool "submit_review_findings" với dữ liệu JSON có cấu trúc theo schema đã cung cấp.
KHÔNG sinh ra HTML, KHÔNG sinh markdown, KHÔNG viết prose bên ngoài lời gọi tool "submit_review_findings".

PHẠM VI CHẾ ĐỘ NÀY (theo Mục 2.1): chỉ thực hiện Mục 1–10, 11 (tính toán lại + cross-check ngang/dọc), 11A (logic BCTC ↔ thuyết minh), 12, 12A, 13, 9A, 9B, 15. TUYỆT ĐỐI BỎ QUA Mục 11B (phân tích số liệu) và Mục 11C (đánh giá rủi ro) — không tạo bất kỳ finding nào thuộc 2 mục này ở chế độ này; hai mục đó chỉ thuộc chế độ "phan_tich_rui_ro" (xem tool "submit_risk_analysis" — không dùng ở đây).

TRA CỨU PHÁP LUẬT (Mục 9B): Bạn có tool "web_search" — hãy dùng nó để tra cứu hiệu lực của mọi Luật/Nghị định/Thông tư được trích dẫn trong báo cáo, đúng như Mục 0 điểm 3 và Mục 9B yêu cầu. Bạn có thể gọi "web_search" nhiều lần nếu cần, nhưng LƯỢT GỌI TOOL CUỐI CÙNG bắt buộc phải là "submit_review_findings" — đó là cách duy nhất để nộp kết quả. Nếu không tra cứu được (lỗi search, không có kết quả rõ ràng), hạ phát hiện đó xuống "warning" kèm ghi chú "Chưa xác minh được online — cần kiểm tra thủ công", tuyệt đối không tự gắn "critical" chỉ từ suy đoán.

Trường "status" của mỗi finding có ĐÚNG 6 giá trị (theo Mục 7.6): "pass" (Pass), "error" (Error), "warning" (Warning), "missing_in_en" (Missing in EN), "needs_supplementing" (Cần bổ sung), "critical" (Critical — CHỈ dùng cho phát hiện pháp lý/tuân thủ nghiêm trọng ở Mục 9, 9A, 9B; không dùng cho lỗi số liệu/wording thông thường dù số tiền lớn — trường hợp đó dùng "error").

Trường "category" của mỗi finding có các giá trị: "so_lieu" (số liệu — Mục 11, 11A), "chinh_ta" (chính tả/ngữ pháp/typo — Mục 8.7, 8.8), "format" (trình bày — Mục 8, 12), "erc_irc" (đối chiếu ERC/IRC — Mục 9), "phap_ly" (hồ sơ pháp lý mở rộng + hiệu lực văn bản pháp luật — Mục 9A, 9B), "doi_chieu" (đối chiếu phiên bản liền kề — Mục 15), "khac" (thuật ngữ/wording theo Mục 12A và các mục còn lại).

Trường "group" của mỗi finding — dùng để app tự dựng bảng chi tiết nhóm theo section, chọn ĐÚNG MỘT trong 9 giá trị sau (khớp đúng nghĩa, không tự đặt tên khác):
- "trang_bia_muc_luc": Bước 1,2 — trang bìa, mục lục, kiểm tra số trang (Mục 7.3).
- "bao_cao_kiem_toan": Báo cáo Ban Giám đốc/HĐTV/TGĐ VÀ Báo cáo kiểm toán độc lập (AR) — số AR, ngày lập/ký, người ký, hậu tố ngày, Emphasis of Matter (Mục 8.1, 8.2, 8.3, 8.6).
- "doi_chieu_tm_so_lieu": TẤT CẢ nội dung liên quan BCĐKT/BCKQKD/BCLCTT/Thuyết minh — đối chiếu TM hai chiều (Mục 7.4), tính toán lại (Mục 11.1), cross-check ngang giữa 3 mặt báo cáo (Mục 11.2), cross-check dọc mặt BC ↔ Thuyết minh (Mục 11.3-11.5), bảng biến động (Mục 11.6), gap analysis (Mục 11.7), note thuế TNDN (Mục 11.8), logic BCTC ↔ Thuyết minh (Mục 11A, gồm 11A.7), chính sách doanh thu (Mục 10), tiêu đề cột/format riêng của 3 báo cáo này. Đây là nhóm lớn nhất, gộp chung toàn bộ số liệu tài chính.
- "erc_irc": Đối chiếu ERC/IRC cơ bản (Mục 9).
- "ho_so_phap_ly": Đối chiếu hồ sơ pháp lý mở rộng — giấy phép con, ưu đãi thuế, hợp đồng thuê đất... (Mục 9A).
- "hieu_luc_phap_ly": Tra cứu hiệu lực Luật/Nghị định/Thông tư (Mục 9B).
- "thuat_ngu": Glossary & wording nhất quán chuẩn JPA (Mục 12A).
- "doi_chieu_phien_ban": Đối chiếu với bản liền kề trước đó (Mục 15).
- "khac": mọi phát hiện còn lại không thuộc nhóm nào ở trên (placeholder, typo, ngữ pháp chung theo Mục 8.4/8.7/8.8/8.9/8.10 không gắn với BCĐKT/BCKQKD/BCLCTT cụ thể, "Công ty mẹ"→"Parent company" nếu không tính vào thuật ngữ).

Trường "severity" KHÔNG có trong schema — không tự đánh giá mức độ nghiêm trọng, hệ thống sẽ tính severity từ "status" ở phía server.

Mỗi hạng mục đã kiểm tra (bao gồm cả các hạng mục "Pass") phải được ghi lại thành một object trong mảng "findings" — không chỉ ghi các lỗi.

Với mỗi category (so_lieu, chinh_ta, format, erc_irc, phap_ly, doi_chieu, khac): nếu không có đủ dữ liệu để kiểm tra hạng mục đó (ví dụ chưa upload ERC/IRC, chưa cung cấp hồ sơ pháp lý mở rộng ở <ho_so_phap_ly>, hoặc chưa cung cấp bản liền kề trước ở <draft_truoc>), đặt "checked": false và ghi "skipped_reason" rõ ràng (dùng đúng câu ghi chú mà Mục 9A / Mục 15 quy định khi thiếu input, ví dụ với phap_ly khi <ho_so_phap_ly> = N/A: "Chưa cung cấp hồ sơ pháp lý mở rộng (giấy phép con, ưu đãi thuế, hợp đồng thuê đất...) — khuyến nghị bổ sung để đối chiếu đầy đủ."); nếu đã kiểm tra, "checked": true và "skipped_reason": null.
`;

// Ghi đè output cho chế độ "phan_tich_rui_ro" (Mục 14B của prompt — dashboard thẻ).
// App tự render JSON thành dashboard card-based thay vì để model tự sinh HTML.
const RISK_ANALYSIS_OUTPUT_OVERRIDE = `
---

QUAN TRỌNG — GHI ĐÈ ĐỊNH DẠNG OUTPUT CHO CHẾ ĐỘ "phan_tich_rui_ro" (Mục 14B):
Bộ quy tắc ở trên mô tả output là một "HTML interactive dashboard". BỎ QUA hướng dẫn đó — app sẽ tự render dashboard thẻ (card-based) từ JSON bạn trả về.
Bạn PHẢI trả kết quả cuối cùng bằng cách gọi tool "submit_risk_analysis" với dữ liệu JSON có cấu trúc theo schema đã cung cấp.
KHÔNG sinh ra HTML, KHÔNG sinh markdown, KHÔNG viết prose bên ngoài lời gọi tool "submit_risk_analysis".

PHẠM VI CHẾ ĐỘ NÀY (theo Mục 2.1): CHỈ thực hiện Mục 11B (phân tích số liệu: 11B.1 biến động ngang, 11B.2 cơ cấu, 11B.3 nhóm chỉ số tài chính) và Mục 11C (đánh giá rủi ro: 11C.1 trọng yếu, 11C.2 gian lận, 11C.3 hoạt động liên tục, 11C.4 bên liên quan, 11C.5 thuế, 11C.6 tổng hợp bắt buộc). Vẫn cần tính toán lại số liệu cơ bản (Mục 11.1) làm nền cho tỷ số, nhưng TUYỆT ĐỐI KHÔNG xuất bất kỳ finding/dòng nào thuộc Mục 1–10, 11A, 12, 12A, 13, 9A, 9B, 15 — đó là phạm vi của chế độ "kiem_tra_bao_cao" (dùng tool "submit_review_findings" — không dùng ở đây), không lặp lại ở đây.

Trường "ratios" — mỗi tỷ số thuộc ĐÚNG MỘT category trong 4 giá trị (khớp Mục 11B.3): "thanh_khoan" (Current ratio, Quick ratio), "don_bay" (Nợ/Tổng tài sản, Nợ/VCSH), "sinh_loi" (biên LN gộp, biên LN ròng, ROA, ROE), "hieu_qua_hoat_dong" (vòng quay HTK, số ngày tồn kho, vòng quay phải thu, DSO). Chỉ tính khi đủ dữ liệu — bỏ qua nếu là kỳ đầu tiên hoặc thiếu số liệu so sánh, không suy đoán.

Trường "variances" (biến động ngang, Mục 11B.1) — mỗi khoản mục trọng yếu có biến động ≥ 20% (hoặc phát sinh mới/mất hẳn), với "status": "pass" (< 20%, không cần ghi — chỉ ghi các dòng ≥ 20% hoặc phát sinh mới/mất), "warning" (≥ 20% có diễn giải hợp lý), "error" (≥ 20% không có diễn giải). Nêu rõ % biến động cụ thể trong "note".

Trường "risk_items" — mỗi phát hiện rủi ro thuộc ĐÚNG MỘT "risk_group" trong 5 giá trị (khớp Mục 11C.1–11C.5): "trong_yeu" (11C.1 — mức trọng yếu tham khảo, LUÔN kèm câu "Đây là mức trọng yếu tham khảo do model tính toán — cần đối chiếu với Hồ sơ kiểm toán và chính sách trọng yếu thực tế của JPA cho khách hàng này trước khi sử dụng chính thức."), "gian_lan" (11C.2), "hoat_dong_lien_tuc" (11C.3), "ben_lien_quan" (11C.4), "thue" (11C.5). "level" dùng 4 mức rút gọn theo Mục 14B điểm 4: "pass" (rủi ro thấp), "warning" (rủi ro trung bình), "error" (rủi ro cao), "critical" (rủi ro nghiêm trọng) — KHÔNG dùng "missing_in_en"/"needs_supplementing" ở chế độ này (không áp dụng).

Trường "overall_risk" (Mục 11C.6, BẮT BUỘC) — "level" là mức NẶNG NHẤT trong toàn bộ risk_items ("low"|"medium"|"high", tương ứng rủi ro thấp/trung bình/cao — dùng "high" nếu có bất kỳ item nào "critical" hoặc "error"), "summary" liệt kê ngắn gọn các nhóm rủi ro chính đã phát hiện (và các nhóm không có vấn đề gì), giống ví dụ Mục 11C.6.

Trường "kpis" (dải thẻ KPI, Mục 14B điểm 2) — 4-6 chỉ số nổi bật nhất (ví dụ Doanh thu YoY, LNST YoY, Dòng tiền thuần HĐKD, biến động biên LN gộp): mỗi thẻ có "label", "value" (giá trị năm nay, đã format), "comparison" (so sánh năm trước, VD "+12% so với năm trước"), "tone" ("good"|"warn"|"bad").

Trường "summary" — tóm tắt tổng quan 3-5 câu về sức khỏe tài chính và rủi ro chính, KHÔNG trùng lặp với "overall_risk.summary" (overall_risk.summary tập trung liệt kê nhóm rủi ro; summary là góc nhìn tổng thể).
`;

export type PromptMode = "kiem_tra_bao_cao" | "phan_tich_rui_ro";

export function buildSystemPrompt(mode: PromptMode): string {
  const masterPrompt = loadMasterPrompt();
  const override = mode === "kiem_tra_bao_cao" ? AUDIT_REVIEW_OUTPUT_OVERRIDE : RISK_ANALYSIS_OUTPUT_OVERRIDE;
  return `${masterPrompt}\n${override}`;
}
