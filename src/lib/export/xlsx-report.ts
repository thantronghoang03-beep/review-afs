import ExcelJS from "exceljs";
import type { Check } from "@/types/check";
import { PERIOD_TYPE_LABELS } from "@/types/check";
import type { Finding, FindingStatus } from "@/types/finding";
import { STATUS_LABELS } from "@/types/finding";
import { formatDate, formatDateTime } from "@/lib/format/date";

const STATUS_FILL: Record<FindingStatus, string> = {
  match: "FFDCFCE7",
  difference: "FFFECACA",
  warning: "FFFEF08A",
  missing_in_en: "FFBFDBFE",
  needs_supplementing: "FFFED7AA",
};

function pageLabel(f: Finding): string {
  if (f.pageVn && f.pageEn) return f.pageVn === f.pageEn ? `tr.${f.pageVn}` : `VN tr.${f.pageVn} / EN tr.${f.pageEn}`;
  if (f.pageVn) return `VN tr.${f.pageVn}`;
  if (f.pageEn) return `EN tr.${f.pageEn}`;
  return "—";
}

export async function generateXlsxReport(check: Check, findings: Finding[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Review AFS";
  workbook.created = new Date(check.createdAt);

  const infoSheet = workbook.addWorksheet("Thông tin");
  infoSheet.columns = [{ width: 25 }, { width: 50 }];
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
  ]);

  const sheet = workbook.addWorksheet("Chi tiết lỗi");
  sheet.columns = [
    { header: "STT", key: "idx", width: 6 },
    { header: "Mục kiểm tra", key: "section", width: 10 },
    { header: "Nội dung (VN)", key: "contentVn", width: 40 },
    { header: "Nội dung (EN)", key: "contentEn", width: 40 },
    { header: "Trang", key: "page", width: 16 },
    { header: "Trạng thái", key: "status", width: 16 },
    { header: "Ghi chú", key: "note", width: 50 },
  ];

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
  });

  findings
    .filter((f) => f.status !== "match")
    .forEach((f, i) => {
      const row = sheet.addRow({
        idx: i + 1,
        section: f.section,
        contentVn: f.contentVn ?? "",
        contentEn: f.contentEn ?? "",
        page: pageLabel(f),
        status: STATUS_LABELS[f.status],
        note: f.note ?? "",
      });
      row.getCell("status").fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: STATUS_FILL[f.status] },
      };
      row.alignment = { vertical: "top", wrapText: true };
    });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
