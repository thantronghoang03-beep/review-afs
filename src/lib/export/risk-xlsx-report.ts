import ExcelJS from "exceljs";
import type { Check } from "@/types/check";
import { PERIOD_TYPE_LABELS } from "@/types/check";
import type { RiskAnalysis, RiskCardLevel } from "@/types/risk";
import {
  RISK_CARD_LEVEL_LABELS,
  RISK_RATIO_CATEGORY_LABELS,
  RISK_GROUP_LABELS,
  OVERALL_RISK_LABELS,
} from "@/types/risk";
import { formatDate, formatDateTime } from "@/lib/format/date";

const LEVEL_FILL: Record<RiskCardLevel, string> = {
  pass: "FFDCFCE7",
  warning: "FFFEF08A",
  error: "FFFECACA",
  critical: "FFF3E8FF",
};

export async function generateRiskXlsxReport(check: Check, analysis: RiskAnalysis): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Review AFS";
  workbook.created = new Date(check.createdAt);

  const infoSheet = workbook.addWorksheet("Thông tin");
  infoSheet.columns = [{ width: 25 }, { width: 55 }];
  infoSheet.addRows([
    ["Tên khách hàng", check.clientName],
    ["Người kiểm tra", check.createdBy ?? "—"],
    ["Năm tài chính", check.fiscalYear],
    ["Kỳ kế toán năm nay", `${formatDate(check.periodCurrentStart)} - ${formatDate(check.periodCurrentEnd)}`],
    [
      "Kỳ kế toán năm trước",
      check.periodPriorStart ? `${formatDate(check.periodPriorStart)} - ${formatDate(check.periodPriorEnd)}` : "N/A",
    ],
    ["Loại kỳ kiểm toán", PERIOD_TYPE_LABELS[check.periodType]],
    ["Ngày tạo", formatDateTime(check.createdAt)],
    ["Mức rủi ro tổng thể", OVERALL_RISK_LABELS[analysis.overallRisk.level]],
    ["Tóm tắt rủi ro tổng thể", analysis.overallRisk.summary],
    ["Tóm tắt chung", analysis.summary],
  ]);

  const kpiSheet = workbook.addWorksheet("KPI");
  kpiSheet.columns = [
    { header: "Chỉ số", key: "label", width: 30 },
    { header: "Giá trị", key: "value", width: 20 },
    { header: "So sánh", key: "comparison", width: 40 },
  ];
  kpiSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  kpiSheet.getRow(1).eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
  });
  analysis.kpis.forEach((k) => kpiSheet.addRow({ label: k.label, value: k.value, comparison: k.comparison ?? "" }));

  const varianceSheet = workbook.addWorksheet("11B.1 Biến động");
  varianceSheet.columns = [
    { header: "Khoản mục", key: "label", width: 35 },
    { header: "Năm nay", key: "current", width: 18 },
    { header: "Năm trước", key: "prior", width: 18 },
    { header: "% biến động", key: "percent", width: 14 },
    { header: "Mức rủi ro", key: "level", width: 16 },
    { header: "Đánh giá & khuyến nghị", key: "note", width: 55 },
  ];
  varianceSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  varianceSheet.getRow(1).eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
  });
  analysis.variances.forEach((v) => {
    const row = varianceSheet.addRow({
      label: v.label,
      current: v.currentYearValue,
      prior: v.priorYearValue,
      percent: v.percentChange !== null ? `${v.percentChange > 0 ? "+" : ""}${v.percentChange.toFixed(1)}%` : "—",
      level: RISK_CARD_LEVEL_LABELS[v.level],
      note: v.note,
    });
    row.getCell("level").fill = { type: "pattern", pattern: "solid", fgColor: { argb: LEVEL_FILL[v.level] } };
    row.alignment = { vertical: "top", wrapText: true };
  });

  const ratioSheet = workbook.addWorksheet("11B.3 Chỉ số TC");
  ratioSheet.columns = [
    { header: "Nhóm", key: "category", width: 22 },
    { header: "Chỉ số", key: "name", width: 30 },
    { header: "Năm nay", key: "current", width: 16 },
    { header: "Năm trước", key: "prior", width: 16 },
  ];
  ratioSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  ratioSheet.getRow(1).eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
  });
  analysis.ratios.forEach((r) => {
    ratioSheet.addRow({
      category: RISK_RATIO_CATEGORY_LABELS[r.category],
      name: r.name,
      current: r.currentYearValue !== null ? `${r.currentYearValue}${r.unit === "%" ? "%" : ` ${r.unit}`}` : "—",
      prior: r.priorYearValue !== null ? `${r.priorYearValue}${r.unit === "%" ? "%" : ` ${r.unit}`}` : "—",
    });
  });

  const riskSheet = workbook.addWorksheet("11C Rủi ro");
  riskSheet.columns = [
    { header: "Nhóm rủi ro", key: "group", width: 30 },
    { header: "Nội dung", key: "title", width: 30 },
    { header: "Trang", key: "page", width: 10 },
    { header: "Mức rủi ro", key: "level", width: 16 },
    { header: "Số liệu (VN)", key: "valueVn", width: 30 },
    { header: "Tóm tắt (EN)", key: "summaryEn", width: 30 },
    { header: "Đánh giá & khuyến nghị", key: "assessment", width: 55 },
  ];
  riskSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  riskSheet.getRow(1).eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
  });
  analysis.riskItems.forEach((item) => {
    const row = riskSheet.addRow({
      group: RISK_GROUP_LABELS[item.group],
      title: item.title,
      page: item.page ?? "—",
      level: RISK_CARD_LEVEL_LABELS[item.level],
      valueVn: item.valueVn ?? "",
      summaryEn: item.summaryEn ?? "",
      assessment: item.assessment,
    });
    row.getCell("level").fill = { type: "pattern", pattern: "solid", fgColor: { argb: LEVEL_FILL[item.level] } };
    row.alignment = { vertical: "top", wrapText: true };
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
