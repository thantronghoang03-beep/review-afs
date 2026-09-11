import PDFDocument from "pdfkit";
import type { Check } from "@/types/check";
import { PERIOD_TYPE_LABELS } from "@/types/check";
import type { RiskAnalysis, RiskCardLevel } from "@/types/risk";
import { RISK_CARD_LEVEL_LABELS, RISK_RATIO_CATEGORY_LABELS, RISK_GROUP_LABELS, RISK_GROUP_ORDER, OVERALL_RISK_LABELS } from "@/types/risk";
import { formatDateTime } from "@/lib/format/date";

// Bản PDF tóm tắt cho "Phân tích rủi ro báo cáo tài chính" (Mục 11B/11C, Master Prompt
// v6.6) — không thể tái hiện y hệt dashboard dạng thẻ (card-grid) trên giấy, nên trình
// bày lại thành danh sách theo nhóm, vẫn giữ đầy đủ nội dung/đánh giá.
const LEVEL_COLORS: Record<RiskCardLevel, string> = {
  pass: "#15803d",
  warning: "#a16207",
  error: "#b91c1c",
  critical: "#6b21a8",
};

function fmtNum(v: number | null): string {
  if (v === null) return "—";
  return v.toLocaleString("vi-VN");
}

function fmtRatio(v: number | null, unit: string): string {
  if (v === null) return "—";
  const n = Number.isInteger(v) ? v.toString() : v.toFixed(2);
  return unit === "%" ? `${n}%` : `${n} ${unit}`;
}

export async function generateRiskPdfReport(check: Check, analysis: RiskAnalysis): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margin: 40 });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  doc.fontSize(18).text("Review AFS — Phân tích rủi ro báo cáo tài chính", { align: "center" });
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor("#444");
  doc.text(`Khách hàng: ${check.clientName}`);
  doc.text(`Người kiểm tra: ${check.createdBy ?? "—"}`);
  doc.text(`Năm tài chính: ${check.fiscalYear}`);
  doc.text(`Loại kỳ kiểm toán: ${PERIOD_TYPE_LABELS[check.periodType]}`);
  doc.text(`Ngày tạo: ${formatDateTime(check.createdAt)}`);
  doc.fillColor("#000");
  doc.moveDown(1);

  doc.fontSize(13).fillColor(LEVEL_COLORS[analysis.overallRisk.level === "high" ? "error" : analysis.overallRisk.level === "medium" ? "warning" : "pass"]);
  doc.text(`Mức rủi ro tổng thể: ${OVERALL_RISK_LABELS[analysis.overallRisk.level]}`);
  doc.fillColor("#000").fontSize(10).text(analysis.overallRisk.summary);
  doc.moveDown(1);

  doc.fontSize(11).text("Chỉ số tổng quan (KPI)", { underline: true });
  doc.moveDown(0.3);
  analysis.kpis.forEach((k) => {
    doc.fontSize(9).text(`• ${k.label}: ${k.value}${k.comparison ? ` (${k.comparison})` : ""}`);
  });
  doc.moveDown(0.7);

  doc.fontSize(10).text(analysis.summary);
  doc.moveDown(1);

  function ensureSpace(min = 60) {
    if (doc.y > 780 - min) doc.addPage();
  }

  doc.fontSize(12).text(`11B.1 — Phân tích biến động ngang (${analysis.variances.length})`, { underline: true });
  doc.moveDown(0.3);
  analysis.variances.forEach((v) => {
    ensureSpace();
    doc.fontSize(9).fillColor(LEVEL_COLORS[v.level]).text(`● ${v.label} — ${RISK_CARD_LEVEL_LABELS[v.level]}`);
    doc.fillColor("#000");
    doc.fontSize(8).text(
      `   Năm nay: ${fmtNum(v.currentYearValue)}  |  Năm trước: ${fmtNum(v.priorYearValue)}${
        v.percentChange !== null ? `  |  % biến động: ${v.percentChange > 0 ? "+" : ""}${v.percentChange.toFixed(1)}%` : ""
      }`
    );
    doc.fontSize(8).text(`   ${v.note}`);
    doc.moveDown(0.4);
  });
  doc.moveDown(0.5);

  ensureSpace();
  doc.fontSize(12).text("11B.3 — Nhóm chỉ số tài chính", { underline: true });
  doc.moveDown(0.3);
  const ratioCategories = Array.from(new Set(analysis.ratios.map((r) => r.category)));
  ratioCategories.forEach((category) => {
    ensureSpace();
    doc.fontSize(9).text(RISK_RATIO_CATEGORY_LABELS[category], { underline: true });
    analysis.ratios
      .filter((r) => r.category === category)
      .forEach((r) => {
        doc
          .fontSize(8)
          .text(`   ${r.name}: ${fmtRatio(r.currentYearValue, r.unit)} (năm trước: ${fmtRatio(r.priorYearValue, r.unit)})`);
      });
    doc.moveDown(0.3);
  });
  doc.moveDown(0.5);

  RISK_GROUP_ORDER.forEach((group) => {
    const items = analysis.riskItems.filter((r) => r.group === group);
    if (items.length === 0) return;
    ensureSpace();
    doc.fontSize(12).text(`${RISK_GROUP_LABELS[group]} (${items.length})`, { underline: true });
    doc.moveDown(0.3);
    items.forEach((item) => {
      ensureSpace();
      doc.fontSize(9).fillColor(LEVEL_COLORS[item.level]).text(
        `● ${item.title}${item.page ? ` (tr.${item.page})` : ""} — ${RISK_CARD_LEVEL_LABELS[item.level]}`
      );
      doc.fillColor("#000");
      if (item.valueVn) doc.fontSize(8).text(`   ${item.valueVn}`);
      if (item.summaryEn) doc.fontSize(8).fillColor("#666").text(`   ${item.summaryEn}`);
      doc.fillColor("#000").fontSize(8).text(`   Đánh giá & khuyến nghị: ${item.assessment}`);
      doc.moveDown(0.4);
    });
    doc.moveDown(0.5);
  });

  doc.end();
  return done;
}
