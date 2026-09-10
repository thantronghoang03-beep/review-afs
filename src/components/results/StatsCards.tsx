import type { Finding, FindingStatus } from "@/types/finding";
import { STATUS_LABELS, normalizeFindingStatus } from "@/types/finding";

// Mục 14 (Master Prompt v6.1), điểm 3 — Stats row bắt buộc đủ: Tổng / Pass / Error /
// Warning / Missing in EN / Cần bổ sung / Critical.
const STATUS_ORDER: FindingStatus[] = [
  "pass",
  "error",
  "warning",
  "missing_in_en",
  "needs_supplementing",
  "critical",
];

const STATUS_BORDER: Record<FindingStatus, string> = {
  pass: "border-t-green-500",
  error: "border-t-red-500",
  warning: "border-t-yellow-500",
  missing_in_en: "border-t-blue-500",
  needs_supplementing: "border-t-orange-500",
  critical: "border-t-purple-700",
};

const STATUS_TEXT: Record<FindingStatus, string> = {
  pass: "text-green-600",
  error: "text-red-600",
  warning: "text-yellow-600",
  missing_in_en: "text-blue-600",
  needs_supplementing: "text-orange-600",
  critical: "text-purple-700",
};

export function StatsCards({ findings }: { findings: Finding[] }) {
  const cards = [
    { label: "Tổng số mục", value: findings.length, border: "border-t-zinc-400", text: "text-zinc-700" },
    ...STATUS_ORDER.map((status) => ({
      label: STATUS_LABELS[status],
      value: findings.filter((f) => normalizeFindingStatus(f.status) === status).length,
      border: STATUS_BORDER[status],
      text: STATUS_TEXT[status],
    })),
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
      {cards.map((card) => (
        <div key={card.label} className={`rounded-xl border border-t-4 border-zinc-200 bg-white p-4 ${card.border}`}>
          <div className={`text-2xl font-bold ${card.text}`}>{card.value}</div>
          <div className="mt-1 text-xs font-medium text-zinc-500">{card.label}</div>
        </div>
      ))}
    </div>
  );
}
