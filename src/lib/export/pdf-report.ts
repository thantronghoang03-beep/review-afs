import PDFDocument from "pdfkit";
import type { Check } from "@/types/check";
import { PERIOD_TYPE_LABELS } from "@/types/check";
import type { Finding, FindingStatus } from "@/types/finding";
import { STATUS_LABELS, normalizeFindingStatus } from "@/types/finding";
import { formatDateTime } from "@/lib/format/date";

// Mục 14 (Master Prompt v6.1) — stats theo đúng 6 trạng thái, không quy đổi ra mức độ
// nghiêm trọng (severity là dữ liệu nội bộ dùng để tô màu, không phải một lớp phân
// loại riêng trong output).
const STATUS_ORDER: FindingStatus[] = [
  "pass",
  "error",
  "warning",
  "missing_in_en",
  "needs_supplementing",
  "critical",
];

function pageLabel(f: Finding): string {
  if (f.pageVn && f.pageEn) return f.pageVn === f.pageEn ? `tr.${f.pageVn}` : `VN tr.${f.pageVn} / EN tr.${f.pageEn}`;
  if (f.pageVn) return `VN tr.${f.pageVn}`;
  if (f.pageEn) return `EN tr.${f.pageEn}`;
  return "—";
}

export async function generatePdfReport(check: Check, findings: Finding[]): Promise<Buffer> {
  const errorFindings = findings.filter((f) => normalizeFindingStatus(f.status) !== "pass");
  const statusCounts = STATUS_ORDER.map((status) => ({
    status,
    label: STATUS_LABELS[status],
    count: findings.filter((f) => normalizeFindingStatus(f.status) === status).length,
  }));

  const doc = new PDFDocument({ size: "A4", margin: 40 });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  doc.fontSize(18).text("Review AFS — Báo cáo lỗi kiểm tra BCTC", { align: "center" });
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor("#444");
  doc.text(`Khách hàng: ${check.clientName}`);
  doc.text(`Người kiểm tra: ${check.createdBy ?? "—"}`);
  doc.text(`Năm tài chính: ${check.fiscalYear}`);
  doc.text(`Loại kỳ kiểm toán: ${PERIOD_TYPE_LABELS[check.periodType]}`);
  doc.text(`Ngày tạo: ${formatDateTime(check.createdAt)}`);
  doc.fillColor("#000");
  doc.moveDown(1);

  doc.fontSize(13).text(`Tổng: ${findings.length}   (${errorFindings.length} cần chú ý)`);
  doc.fontSize(10).text(statusCounts.map((s) => `${s.label}: ${s.count}`).join("   "));
  doc.moveDown(1);

  doc.fontSize(13).text("Chi tiết lỗi", { underline: true });
  doc.moveDown(0.5);

  const colWidths = { idx: 25, section: 45, label: 140, page: 70, status: 80, note: 155 };
  const startX = doc.x;

  function drawRowHeader() {
    doc.fontSize(9).fillColor("#fff");
    const y = doc.y;
    doc.rect(startX, y, 515, 18).fill("#2563eb");
    doc.fillColor("#fff");
    let x = startX + 4;
    doc.text("#", x, y + 4, { width: colWidths.idx });
    x += colWidths.idx;
    doc.text("Mục", x, y + 4, { width: colWidths.section });
    x += colWidths.section;
    doc.text("Nội dung", x, y + 4, { width: colWidths.label });
    x += colWidths.label;
    doc.text("Trang", x, y + 4, { width: colWidths.page });
    x += colWidths.page;
    doc.text("Trạng thái", x, y + 4, { width: colWidths.status });
    x += colWidths.status;
    doc.text("Nguyên nhân & đề xuất xử lý", x, y + 4, { width: colWidths.note });
    doc.fillColor("#000");
    doc.y = y + 18;
  }

  drawRowHeader();

  errorFindings.forEach((f, i) => {
    if (doc.y > 760) {
      doc.addPage();
      drawRowHeader();
    }
    const y = doc.y;
    const rowHeight = 26;
    doc.fontSize(8);
    let x = startX + 4;
    doc.text(String(i + 1), x, y + 3, { width: colWidths.idx });
    x += colWidths.idx;
    doc.text(f.section, x, y + 3, { width: colWidths.section });
    x += colWidths.section;
    doc.text(f.fieldLabel, x, y + 3, { width: colWidths.label, height: rowHeight });
    x += colWidths.label;
    doc.text(pageLabel(f), x, y + 3, { width: colWidths.page });
    x += colWidths.page;
    doc.text(STATUS_LABELS[normalizeFindingStatus(f.status)], x, y + 3, { width: colWidths.status });
    x += colWidths.status;
    doc.text(f.note ?? "", x, y + 3, { width: colWidths.note, height: rowHeight });
    doc.moveTo(startX, y + rowHeight).lineTo(startX + 515, y + rowHeight).strokeColor("#ddd").stroke();
    doc.y = y + rowHeight;
  });

  doc.end();
  return done;
}
