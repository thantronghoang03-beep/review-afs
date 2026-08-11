"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PERIOD_TYPE_LABELS } from "@/types/check";
import type { CheckListItem, CheckStatus, PeriodType } from "@/types/check";
import { DeleteCheckButton } from "@/components/history/DeleteCheckButton";
import { ClockIcon, EyeIcon } from "@/components/ui/icons";
import { formatDateTime } from "@/lib/format/date";
import { useCompany } from "@/lib/context/CompanyContext";
import { useAuth } from "@/lib/context/AuthContext";

const STATUS_STYLES: Record<CheckStatus, string> = {
  processing: "bg-blue-50 text-blue-600",
  done: "bg-green-50 text-green-600",
  error: "bg-red-50 text-red-600",
};
const STATUS_LABELS: Record<CheckStatus, string> = {
  processing: "Đang xử lý",
  done: "Hoàn tất",
  error: "Lỗi",
};

export default function HistoryPage() {
  const { selectedCompanyId, selectedCompany } = useCompany();
  const { user } = useAuth();

  const [checks, setChecks] = useState<CheckListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState<CheckStatus | "all">("all");
  const [periodTypeFilter, setPeriodTypeFilter] = useState<PeriodType | "all">("all");
  const [reviewerFilter, setReviewerFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    let cancelled = false;
    function loadChecks() {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCompanyId) params.set("companyId", selectedCompanyId);
      fetch(`/api/checks?${params.toString()}`)
        .then((res) => res.json())
        // Guard against out-of-order responses: if selectedCompanyId changes again before
        // this request resolves, an earlier (unfiltered) response could otherwise overwrite
        // the correctly filtered result that arrived first.
        .then((data) => {
          if (!cancelled) setChecks(data.checks ?? []);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }
    loadChecks();
    return () => {
      cancelled = true;
    };
  }, [selectedCompanyId]);

  const reviewers = useMemo(
    () => Array.from(new Set(checks.map((c) => c.createdBy).filter((v): v is string => Boolean(v)))).sort(),
    [checks]
  );

  const filtered = useMemo(() => {
    return checks.filter((c) => {
      if (user?.role === "employee" && c.createdBy && c.createdBy !== user.name) return false;
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (periodTypeFilter !== "all" && c.periodType !== periodTypeFilter) return false;
      if (reviewerFilter !== "all" && c.createdBy !== reviewerFilter) return false;
      if (dateFrom && c.createdAt < dateFrom) return false;
      if (dateTo && c.createdAt > `${dateTo}T23:59:59.999Z`) return false;
      return true;
    });
  }, [checks, statusFilter, periodTypeFilter, reviewerFilter, dateFrom, dateTo, user]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Lịch sử kiểm tra</h1>
        <p className="text-sm text-zinc-400">
          {selectedCompany ? `Công ty: ${selectedCompany.name}` : "Toàn bộ các lượt kiểm tra báo cáo kiểm toán đã thực hiện"}
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-2xl border border-zinc-200 bg-white p-4">
        <div>
          <label className="mb-1 block text-xs text-zinc-500">Trạng thái</label>
          <select
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as CheckStatus | "all")}
          >
            <option value="all">Tất cả</option>
            <option value="processing">Đang xử lý</option>
            <option value="done">Hoàn tất</option>
            <option value="error">Lỗi</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs text-zinc-500">Loại kỳ</label>
          <select
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm"
            value={periodTypeFilter}
            onChange={(e) => setPeriodTypeFilter(e.target.value as PeriodType | "all")}
          >
            <option value="all">Tất cả</option>
            {Object.entries(PERIOD_TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {user?.role === "manager" && (
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Người kiểm tra</label>
            <select
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm"
              value={reviewerFilter}
              onChange={(e) => setReviewerFilter(e.target.value)}
            >
              <option value="all">Tất cả</option>
              {reviewers.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="mb-1 block text-xs text-zinc-500">Từ ngày</label>
          <input
            type="date"
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-zinc-500">Đến ngày</label>
          <input
            type="date"
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>

        {(statusFilter !== "all" || periodTypeFilter !== "all" || reviewerFilter !== "all" || dateFrom || dateTo) && (
          <button
            onClick={() => {
              setStatusFilter("all");
              setPeriodTypeFilter("all");
              setReviewerFilter("all");
              setDateFrom("");
              setDateTo("");
            }}
            className="text-xs font-medium text-blue-600 hover:underline"
          >
            Xóa lọc
          </button>
        )}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white">
        {loading ? (
          <div className="py-16 text-center text-sm text-zinc-400">Đang tải...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center text-zinc-400">
            <ClockIcon size={28} />
            <p className="text-sm">Không có kiểm tra nào khớp với bộ lọc.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-xs text-zinc-500">
                  <th className="px-4 py-3">Khách hàng</th>
                  <th className="px-4 py-3">Người kiểm tra</th>
                  <th className="px-4 py-3">Năm tài chính</th>
                  <th className="px-4 py-3">Loại kỳ</th>
                  <th className="px-4 py-3">Ngày tạo</th>
                  <th className="px-4 py-3">Tổng lỗi</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                    <td className="px-4 py-3 font-medium text-zinc-800">{c.clientName}</td>
                    <td className="px-4 py-3 text-zinc-600">{c.createdBy ?? "—"}</td>
                    <td className="px-4 py-3 text-zinc-600">{c.fiscalYear}</td>
                    <td className="px-4 py-3 text-zinc-600">{PERIOD_TYPE_LABELS[c.periodType]}</td>
                    <td className="px-4 py-3 text-zinc-500">{formatDateTime(c.createdAt)}</td>
                    <td className="px-4 py-3 text-zinc-600">{c.totalFindings}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[c.status]}`}>
                        {STATUS_LABELS[c.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/checks/${c.id}`}
                          className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                          aria-label="Xem"
                        >
                          <EyeIcon size={16} />
                        </Link>
                        <DeleteCheckButton checkId={c.id} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
