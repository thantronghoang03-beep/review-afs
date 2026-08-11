"use client";

import { useState } from "react";
import type { Finding, FindingStatus } from "@/types/finding";
import { SEVERITY_LABELS, CATEGORY_LABELS } from "@/types/finding";
import { StatusBadge } from "@/components/ui/Badge";

const FILTERS: Array<{ key: "all" | FindingStatus; label: string }> = [
  { key: "all", label: "Tất cả" },
  { key: "match", label: "Match" },
  { key: "difference", label: "Difference" },
  { key: "warning", label: "Warning" },
  { key: "missing_in_en", label: "Missing in EN" },
  { key: "needs_supplementing", label: "Cần bổ sung" },
];

function pageLabel(f: Finding): string {
  if (f.pageVn && f.pageEn) return f.pageVn === f.pageEn ? `tr.${f.pageVn}` : `VN tr.${f.pageVn} / EN tr.${f.pageEn}`;
  if (f.pageVn) return `VN tr.${f.pageVn}`;
  if (f.pageEn) return `EN tr.${f.pageEn}`;
  return "—";
}

export function FindingsTable({ findings }: { findings: Finding[] }) {
  const [filter, setFilter] = useState<"all" | FindingStatus>("all");

  const filtered = filter === "all" ? findings : findings.filter((f) => f.status === filter);

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const count = f.key === "all" ? findings.length : findings.filter((x) => x.status === f.key).length;
          const isActive = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive ? "bg-blue-600 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {f.label} ({count})
            </button>
          );
        })}
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-xs text-zinc-500">
              <th className="px-3 py-2.5">STT</th>
              <th className="px-3 py-2.5">Mục kiểm tra</th>
              <th className="px-3 py-2.5">Trang</th>
              <th className="px-3 py-2.5">Nội dung VN</th>
              <th className="px-3 py-2.5">Nội dung EN</th>
              <th className="px-3 py-2.5">Trạng thái</th>
              <th className="px-3 py-2.5">Mức độ</th>
              <th className="px-3 py-2.5">Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-zinc-400">
                  Không có mục nào.
                </td>
              </tr>
            )}
            {filtered.map((f, i) => (
              <tr key={f.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                <td className="px-3 py-2.5 text-zinc-400">{i + 1}</td>
                <td className="px-3 py-2.5">
                  <div className="font-medium text-zinc-800">{f.fieldLabel}</div>
                  <div className="text-xs text-zinc-400">
                    {f.section} · {CATEGORY_LABELS[f.category]}
                  </div>
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap text-zinc-500">{pageLabel(f)}</td>
                <td className="max-w-[220px] px-3 py-2.5 text-zinc-600">{f.contentVn ?? "—"}</td>
                <td className="max-w-[220px] px-3 py-2.5 text-zinc-600">{f.contentEn ?? "—"}</td>
                <td className="px-3 py-2.5">
                  <StatusBadge status={f.status} />
                </td>
                <td className="px-3 py-2.5 text-zinc-500">{f.severity ? SEVERITY_LABELS[f.severity] : "—"}</td>
                <td className="max-w-[260px] px-3 py-2.5 text-zinc-600">{f.note ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
