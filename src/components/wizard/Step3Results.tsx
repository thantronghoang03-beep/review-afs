"use client";

import { useState } from "react";
import type { Check } from "@/types/check";
import { PERIOD_TYPE_LABELS } from "@/types/check";
import type { Finding } from "@/types/finding";
import { CATEGORY_LABELS } from "@/types/finding";
import { StatsCards } from "@/components/results/StatsCards";
import { StatusLegend } from "@/components/results/StatusLegend";
import { ErrorDonutChart } from "@/components/results/ErrorDonutChart";
import { FindingsTable } from "@/components/results/FindingsTable";
import { RiskAnalysisSection } from "@/components/results/RiskAnalysisSection";
import { AlertTriangleIcon, DownloadIcon, FileSpreadsheetIcon, FileTextIcon, PlusCircleIcon } from "@/components/ui/icons";
import Link from "next/link";

interface Step3ResultsProps {
  check: Check;
  findings: Finding[];
}

function ErrorBanner({ label, message }: { label: string; message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      <AlertTriangleIcon size={16} className="mt-0.5 shrink-0" />
      <div>
        <span className="font-semibold">{label}: </span>
        {message}
      </div>
    </div>
  );
}

export function Step3Results({ check, findings }: Step3ResultsProps) {
  const skippedCategories = check.categoriesChecked
    ? Object.entries(check.categoriesChecked).filter(([, v]) => !v.checked)
    : [];

  // v6.6 — mỗi chế độ là 1 lệnh gọi API độc lập (Mục 2.1); khi chọn cả 2 mà chỉ 1 cái
  // lỗi, vẫn hiển thị kết quả của cái thành công kèm banner lỗi rõ ràng cho cái thất
  // bại, không để mất kết quả đã chạy thành công.
  const auditSelected = check.runAuditReview;
  const auditSucceeded = auditSelected && !check.auditReviewError;
  const riskSelected = check.runRiskAnalysis;
  const riskSucceeded = riskSelected && !check.riskAnalysisError && Boolean(check.riskAnalysis);
  const showTabs = auditSucceeded && riskSucceeded;

  const [activeTab, setActiveTab] = useState<"audit" | "risk">("audit");

  const auditContent = auditSucceeded && (
    <div className="space-y-6">
      {skippedCategories.length > 0 && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-3 text-xs text-orange-700">
          Chưa kiểm tra:{" "}
          {skippedCategories
            .map(([key, v]) => `${CATEGORY_LABELS[key as keyof typeof CATEGORY_LABELS]} (${v.skippedReason ?? "thiếu dữ liệu"})`)
            .join("; ")}
        </div>
      )}

      <StatusLegend />

      <StatsCards findings={findings} />

      {check.overallNotes && (
        <div className="rounded-2xl border border-jpa-teal/30 bg-jpa-teal/10 p-4 text-sm text-jpa-700">
          <div className="mb-1 text-xs font-bold uppercase tracking-wide text-jpa-teal">Tóm tắt kết quả review</div>
          {check.overallNotes}
        </div>
      )}

      <div className="rounded-2xl border border-zinc-200 bg-white p-5">
        <h4 className="mb-4 text-sm font-bold text-zinc-800">Phân loại lỗi</h4>
        <ErrorDonutChart findings={findings} />
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5">
        <h4 className="mb-4 text-sm font-bold text-zinc-800">Chi tiết lỗi</h4>
        <FindingsTable findings={findings} />
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
      </div>
    </div>
  );

  const riskContent = riskSucceeded && check.riskAnalysis && (
    <div className="space-y-6">
      <RiskAnalysisSection analysis={check.riskAnalysis} businessDescription={check.businessDescription} />

      <div className="flex flex-wrap items-center justify-end gap-3 rounded-2xl border border-zinc-200 bg-white p-4">
        <a
          href={`/api/checks/${check.id}/export-risk-pdf`}
          className="flex items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          <DownloadIcon size={16} /> Xuất báo cáo rủi ro (PDF)
        </a>
        <a
          href={`/api/checks/${check.id}/export-risk-xlsx`}
          className="flex items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          <FileSpreadsheetIcon size={16} /> Xuất file chi tiết (Excel)
        </a>
        <a
          href={`/api/checks/${check.id}/export-risk-html`}
          className="flex items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          <FileTextIcon size={16} /> Xuất báo cáo (HTML)
        </a>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white p-5">
        <div>
          <h3 className="text-sm font-bold text-jpa-700">3. KẾT QUẢ KIỂM TRA</h3>
          <p className="text-xs text-zinc-400">
            {check.clientName} · Năm tài chính {check.fiscalYear}
            {check.createdBy && <> · Người kiểm tra: {check.createdBy}</>}
          </p>
        </div>
        <span className="rounded-full bg-jpa-50 px-3 py-1.5 text-xs font-semibold text-jpa-700">
          {PERIOD_TYPE_LABELS[check.periodType]}
        </span>
      </div>

      {check.isSample && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          🧪 <span className="font-semibold">Đây là KẾT QUẢ MẪU</span> — được tạo bằng &quot;Bắt đầu kiểm tra
          mẫu&quot;, không gọi Claude API thật, chỉ dùng để xem trước giao diện/định dạng.
        </div>
      )}

      {auditSelected && check.auditReviewError && (
        <ErrorBanner label="Kiểm tra báo cáo kiểm toán" message={check.auditReviewError} />
      )}
      {riskSelected && check.riskAnalysisError && (
        <ErrorBanner label="Phân tích rủi ro báo cáo tài chính" message={check.riskAnalysisError} />
      )}

      {showTabs ? (
        <div>
          <div className="mb-4 flex gap-2 border-b border-zinc-200">
            <button
              onClick={() => setActiveTab("audit")}
              className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "audit"
                  ? "border-jpa-600 text-jpa-700"
                  : "border-transparent text-zinc-400 hover:text-zinc-600"
              }`}
            >
              Kết quả 1 — Kiểm tra báo cáo kiểm toán
            </button>
            <button
              onClick={() => setActiveTab("risk")}
              className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "risk"
                  ? "border-jpa-600 text-jpa-700"
                  : "border-transparent text-zinc-400 hover:text-zinc-600"
              }`}
            >
              Kết quả 2 — Phân tích rủi ro báo cáo tài chính
            </button>
          </div>
          {activeTab === "audit" ? auditContent : riskContent}
        </div>
      ) : (
        <>
          {auditContent}
          {riskContent}
        </>
      )}

      <div className="flex justify-end">
        <Link
          href="/new-check"
          className="flex items-center gap-2 rounded-lg bg-jpa-600 px-4 py-2 text-sm font-medium text-white hover:bg-jpa-700"
        >
          <PlusCircleIcon size={16} /> Tạo kiểm tra mới
        </Link>
      </div>
    </div>
  );
}
