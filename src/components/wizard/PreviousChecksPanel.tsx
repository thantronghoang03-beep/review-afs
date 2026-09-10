"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { CheckListItem, CheckStatus } from "@/types/check";
import { formatDateTime } from "@/lib/format/date";
import { ChevronRightIcon, ClockIcon } from "@/components/ui/icons";

const STATUS_STYLES: Record<CheckStatus, string> = {
  processing: "bg-blue-50 text-blue-600",
  done: "bg-green-50 text-green-600",
  error: "bg-red-50 text-red-600",
};
const STATUS_LABELS: Record<CheckStatus, string> = {
  processing: "Đang xử lý",
  done: "Đã hoàn thành",
  error: "Lỗi",
};

interface PreviousChecksPanelProps {
  companyId: string;
  companyName: string;
}

export function PreviousChecksPanel({ companyId, companyName }: PreviousChecksPanelProps) {
  const [checks, setChecks] = useState<CheckListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    function loadChecks() {
      setLoading(true);
      fetch(`/api/checks?companyId=${encodeURIComponent(companyId)}`)
        .then((res) => res.json())
        .then((data) => {
          if (!cancelled) setChecks((data.checks ?? []).slice(0, 5));
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }
    loadChecks();
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
      <h3 className="mb-1 text-sm font-bold text-jpa-700">3. LỊCH SỬ KIỂM TRA TRƯỚC ĐÓ</h3>
      <p className="mb-4 text-xs text-zinc-400">
        Danh sách các lần kiểm tra đã thực hiện trước đây cho {companyName}.
      </p>

      {loading ? (
        <div className="py-6 text-center text-sm text-zinc-400">Đang tải...</div>
      ) : checks.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center text-zinc-400">
          <ClockIcon size={22} />
          <p className="text-sm">Chưa có lượt kiểm tra nào cho công ty này.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-xs text-zinc-500">
                <th className="py-2 pr-2">Thời gian kiểm tra</th>
                <th className="py-2 pr-2">Người kiểm tra</th>
                <th className="py-2 pr-2">Kết quả</th>
                <th className="py-2 pr-2">Ghi chú</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {checks.map((c) => (
                <tr key={c.id} className="border-b border-zinc-50 last:border-0">
                  <td className="py-2.5 pr-2 whitespace-nowrap text-zinc-600">{formatDateTime(c.createdAt)}</td>
                  <td className="py-2.5 pr-2 text-zinc-600">{c.createdBy ?? "—"}</td>
                  <td className="py-2.5 pr-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[c.status]}`}>
                      {STATUS_LABELS[c.status]}
                    </span>
                  </td>
                  <td className="py-2.5 pr-2 text-zinc-500">Kiểm tra BCTC {c.fiscalYear}</td>
                  <td className="py-2.5 text-right">
                    <Link href={`/checks/${c.id}`} className="text-zinc-400 hover:text-jpa-600">
                      <ChevronRightIcon size={16} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
