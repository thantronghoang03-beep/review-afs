import type { Check } from "@/types/check";
import { PERIOD_TYPE_LABELS } from "@/types/check";
import type { RiskAnalysis, RiskCardLevel, RiskRatioCategory } from "@/types/risk";
import {
  RISK_CARD_LEVEL_LABELS,
  RISK_RATIO_CATEGORY_LABELS,
  RISK_GROUP_LABELS,
  RISK_GROUP_ORDER,
  OVERALL_RISK_LABELS,
} from "@/types/risk";
import { formatDateTime } from "@/lib/format/date";

// Mục 14B (Master Prompt v6.6) — dashboard dạng thẻ, không dùng <table>, không tách
// cột VN/EN song song. Cùng cấu trúc/màu sắc với RiskAnalysisSection.tsx (component
// React hiển thị trực tiếp trên web) — file này là bản xuất HTML độc lập, tự chứa.

const LEVEL_ORDER: RiskCardLevel[] = ["pass", "warning", "error", "critical"];
const RATIO_CATEGORY_ORDER: RiskRatioCategory[] = ["thanh_khoan", "don_bay", "sinh_loi", "hieu_qua_hoat_dong"];

const LEVEL_COLORS: Record<RiskCardLevel, { bg: string; border: string; badge: string; badgeText: string }> = {
  pass: { bg: "#f0fdf4", border: "#bbf7d0", badge: "#dcfce7", badgeText: "#15803d" },
  warning: { bg: "#fefce8", border: "#fef08a", badge: "#fef9c3", badgeText: "#a16207" },
  error: { bg: "#fef2f2", border: "#fecaca", badge: "#fee2e2", badgeText: "#b91c1c" },
  critical: { bg: "#faf5ff", border: "#e9d5ff", badge: "#f3e8ff", badgeText: "#6b21a8" },
};

const OVERALL_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  low: { bg: "#f0fdf4", border: "#bbf7d0", text: "#15803d" },
  medium: { bg: "#fefce8", border: "#fef08a", text: "#a16207" },
  high: { bg: "#fef2f2", border: "#fecaca", text: "#b91c1c" },
};

const TONE_COLORS: Record<string, string> = { good: "#22c55e", warn: "#eab308", bad: "#ef4444" };

function esc(v: string | null | undefined): string {
  if (!v) return "";
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function fmtRatio(v: number | null, unit: string): string {
  if (v === null) return "—";
  const n = Number.isInteger(v) ? v.toString() : v.toFixed(2);
  return unit === "%" ? `${n}%` : `${n} ${unit}`;
}

function fmtNum(v: number | null): string {
  if (v === null) return "—";
  return v.toLocaleString("vi-VN");
}

export function generateRiskHtmlReport(check: Check, analysis: RiskAnalysis): string {
  const kpiHtml = analysis.kpis
    .map(
      (k) => `
    <div class="kpi" style="border-top-color:${TONE_COLORS[k.tone] ?? "#a1a1aa"}">
      <div class="kpi-label">${esc(k.label)}</div>
      <div class="kpi-value">${esc(k.value)}</div>
      ${k.comparison ? `<div class="kpi-comparison">${esc(k.comparison)}</div>` : ""}
    </div>`
    )
    .join("");

  const legendHtml = LEVEL_ORDER.map((level) => {
    const c = LEVEL_COLORS[level];
    return `<div class="legend-item"><span class="dot" style="background:${c.badgeText}"></span>${esc(RISK_CARD_LEVEL_LABELS[level])}</div>`;
  }).join("");

  const statCounts = LEVEL_ORDER.map((level) => ({
    level,
    label: RISK_CARD_LEVEL_LABELS[level],
    count:
      analysis.variances.filter((v) => v.level === level).length +
      analysis.riskItems.filter((r) => r.level === level).length,
  }));
  const totalCards = analysis.variances.length + analysis.riskItems.length;
  const statPillsHtml = [
    `<span class="pill pill-active">Tất cả (${totalCards})</span>`,
    ...statCounts.map((s) => `<span class="pill">${esc(s.label)} (${s.count})</span>`),
  ].join("");

  const varianceCardsHtml = analysis.variances
    .map((v) => {
      const c = LEVEL_COLORS[v.level];
      return `
    <div class="card" style="background:${c.bg};border-color:${c.border}">
      <div class="card-head">
        <span class="card-title">${esc(v.label)}</span>
        <span class="badge" style="background:${c.badge};color:${c.badgeText}">${esc(RISK_CARD_LEVEL_LABELS[v.level])}</span>
      </div>
      <div class="card-value">${fmtNum(v.currentYearValue)} (năm trước: ${fmtNum(v.priorYearValue)})${
        v.percentChange !== null
          ? ` <span class="muted">${v.percentChange > 0 ? "+" : ""}${v.percentChange.toFixed(1)}%</span>`
          : ""
      }</div>
      <div class="card-label">Đánh giá &amp; khuyến nghị</div>
      <p class="card-note">${esc(v.note)}</p>
    </div>`;
    })
    .join("");

  const ratioSectionsHtml = RATIO_CATEGORY_ORDER.map((category) => {
    const ratios = analysis.ratios.filter((r) => r.category === category);
    if (ratios.length === 0) return "";
    const cards = ratios
      .map(
        (r) => `
      <div class="ratio-card">
        <div class="card-label">${esc(r.name)}</div>
        <div class="ratio-value">${fmtRatio(r.currentYearValue, r.unit)}</div>
        <div class="muted">Năm trước: ${fmtRatio(r.priorYearValue, r.unit)}</div>
      </div>`
      )
      .join("");
    return `<div class="ratio-group"><div class="ratio-group-label">${esc(RISK_RATIO_CATEGORY_LABELS[category])}</div><div class="ratio-grid">${cards}</div></div>`;
  }).join("");

  const riskGroupSectionsHtml = RISK_GROUP_ORDER.map((group) => {
    const items = analysis.riskItems.filter((r) => r.group === group);
    if (items.length === 0) return "";
    const cards = items
      .map((item) => {
        const c = LEVEL_COLORS[item.level];
        return `
      <div class="card" style="background:${c.bg};border-color:${c.border}">
        <div class="card-head">
          <span class="card-title">${esc(item.title)}</span>
          <span class="badge" style="background:${c.badge};color:${c.badgeText}">${item.page ? `tr.${item.page} · ` : ""}${esc(RISK_CARD_LEVEL_LABELS[item.level])}</span>
        </div>
        ${item.valueVn ? `<div class="card-value">${esc(item.valueVn)}</div>` : ""}
        ${item.summaryEn ? `<p class="card-en">${esc(item.summaryEn)}</p>` : ""}
        <div class="card-label">Đánh giá &amp; khuyến nghị</div>
        <p class="card-note">${esc(item.assessment)}</p>
      </div>`;
      })
      .join("");
    return `<section class="risk-section"><div class="section-head">${esc(RISK_GROUP_LABELS[group])} (${items.length})</div><div class="card-grid">${cards}</div></section>`;
  }).join("");

  const overallColor = OVERALL_COLORS[analysis.overallRisk.level];

  return `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8" />
<title>Review AFS — Phân tích rủi ro — ${esc(check.clientName)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; background: #fafafa; color: #18181b; margin: 0; padding: 24px; }
  .header { background: #fff; border: 1px solid #e4e4e7; border-radius: 16px; padding: 20px; margin-bottom: 16px; }
  .header h1 { font-size: 18px; margin: 0 0 4px; color: #173164; }
  .header p { margin: 0; font-size: 13px; color: #a1a1aa; }
  .card-outer { background: #fff; border: 1px solid #e4e4e7; border-radius: 16px; padding: 20px; margin-bottom: 16px; }
  .kpi-strip { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px,1fr)); gap: 12px; margin-bottom: 16px; }
  .kpi { background: #fff; border: 1px solid #e4e4e7; border-top: 4px solid #a1a1aa; border-radius: 12px; padding: 12px; }
  .kpi-label { font-size: 12px; color: #71717a; }
  .kpi-value { font-size: 18px; font-weight: 700; color: #27272a; margin-top: 2px; }
  .kpi-comparison { font-size: 12px; color: #71717a; margin-top: 2px; }
  .overall-banner { display: flex; gap: 16px; align-items: center; border-radius: 12px; padding: 16px; margin-bottom: 16px; border: 1px solid; background: ${overallColor.bg}; border-color: ${overallColor.border}; color: ${overallColor.text}; }
  .overall-left { flex-shrink: 0; padding-right: 16px; border-right: 1px solid currentColor; opacity: .95; }
  .overall-label { font-size: 11px; font-weight: 600; text-transform: uppercase; opacity: .7; }
  .overall-level { font-size: 26px; font-weight: 800; }
  .overall-summary { font-size: 13px; }
  .top-summary { font-size: 13px; color: #52525b; margin-bottom: 16px; }
  .legend { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px,1fr)); gap: 8px; background: #fafafa; border: 1px solid #e4e4e7; border-radius: 12px; padding: 12px; margin-bottom: 16px; }
  .legend-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #3f3f46; }
  .dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
  .pills { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
  .pill { background: #f4f4f5; color: #52525b; font-size: 12px; font-weight: 500; padding: 6px 14px; border-radius: 999px; }
  .pill-active { background: #003c76; color: #fff; }
  .section-head { border-left: 4px solid #0093a8; background: #edf1f8; color: #002d59; font-weight: 700; font-size: 12px; padding: 6px 12px; border-radius: 6px; margin: 20px 0 10px; }
  .card-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px,1fr)); gap: 12px; }
  .card { border: 1px solid; border-radius: 12px; padding: 12px; }
  .card-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
  .card-title { font-size: 13px; font-weight: 600; color: #27272a; }
  .badge { font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 999px; white-space: nowrap; }
  .card-value { margin-top: 8px; background: rgba(255,255,255,.6); border-radius: 8px; padding: 8px; font-size: 13px; font-weight: 600; color: #27272a; }
  .card-en { font-size: 11px; font-style: italic; color: #a1a1aa; margin: 6px 0 0; }
  .card-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .03em; color: #0093a8; margin-top: 8px; }
  .card-note { font-size: 12px; color: #52525b; margin: 2px 0 0; }
  .muted { font-size: 11px; color: #a1a1aa; font-weight: 400; }
  .ratio-group { margin-bottom: 14px; }
  .ratio-group-label { font-size: 12px; font-weight: 600; color: #71717a; margin-bottom: 6px; }
  .ratio-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px,1fr)); gap: 10px; }
  .ratio-card { border: 1px solid #e4e4e7; border-radius: 10px; padding: 10px; background: #fff; }
  .ratio-value { font-size: 16px; font-weight: 700; color: #27272a; margin: 2px 0; }
  .footer { text-align: center; font-size: 11px; color: #a1a1aa; margin-top: 16px; }
</style>
</head>
<body>
  <div class="header">
    <h1>Phân tích rủi ro báo cáo tài chính</h1>
    <p>${esc(check.clientName)} · Năm tài chính ${esc(check.fiscalYear)} · ${esc(PERIOD_TYPE_LABELS[check.periodType])}${check.createdBy ? ` · Người kiểm tra: ${esc(check.createdBy)}` : ""} · Xuất lúc ${formatDateTime(new Date().toISOString())}</p>
  </div>

  <div class="card-outer">
    <div class="kpi-strip">${kpiHtml}</div>

    <div class="overall-banner">
      <div class="overall-left">
        <div class="overall-label">Mức rủi ro tổng thể</div>
        <div class="overall-level">${OVERALL_RISK_LABELS[analysis.overallRisk.level]}</div>
      </div>
      <div class="overall-summary">${esc(analysis.overallRisk.summary)}</div>
    </div>

    <p class="top-summary">${esc(analysis.summary)}</p>

    <div class="legend">${legendHtml}</div>

    <div class="pills">${statPillsHtml}</div>

    <div class="section-head">11B.1 — Phân tích biến động ngang (${analysis.variances.length})</div>
    <div class="card-grid">${varianceCardsHtml}</div>

    <div class="section-head">11B.3 — Nhóm chỉ số tài chính</div>
    ${ratioSectionsHtml}

    ${riskGroupSectionsHtml}
  </div>

  <p class="footer">Tạo bởi Review AFS — JPA Vietvalues, theo Master Prompt v6.6 (chế độ phan_tich_rui_ro)</p>
</body>
</html>`;
}
