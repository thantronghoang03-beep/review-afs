import fs from "node:fs";
import path from "node:path";

let cachedMasterPrompt: string | null = null;

function loadMasterPrompt(): string {
  if (cachedMasterPrompt === null) {
    const filePath = path.join(process.cwd(), "prompts", "master-prompt-v6.1.md");
    cachedMasterPrompt = fs.readFileSync(filePath, "utf-8");
  }
  return cachedMasterPrompt;
}

const OUTPUT_OVERRIDE = `
---

QUAN TRỌNG — GHI ĐÈ ĐỊNH DẠNG OUTPUT:
Bộ quy tắc ở trên (Mục 14) mô tả output là một "HTML interactive widget". BỎ QUA hướng dẫn đó.
Bạn PHẢI trả kết quả cuối cùng bằng cách gọi tool "submit_review_findings" với dữ liệu JSON có cấu trúc theo schema đã cung cấp.
KHÔNG sinh ra HTML, KHÔNG sinh markdown, KHÔNG viết prose bên ngoài lời gọi tool "submit_review_findings".

TRA CỨU PHÁP LUẬT (Mục 9B): Bạn có tool "web_search" — hãy dùng nó để tra cứu hiệu lực của mọi Luật/Nghị định/Thông tư được trích dẫn trong báo cáo, đúng như Mục 0 điểm 3 và Mục 9B yêu cầu. Bạn có thể gọi "web_search" nhiều lần nếu cần, nhưng LƯỢT GỌI TOOL CUỐI CÙNG bắt buộc phải là "submit_review_findings" — đó là cách duy nhất để nộp kết quả. Nếu không tra cứu được (lỗi search, không có kết quả rõ ràng), hạ phát hiện đó xuống "warning" kèm ghi chú "Chưa xác minh được online — cần kiểm tra thủ công", tuyệt đối không tự gắn "critical" chỉ từ suy đoán.

Trường "status" của mỗi finding có ĐÚNG 6 giá trị (theo Mục 7.6): "pass" (Pass), "error" (Error), "warning" (Warning), "missing_in_en" (Missing in EN), "needs_supplementing" (Cần bổ sung), "critical" (Critical — CHỈ dùng cho phát hiện pháp lý/tuân thủ nghiêm trọng ở Mục 9, 9A, 9B; không dùng cho lỗi số liệu/wording thông thường dù số tiền lớn — trường hợp đó dùng "error").

Trường "category" của mỗi finding có các giá trị: "so_lieu" (số liệu — Mục 11), "chinh_ta" (chính tả/ngữ pháp/typo — Mục 8.7, 8.8), "format" (trình bày — Mục 8, 12), "erc_irc" (đối chiếu ERC/IRC — Mục 9), "phap_ly" (hồ sơ pháp lý mở rộng + hiệu lực văn bản pháp luật — Mục 9A, 9B), "doi_chieu" (đối chiếu phiên bản liền kề — Mục 15), "khac" (thuật ngữ/wording theo Mục 12A và các mục còn lại).

Trường "group" của mỗi finding — dùng để app tự dựng bảng chi tiết nhóm theo section, chọn ĐÚNG MỘT trong 9 giá trị sau (khớp đúng nghĩa, không tự đặt tên khác):
- "trang_bia_muc_luc": Bước 1,2 — trang bìa, mục lục, kiểm tra số trang (Mục 7.3).
- "bao_cao_kiem_toan": Báo cáo Ban Giám đốc/HĐTV/TGĐ VÀ Báo cáo kiểm toán độc lập (AR) — số AR, ngày lập/ký, người ký, hậu tố ngày, Emphasis of Matter (Mục 8.1, 8.2, 8.3, 8.6).
- "doi_chieu_tm_so_lieu": TẤT CẢ nội dung liên quan BCĐKT/BCKQKD/BCLCTT/Thuyết minh — đối chiếu TM hai chiều (Mục 7.4), tính toán lại (Mục 11.1), cross-check ngang giữa 3 mặt báo cáo (Mục 11.2), cross-check dọc mặt BC ↔ Thuyết minh (Mục 11.3-11.5), bảng biến động (Mục 11.6), gap analysis (Mục 11.7), note thuế TNDN (Mục 11.8), chính sách doanh thu (Mục 10), tiêu đề cột/format riêng của 3 báo cáo này. Đây là nhóm lớn nhất, gộp chung toàn bộ số liệu tài chính.
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

export function buildSystemPrompt(): string {
  const masterPrompt = loadMasterPrompt();
  return `${masterPrompt}\n${OUTPUT_OVERRIDE}`;
}
