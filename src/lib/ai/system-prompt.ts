import fs from "node:fs";
import path from "node:path";

let cachedMasterPrompt: string | null = null;

function loadMasterPrompt(): string {
  if (cachedMasterPrompt === null) {
    const filePath = path.join(process.cwd(), "prompts", "master-prompt-v5.md");
    cachedMasterPrompt = fs.readFileSync(filePath, "utf-8");
  }
  return cachedMasterPrompt;
}

const OUTPUT_OVERRIDE = `
---

QUAN TRỌNG — GHI ĐÈ ĐỊNH DẠNG OUTPUT:
Bộ quy tắc ở trên (Mục 14) mô tả output là một "HTML interactive widget". BỎ QUA hướng dẫn đó.
Bạn PHẢI trả kết quả bằng cách gọi tool "submit_review_findings" với dữ liệu JSON có cấu trúc theo schema đã cung cấp.
KHÔNG sinh ra HTML, KHÔNG sinh markdown, KHÔNG viết prose bên ngoài lời gọi tool.
Mỗi hạng mục đã kiểm tra (bao gồm cả các hạng mục "Match") phải được ghi lại thành một object trong mảng "findings" — không chỉ ghi các lỗi.
Trường "severity" KHÔNG có trong schema — không tự đánh giá mức độ nghiêm trọng, hệ thống sẽ tính severity từ "status" ở phía server.
Với mỗi category (so_lieu, chinh_ta, format, erc_irc, khac): nếu không có đủ dữ liệu để kiểm tra hạng mục đó (ví dụ chưa upload ERC/IRC), đặt "checked": false và ghi "skipped_reason" rõ ràng; nếu đã kiểm tra, "checked": true và "skipped_reason": null.
`;

export function buildSystemPrompt(): string {
  const masterPrompt = loadMasterPrompt();
  return `${masterPrompt}\n${OUTPUT_OVERRIDE}`;
}
