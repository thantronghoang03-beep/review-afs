"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { Finding, FindingCategory } from "@/types/finding";
import { CATEGORY_LABELS } from "@/types/finding";

const CATEGORY_COLORS: Record<FindingCategory, string> = {
  so_lieu: "#ef4444",
  chinh_ta: "#f97316",
  format: "#eab308",
  erc_irc: "#8b5cf6",
  khac: "#3b82f6",
};

export function ErrorDonutChart({ findings }: { findings: Finding[] }) {
  const errors = findings.filter((f) => f.status !== "match");
  const total = errors.length;

  const byCategory = (Object.keys(CATEGORY_LABELS) as FindingCategory[])
    .map((cat) => ({
      key: cat,
      name: CATEGORY_LABELS[cat],
      value: errors.filter((f) => f.category === cat).length,
      color: CATEGORY_COLORS[cat],
    }))
    .filter((c) => c.value > 0);

  if (total === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-zinc-400">
        Không có lỗi nào được phát hiện.
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-56 w-56 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={byCategory}
              dataKey="value"
              nameKey="name"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={2}
            >
              {byCategory.map((c) => (
                <Cell key={c.key} fill={c.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-zinc-800">{total}</span>
          <span className="text-xs text-zinc-400">Tổng lỗi</span>
        </div>
      </div>
      <div className="space-y-2">
        {byCategory.map((c) => (
          <div key={c.key} className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
            <span className="text-zinc-600">{c.name}</span>
            <span className="font-medium text-zinc-800">
              {Math.round((c.value / total) * 100)}% ({c.value})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
