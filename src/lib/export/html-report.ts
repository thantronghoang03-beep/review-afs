import type { Check } from "@/types/check";
import { PERIOD_TYPE_LABELS } from "@/types/check";
import type { Finding, FindingStatus } from "@/types/finding";
import { STATUS_LABELS, SEVERITY_LABELS, CATEGORY_LABELS } from "@/types/finding";
import { formatDateTime } from "@/lib/format/date";

const STATUS_COLORS: Record<FindingStatus, string> = {
  match: "#16a34a",
  difference: "#dc2626",
  warning: "#ca8a04",
  missing_in_en: "#2563eb",
  needs_supplementing: "#ea580c",
};

function escapeHtml(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function pageLabel(f: Finding): string {
  if (f.pageVn && f.pageEn) return f.pageVn === f.pageEn ? `tr.${f.pageVn}` : `VN tr.${f.pageVn} / EN tr.${f.pageEn}`;
  if (f.pageVn) return `VN tr.${f.pageVn}`;
  if (f.pageEn) return `EN tr.${f.pageEn}`;
  return "—";
}

export function generateHtmlReport(check: Check, findings: Finding[]): string {
  const errorFindings = findings.filter((f) => f.status !== "match");
  const critical = errorFindings.filter((f) => f.severity === "critical").length;
  const medium = errorFindings.filter((f) => f.severity === "medium").length;
  const minor = errorFindings.filter((f) => f.severity === "minor").length;

  const statusCounts = (Object.keys(STATUS_LABELS) as FindingStatus[]).map((status) => ({
    status,
    label: STATUS_LABELS[status],
    count: findings.filter((f) => f.status === status).length,
  }));

  const rows = findings
    .map(
      (f, i) => `
      <tr data-status="${f.status}">
        <td>${i + 1}</td>
        <td><div class="field">${escapeHtml(f.fieldLabel)}</div><div class="muted">${escapeHtml(f.section)} · ${escapeHtml(CATEGORY_LABELS[f.category])}</div></td>
        <td class="nowrap">${escapeHtml(pageLabel(f))}</td>
        <td>${escapeHtml(f.contentVn)}</td>
        <td>${escapeHtml(f.contentEn)}</td>
        <td><span class="badge" style="background:${STATUS_COLORS[f.status]}1a;color:${STATUS_COLORS[f.status]}">${escapeHtml(STATUS_LABELS[f.status])}</span></td>
        <td>${f.severity ? escapeHtml(SEVERITY_LABELS[f.severity]) : "—"}</td>
        <td>${escapeHtml(f.note)}</td>
      </tr>`
    )
    .join("");

  const filterButtons = [{ status: "all", label: "Tất cả" }, ...statusCounts.map((s) => ({ status: s.status, label: s.label }))]
    .map(
      (f) =>
        `<button class="filter-btn" data-filter="${f.status}" onclick="applyFilter('${f.status}')">${escapeHtml(
          f.label
        )} (${f.status === "all" ? findings.length : statusCounts.find((s) => s.status === f.status)?.count ?? 0})</button>`
    )
    .join("");

  return `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8" />
<title>Review AFS — ${escapeHtml(check.clientName)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; background: #fafafa; color: #18181b; margin: 0; padding: 24px; }
  .header { background: #fff; border: 1px solid #e4e4e7; border-radius: 16px; padding: 20px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; }
  .header h1 { font-size: 18px; margin: 0 0 4px; }
  .header p { margin: 0; font-size: 13px; color: #a1a1aa; }
  .period-badge { background: #eff6ff; color: #1d4ed8; font-size: 12px; font-weight: 600; padding: 6px 12px; border-radius: 999px; }
  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 12px; margin-bottom: 16px; }
  .stat-card { border-radius: 12px; padding: 14px; }
  .stat-card .label { font-size: 12px; opacity: .8; }
  .stat-card .value { font-size: 22px; font-weight: 700; margin-top: 2px; }
  .stat-total { background: #fef2f2; color: #b91c1c; }
  .stat-critical { background: #fff7ed; color: #c2410c; }
  .stat-medium { background: #fefce8; color: #a16207; }
  .stat-minor { background: #eff6ff; color: #1d4ed8; }
  .stat-checked { background: #f0fdf4; color: #15803d; }
  .card { background: #fff; border: 1px solid #e4e4e7; border-radius: 16px; padding: 20px; }
  .filters { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; }
  .filter-btn { border: none; background: #f4f4f5; color: #52525b; font-size: 12px; font-weight: 500; padding: 6px 14px; border-radius: 999px; cursor: pointer; }
  .filter-btn.active { background: #2563eb; color: #fff; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; background: #fafafa; color: #71717a; font-size: 11px; padding: 10px 12px; border-bottom: 1px solid #e4e4e7; }
  td { padding: 10px 12px; border-bottom: 1px solid #f4f4f5; vertical-align: top; }
  .field { font-weight: 600; color: #27272a; }
  .muted { font-size: 11px; color: #a1a1aa; }
  .badge { font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 999px; display: inline-block; }
  .nowrap { white-space: nowrap; }
  .footer { text-align: center; font-size: 11px; color: #a1a1aa; margin-top: 16px; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <h1>Review AFS — Kết quả kiểm tra báo cáo kiểm toán</h1>
      <p>${escapeHtml(check.clientName)} · Năm tài chính ${escapeHtml(check.fiscalYear)}${check.createdBy ? ` · Người kiểm tra: ${escapeHtml(check.createdBy)}` : ""} · Xuất lúc ${formatDateTime(new Date().toISOString())}</p>
    </div>
    <span class="period-badge">${escapeHtml(PERIOD_TYPE_LABELS[check.periodType])}</span>
  </div>

  <div class="stats">
    <div class="stat-card stat-total"><div class="label">Tổng số lỗi</div><div class="value">${errorFindings.length}</div></div>
    <div class="stat-card stat-critical"><div class="label">Nghiêm trọng</div><div class="value">${critical}</div></div>
    <div class="stat-card stat-medium"><div class="label">Trung bình</div><div class="value">${medium}</div></div>
    <div class="stat-card stat-minor"><div class="label">Nhẹ</div><div class="value">${minor}</div></div>
    <div class="stat-card stat-checked"><div class="label">Đã kiểm tra</div><div class="value">${findings.length}</div></div>
  </div>

  <div class="card">
    <div class="filters">${filterButtons}</div>
    <table>
      <thead>
        <tr>
          <th>#</th><th>Mục kiểm tra</th><th>Trang</th><th>Nội dung VN</th><th>Nội dung EN</th><th>Trạng thái</th><th>Mức độ</th><th>Ghi chú</th>
        </tr>
      </thead>
      <tbody id="findings-body">${rows}</tbody>
    </table>
  </div>

  <p class="footer">Tạo bởi Review AFS — JPA Vietvalues, theo Master Prompt v5.0</p>

  <script>
    function applyFilter(status) {
      document.querySelectorAll('.filter-btn').forEach(function(btn) {
        btn.classList.toggle('active', btn.getAttribute('data-filter') === status);
      });
      document.querySelectorAll('#findings-body tr').forEach(function(row) {
        row.style.display = status === 'all' || row.getAttribute('data-status') === status ? '' : 'none';
      });
    }
    applyFilter('all');
  </script>
</body>
</html>`;
}
