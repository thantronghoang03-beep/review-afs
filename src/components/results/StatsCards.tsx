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

const STATUS_TONE: Record<FindingStatus, string> = {
  pass: "bg-green-50 text-green-700",
  error: "bg-red-50 text-red-700",
  warning: "bg-yellow-50 text-yellow-700",
  missing_in_en: "bg-blue-50 text-blue-700",
  needs_supplementing: "bg-orange-50 text-orange-700",
  critical: "bg-purple-100 text-purple-900",
};

export function StatsCards({ findings }: { findings: Finding[] }) {
  const countsByStatus = STATUS_ORDER.map((status) => ({
    status,
    label: STATUS_LABELS[status],
    value: findings.filter((f) => normalizeFindingStatus(f.status) === status).length,
  }));

  const cards = [
    { label: "Tổng", value: findings.length, tone: "bg-zinc-100 text-zinc-700" },
    ...countsByStatus.map((c) => ({ label: c.label, value: c.value, tone: STATUS_TONE[c.status] })),
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
      {cards.map((card) => (
        <div key={card.label} className={`rounded-xl p-4 ${card.tone}`}>
          <div className="text-xs font-medium opacity-80">{card.label}</div>
          <div className="mt-1 text-2xl font-bold">{card.value}</div>
        </div>
      ))}
    </div>
  );
}
