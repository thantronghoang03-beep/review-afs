"use client";

import { useMemo, useState } from "react";
import type { RiskAnalysis, RiskCardLevel, RiskRatioCategory } from "@/types/risk";
import {
  RISK_CARD_LEVEL_LABELS,
  RISK_RATIO_CATEGORY_LABELS,
  RISK_GROUP_LABELS,
  RISK_GROUP_ORDER,
  OVERALL_RISK_LABELS,
} from "@/types/risk";

// Master Prompt v6.6 — Mục 14B: dashboard dạng thẻ (card-based), KHÔNG dùng <table>,
// KHÔNG tách cột VN/EN song song — số liệu VN là khối chính, EN chỉ là 1 dòng tóm tắt
// phụ nhỏ bên dưới. Thứ tự bắt buộc: KPI hero strip → banner rủi ro tổng thể → legend
// rút gọn (4 mức) → stat pills/filter → lưới thẻ theo 11B.1 → 11B.3 → 11C.1..11C.5.

const LEVEL_ORDER: RiskCardLevel[] = ["pass", "warning", "error", "critical"];

const LEVEL_CARD_STYLES: Record<RiskCardLevel, string> = {
  pass: "border-green-200 bg-green-50",
  warning: "border-yellow-200 bg-yellow-50",
  error: "border-red-200 bg-red-50",
  critical: "border-purple-300 bg-purple-50",
};

const LEVEL_BADGE_STYLES: Record<RiskCardLevel, string> = {
  pass: "bg-green-100 text-green-700",
  warning: "bg-yellow-100 text-yellow-700",
  error: "bg-red-100 text-red-700",
  critical: "bg-purple-200 text-purple-900",
};

const KPI_TONE_STYLES: Record<string, string> = {
  good: "border-t-green-500 text-green-600",
  warn: "border-t-yellow-500 text-yellow-600",
  bad: "border-t-red-500 text-red-600",
};

const OVERALL_RISK_STYLES: Record<string, string> = {
  low: "bg-green-50 border-green-200 text-green-700",
  medium: "bg-yellow-50 border-yellow-200 text-yellow-700",
  high: "bg-red-50 border-red-200 text-red-700",
};

const RATIO_CATEGORY_ORDER: RiskRatioCategory[] = ["thanh_khoan", "don_bay", "sinh_loi", "hieu_qua_hoat_dong"];

function formatRatioValue(value: number | null, unit: string): string {
  if (value === null) return "—";
  const formatted = Number.isInteger(value) ? value.toString() : value.toFixed(2);
  return `${formatted}${unit === "%" ? "%" : ` ${unit}`}`;
}

function formatVarianceValue(value: number | null): string {
  if (value === null) return "—";
  return value.toLocaleString("vi-VN");
}

interface RiskAnalysisSectionProps {
  analysis: RiskAnalysis;
  businessDescription?: string | null;
}

export function RiskAnalysisSection({ analysis, businessDescription }: RiskAnalysisSectionProps) {
  const [levelFilter, setLevelFilter] = useState<"all" | RiskCardLevel>("all");
  const [search, setSearch] = useState("");

  const filteredVariances = useMemo(() => {
    const q = search.trim().toLowerCase();
    return analysis.variances.filter((v) => {
      if (levelFilter !== "all" && v.level !== levelFilter) return false;
      if (!q) return true;
      return v.label.toLowerCase().includes(q) || v.note.toLowerCase().includes(q);
    });
  }, [analysis.variances, levelFilter, search]);

  const filteredRiskItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return analysis.riskItems.filter((r) => {
      if (levelFilter !== "all" && r.level !== levelFilter) return false;
      if (!q) return true;
      return (
        r.title.toLowerCase().includes(q) ||
        r.assessment.toLowerCase().includes(q) ||
        (r.valueVn ?? "").toLowerCase().includes(q)
      );
    });
  }, [analysis.riskItems, levelFilter, search]);

  const ratiosByCategory = RATIO_CATEGORY_ORDER.map((category) => ({
    category,
    label: RISK_RATIO_CATEGORY_LABELS[category],
    ratios: analysis.ratios.filter((r) => r.category === category),
  })).filter((g) => g.ratios.length > 0);

  const riskItemsByGroup = RISK_GROUP_ORDER.map((group) => ({
    group,
    label: RISK_GROUP_LABELS[group],
    items: filteredRiskItems.filter((r) => r.group === group),
  }));

  const stats = LEVEL_ORDER.map((level) => ({
    level,
    label: RISK_CARD_LEVEL_LABELS[level],
    count:
      analysis.variances.filter((v) => v.level === level).length +
      analysis.riskItems.filter((r) => r.level === level).length,
  }));
  const totalCards = analysis.variances.length + analysis.riskItems.length;

  return (
    <div className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-5">
      <h4 className="text-sm font-bold text-zinc-800">Phân tích rủi ro báo cáo tài chính</h4>

      {businessDescription && (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600">
          <div className="mb-1 font-semibold text-zinc-500">Mô tả hoạt động công ty (do người dùng cung cấp)</div>
          {businessDescription}
        </div>
      )}

      {/* 2. Dải thẻ KPI (KPI hero strip) */}
      {analysis.kpis.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {analysis.kpis.map((kpi, i) => (
            <div
              key={i}
              className={`rounded-xl border border-t-4 border-zinc-200 bg-white p-3 ${KPI_TONE_STYLES[kpi.tone] ?? ""}`}
            >
              <div className="text-xs font-medium text-zinc-500">{kpi.label}</div>
              <div className="mt-1 text-lg font-bold text-zinc-800">{kpi.value}</div>
              {kpi.comparison && <div className="mt-0.5 text-xs text-zinc-500">{kpi.comparison}</div>}
            </div>
          ))}
        </div>
      )}

      {/* 3. Banner rủi ro tổng thể (Mục 11C.6) */}
      <div className={`flex flex-col gap-2 rounded-xl border p-4 sm:flex-row sm:items-center ${OVERALL_RISK_STYLES[analysis.overallRisk.level]}`}>
        <div className="shrink-0 text-center sm:border-r sm:border-current/20 sm:pr-4 sm:text-left">
          <div className="text-[11px] font-semibold uppercase tracking-wide opacity-70">Mức rủi ro tổng thể</div>
          <div className="text-2xl font-extrabold">{OVERALL_RISK_LABELS[analysis.overallRisk.level]}</div>
        </div>
        <p className="text-sm">{analysis.overallRisk.summary}</p>
      </div>

      {analysis.summary && <p className="text-sm text-zinc-600">{analysis.summary}</p>}

      {/* 4. Legend rút gọn — chỉ 4 mức áp dụng cho phân tích rủi ro */}
      <div className="grid grid-cols-2 gap-3 rounded-xl border border-zinc-200 bg-zinc-50/60 p-3 sm:grid-cols-4">
        {LEVEL_ORDER.map((level) => (
          <div key={level} className="flex items-center gap-2 text-xs">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${LEVEL_BADGE_STYLES[level]}`} />
            <span className="font-medium text-zinc-700">{RISK_CARD_LEVEL_LABELS[level]}</span>
          </div>
        ))}
      </div>

      {/* 5. Stat pills + filter toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setLevelFilter("all")}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            levelFilter === "all" ? "bg-jpa-600 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          Tất cả ({totalCards})
        </button>
        {stats.map((s) => (
          <button
            key={s.level}
            onClick={() => setLevelFilter(s.level)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              levelFilter === s.level ? "bg-jpa-600 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            {s.label} ({s.count})
          </button>
        ))}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo nội dung thẻ..."
          className="ml-auto w-full max-w-xs rounded-full border border-zinc-200 px-3.5 py-1.5 text-xs focus:border-jpa-400 focus:outline-none"
        />
      </div>

      {/* 6. Lưới thẻ — 11B.1 biến động ngang */}
      {filteredVariances.length > 0 && (
        <section>
          <div className="mb-2 rounded-lg border-l-4 border-jpa-teal bg-jpa-50 px-3 py-1.5 text-xs font-bold text-jpa-700">
            11B.1 — Phân tích biến động ngang ({filteredVariances.length})
          </div>
          <div className="grid grid-cols-1 gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
            {filteredVariances.map((v, i) => (
              <div key={i} className={`rounded-xl border p-3 ${LEVEL_CARD_STYLES[v.level]}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-zinc-800">{v.label}</span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${LEVEL_BADGE_STYLES[v.level]}`}>
                    {RISK_CARD_LEVEL_LABELS[v.level]}
                  </span>
                </div>
                <div className="mt-1.5 rounded-lg bg-white/60 p-2 text-sm font-medium text-zinc-800">
                  {formatVarianceValue(v.currentYearValue)} (năm trước: {formatVarianceValue(v.priorYearValue)})
                  {v.percentChange !== null && (
                    <span className="ml-2 text-xs font-normal text-zinc-500">
                      {v.percentChange > 0 ? "+" : ""}
                      {v.percentChange.toFixed(1)}%
                    </span>
                  )}
                </div>
                <div className="mt-1.5 text-xs font-semibold uppercase tracking-wide text-jpa-teal">
                  Đánh giá &amp; khuyến nghị
                </div>
                <p className="text-xs text-zinc-600">{v.note}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 6. Lưới thẻ — 11B.3 nhóm chỉ số tài chính (thẻ tham khảo, không gắn mức rủi ro) */}
      {ratiosByCategory.length > 0 && (
        <section>
          <div className="mb-2 rounded-lg border-l-4 border-jpa-teal bg-jpa-50 px-3 py-1.5 text-xs font-bold text-jpa-700">
            11B.3 — Nhóm chỉ số tài chính
          </div>
          {ratiosByCategory.map((group) => (
            <div key={group.category} className="mb-3">
              <div className="mb-1.5 text-xs font-semibold text-zinc-500">{group.label}</div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {group.ratios.map((r, i) => (
                  <div key={i} className="rounded-xl border border-zinc-200 bg-white p-3">
                    <div className="text-xs font-medium text-zinc-500">{r.name}</div>
                    <div className="mt-1 text-base font-bold text-zinc-800">
                      {formatRatioValue(r.currentYearValue, r.unit)}
                    </div>
                    <div className="text-xs text-zinc-400">
                      Năm trước: {formatRatioValue(r.priorYearValue, r.unit)}
                    </div>
                    {r.note && <p className="mt-1 text-xs text-zinc-500">{r.note}</p>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* 6. Lưới thẻ — 11C.1..11C.5 đánh giá rủi ro */}
      {riskItemsByGroup.map(
        (group) =>
          group.items.length > 0 && (
            <section key={group.group}>
              <div className="mb-2 rounded-lg border-l-4 border-jpa-teal bg-jpa-50 px-3 py-1.5 text-xs font-bold text-jpa-700">
                {group.label} ({group.items.length})
              </div>
              <div className="grid grid-cols-1 gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))" }}>
                {group.items.map((item, i) => (
                  <div key={i} className={`rounded-xl border p-3 ${LEVEL_CARD_STYLES[item.level]}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-zinc-800">{item.title}</span>
                      <div className="flex shrink-0 items-center gap-1.5">
                        {item.page && <span className="text-[11px] text-zinc-500">tr.{item.page}</span>}
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${LEVEL_BADGE_STYLES[item.level]}`}>
                          {RISK_CARD_LEVEL_LABELS[item.level]}
                        </span>
                      </div>
                    </div>
                    {item.valueVn && (
                      <div className="mt-1.5 rounded-lg bg-white/60 p-2 text-sm font-medium text-zinc-800">
                        {item.valueVn}
                      </div>
                    )}
                    {item.summaryEn && <p className="mt-1 text-xs italic text-zinc-400">{item.summaryEn}</p>}
                    <div className="mt-1.5 text-xs font-semibold uppercase tracking-wide text-jpa-teal">
                      Đánh giá &amp; khuyến nghị
                    </div>
                    <p className="text-xs text-zinc-600">{item.assessment}</p>
                  </div>
                ))}
              </div>
            </section>
          )
      )}
    </div>
  );
}
