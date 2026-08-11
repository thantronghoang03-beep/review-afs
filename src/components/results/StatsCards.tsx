import type { Finding } from "@/types/finding";

export function StatsCards({ findings }: { findings: Finding[] }) {
  const errors = findings.filter((f) => f.status !== "match");
  const critical = errors.filter((f) => f.severity === "critical").length;
  const medium = errors.filter((f) => f.severity === "medium").length;
  const minor = errors.filter((f) => f.severity === "minor").length;

  const cards = [
    { label: "Tổng số lỗi", value: errors.length, tone: "bg-red-50 text-red-700" },
    { label: "Lỗi nghiêm trọng", value: critical, tone: "bg-orange-50 text-orange-700" },
    { label: "Lỗi trung bình", value: medium, tone: "bg-yellow-50 text-yellow-700" },
    { label: "Lỗi nhẹ", value: minor, tone: "bg-blue-50 text-blue-700" },
    { label: "Đã kiểm tra", value: findings.length, sub: "hạng mục", tone: "bg-green-50 text-green-700" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((card) => (
        <div key={card.label} className={`rounded-xl p-4 ${card.tone}`}>
          <div className="text-xs font-medium opacity-80">{card.label}</div>
          <div className="mt-1 text-2xl font-bold">{card.value}</div>
          {card.sub && <div className="text-[11px] opacity-70">{card.sub}</div>}
        </div>
      ))}
    </div>
  );
}
