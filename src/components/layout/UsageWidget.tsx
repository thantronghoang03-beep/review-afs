"use client";

import { useEffect, useState } from "react";

interface UsageData {
  packageName: string;
  used: number;
  limit: number;
  percent: number;
}

export function UsageWidget() {
  const [usage, setUsage] = useState<UsageData | null>(null);

  useEffect(() => {
    fetch("/api/usage")
      .then((res) => res.json())
      .then(setUsage)
      .catch(() => setUsage(null));
  }, []);

  return (
    <div className="mx-3 mb-4 rounded-xl border border-zinc-200 bg-zinc-50 p-3.5">
      <div className="text-xs text-zinc-500">Gói dịch vụ:</div>
      <div className="text-sm font-semibold text-blue-700">{usage?.packageName ?? "—"}</div>
      <div className="mt-1 text-[11px] text-zinc-400">Hạn sử dụng: 31/12/2025</div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-500">
        <div className="h-1.5 grow overflow-hidden rounded-full bg-zinc-200">
          <div
            className="h-full rounded-full bg-blue-600"
            style={{ width: `${usage?.percent ?? 0}%` }}
          />
        </div>
        <span className="ml-2 shrink-0">{usage?.percent ?? 0}%</span>
      </div>

      <a
        href="/settings"
        className="mt-3 block w-full rounded-lg border border-blue-200 bg-white py-1.5 text-center text-xs font-medium text-blue-700 hover:bg-blue-50"
      >
        Nâng cấp gói
      </a>
    </div>
  );
}
