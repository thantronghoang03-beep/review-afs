import { Fragment } from "react";
import type { RiskAnalysis, RiskRatioCategory } from "@/types/risk";
import { RISK_RATIO_CATEGORY_LABELS, RISK_LEVEL_LABELS } from "@/types/risk";

const RATIO_CATEGORY_ORDER: RiskRatioCategory[] = ["thanh_khoan", "don_bay", "sinh_loi", "hieu_qua_hoat_dong"];

const LEVEL_STYLES: Record<string, string> = {
  low: "border-green-200 bg-green-50 text-green-700",
  medium: "border-yellow-200 bg-yellow-50 text-yellow-700",
  high: "border-red-200 bg-red-50 text-red-700",
};

function formatValue(value: number | null, unit: string): string {
  if (value === null) return "—";
  const formatted = Number.isInteger(value) ? value.toString() : value.toFixed(2);
  return `${formatted}${unit === "%" ? "%" : ` ${unit}`}`;
}

interface RiskAnalysisSectionProps {
  analysis: RiskAnalysis;
  businessDescription?: string | null;
}

export function RiskAnalysisSection({ analysis, businessDescription }: RiskAnalysisSectionProps) {
  const ratiosByCategory = RATIO_CATEGORY_ORDER.map((category) => ({
    category,
    label: RISK_RATIO_CATEGORY_LABELS[category],
    ratios: analysis.ratios.filter((r) => r.category === category),
  })).filter((g) => g.ratios.length > 0);

  return (
    <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5">
      <h4 className="text-sm font-bold text-zinc-800">Phân tích rủi ro báo cáo tài chính</h4>

      {businessDescription && (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600">
          <div className="mb-1 font-semibold text-zinc-500">Mô tả hoạt động công ty (do người dùng cung cấp)</div>
          {businessDescription}
        </div>
      )}

      {analysis.summary && (
        <div className="rounded-xl border border-jpa-teal/30 bg-jpa-teal/10 p-4 text-sm text-jpa-700">
          {analysis.summary}
        </div>
      )}

      {ratiosByCategory.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-zinc-200">
          <table className="w-full min-w-[500px] text-left text-sm">
            <thead>
              <tr className="bg-jpa-700 text-xs font-medium uppercase tracking-wide text-white">
                <th className="px-3 py-2.5">Chỉ số</th>
                <th className="px-3 py-2.5">Năm nay</th>
                <th className="px-3 py-2.5">Năm trước</th>
                <th className="px-3 py-2.5">Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {ratiosByCategory.map((group) => (
                <Fragment key={group.category}>
                  <tr>
                    <td colSpan={4} className="bg-jpa-50 px-3 py-2 text-xs font-bold text-jpa-700">
                      {group.label}
                    </td>
                  </tr>
                  {group.ratios.map((r, i) => (
                    <tr key={`${group.category}-${i}`} className="border-b border-zinc-100 last:border-0">
                      <td className="px-3 py-2.5 font-medium text-zinc-800">{r.name}</td>
                      <td className="px-3 py-2.5 text-zinc-700">{formatValue(r.currentYearValue, r.unit)}</td>
                      <td className="px-3 py-2.5 text-zinc-500">{formatValue(r.priorYearValue, r.unit)}</td>
                      <td className="px-3 py-2.5 text-zinc-500">{r.note ?? "—"}</td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {analysis.warnings.length > 0 ? (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-zinc-600">Cảnh báo rủi ro</div>
          {analysis.warnings.map((w, i) => (
            <div key={i} className={`rounded-xl border p-3 text-sm ${LEVEL_STYLES[w.level]}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold">{w.title}</span>
                <span className="shrink-0 rounded-full bg-white/60 px-2 py-0.5 text-[11px] font-medium">
                  {RISK_LEVEL_LABELS[w.level]}
                </span>
              </div>
              <p className="mt-1">{w.description}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-zinc-400">Không phát hiện cảnh báo rủi ro đáng chú ý.</p>
      )}
    </div>
  );
}
