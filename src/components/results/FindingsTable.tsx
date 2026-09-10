"use client";

import { Fragment, useMemo, useState } from "react";
import type { Finding, FindingStatus } from "@/types/finding";
import { CATEGORY_LABELS, GROUP_LABELS, GROUP_ORDER, normalizeFindingGroup, normalizeFindingStatus } from "@/types/finding";
import { StatusBadge } from "@/components/ui/Badge";

const FILTERS: Array<{ key: "all" | FindingStatus; label: string }> = [
  { key: "all", label: "Tất cả" },
  { key: "pass", label: "Pass" },
  { key: "error", label: "Error" },
  { key: "warning", label: "Warning" },
  { key: "missing_in_en", label: "Missing in EN" },
  { key: "needs_supplementing", label: "Cần bổ sung" },
  { key: "critical", label: "Critical" },
];

function pageLabel(f: Finding): string {
  if (f.pageVn && f.pageEn) return f.pageVn === f.pageEn ? `tr.${f.pageVn}` : `VN tr.${f.pageVn} / EN tr.${f.pageEn}`;
  if (f.pageVn) return `VN tr.${f.pageVn}`;
  if (f.pageEn) return `EN tr.${f.pageEn}`;
  return "—";
}

export function FindingsTable({ findings }: { findings: Finding[] }) {
  const [filter, setFilter] = useState<"all" | FindingStatus>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return findings.filter((f) => {
      if (filter !== "all" && normalizeFindingStatus(f.status) !== filter) return false;
      if (!q) return true;
      return (
        f.fieldLabel.toLowerCase().includes(q) ||
        pageLabel(f).toLowerCase().includes(q) ||
        (f.note ?? "").toLowerCase().includes(q) ||
        (f.contentVn ?? "").toLowerCase().includes(q) ||
        (f.contentEn ?? "").toLowerCase().includes(q)
      );
    });
  }, [findings, filter, search]);

  // Mục 14 điểm 6 — bảng chi tiết nhóm theo đúng 17 mục, theo đúng thứ tự đó; chỉ hiện
  // các nhóm thực sự có dữ liệu.
  const groups = useMemo(() => {
    return GROUP_ORDER.map((group) => ({
      group,
      label: GROUP_LABELS[group],
      items: filtered.filter((f) => normalizeFindingGroup(f.group) === group),
    })).filter((g) => g.items.length > 0);
  }, [filtered]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => {
          const count =
            f.key === "all" ? findings.length : findings.filter((x) => normalizeFindingStatus(x.status) === f.key).length;
          const isActive = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive ? "bg-jpa-600 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {f.label} ({count})
            </button>
          );
        })}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo mục / trang / ghi chú..."
          className="ml-auto w-full max-w-xs rounded-full border border-zinc-200 px-3.5 py-1.5 text-xs focus:border-jpa-400 focus:outline-none"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="bg-jpa-700 text-xs font-medium uppercase tracking-wide text-white">
              <th className="px-3 py-2.5">Mục kiểm tra</th>
              <th className="px-3 py-2.5">Trang</th>
              <th className="px-3 py-2.5">Nội dung VN</th>
              <th className="px-3 py-2.5">Nội dung EN</th>
              <th className="px-3 py-2.5">Trạng thái</th>
              <th className="px-3 py-2.5">Nguyên nhân &amp; đề xuất xử lý</th>
            </tr>
          </thead>
          <tbody>
            {groups.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-zinc-400">
                  Không có mục nào khớp.
                </td>
              </tr>
            )}
            {groups.map((g) => (
              <Fragment key={g.group}>
                <tr>
                  <td colSpan={6} className="bg-jpa-50 px-3 py-2 text-xs font-bold text-jpa-700">
                    {g.label}
                  </td>
                </tr>
                {g.items.map((f) => (
                  <tr key={f.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
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
                    <td className="max-w-[260px] px-3 py-2.5 text-zinc-600">{f.note ?? "—"}</td>
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
