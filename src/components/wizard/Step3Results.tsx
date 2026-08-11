import type { Check } from "@/types/check";
import { PERIOD_TYPE_LABELS } from "@/types/check";
import type { Finding } from "@/types/finding";
import { CATEGORY_LABELS } from "@/types/finding";
import { StatsCards } from "@/components/results/StatsCards";
import { ErrorDonutChart } from "@/components/results/ErrorDonutChart";
import { FindingsTable } from "@/components/results/FindingsTable";
import { DownloadIcon, FileSpreadsheetIcon, FileTextIcon, PlusCircleIcon } from "@/components/ui/icons";
import Link from "next/link";

interface Step3ResultsProps {
  check: Check;
  findings: Finding[];
}

export function Step3Results({ check, findings }: Step3ResultsProps) {
  const skippedCategories = check.categoriesChecked
    ? Object.entries(check.categoriesChecked).filter(([, v]) => !v.checked)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white p-5">
        <div>
          <h3 className="text-sm font-bold text-blue-700">3. KẾT QUẢ KIỂM TRA</h3>
          <p className="text-xs text-zinc-400">
            {check.clientName} · Năm tài chính {check.fiscalYear}
            {check.createdBy && <> · Người kiểm tra: {check.createdBy}</>}
          </p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
          {PERIOD_TYPE_LABELS[check.periodType]}
        </span>
      </div>

      {skippedCategories.length > 0 && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-3 text-xs text-orange-700">
          Chưa kiểm tra:{" "}
          {skippedCategories
            .map(([key, v]) => `${CATEGORY_LABELS[key as keyof typeof CATEGORY_LABELS]} (${v.skippedReason ?? "thiếu dữ liệu"})`)
            .join("; ")}
        </div>
      )}

      <StatsCards findings={findings} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 lg:col-span-1">
          <h4 className="mb-4 text-sm font-bold text-zinc-800">Phân loại lỗi</h4>
          <ErrorDonutChart findings={findings} />
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 lg:col-span-2">
          <h4 className="mb-4 text-sm font-bold text-zinc-800">Chi tiết lỗi</h4>
          <FindingsTable findings={findings} />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 rounded-2xl border border-zinc-200 bg-white p-4">
        <a
          href={`/api/checks/${check.id}/export-pdf`}
          className="flex items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          <DownloadIcon size={16} /> Xuất báo cáo lỗi (PDF)
        </a>
        <a
          href={`/api/checks/${check.id}/export-xlsx`}
          className="flex items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          <FileSpreadsheetIcon size={16} /> Xuất file chi tiết (Excel)
        </a>
        <a
          href={`/api/checks/${check.id}/export-html`}
          className="flex items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          <FileTextIcon size={16} /> Xuất báo cáo (HTML)
        </a>
        <Link
          href="/new-check"
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <PlusCircleIcon size={16} /> Tạo kiểm tra mới
        </Link>
      </div>
    </div>
  );
}
