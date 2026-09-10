import type { FindingStatus } from "@/types/finding";
import { STATUS_LABELS, STATUS_LEGEND } from "@/types/finding";

// Mục 7.6 / Mục 14 (Master Prompt v6.1) — khối "Lưu ý — Ý nghĩa các trạng thái" là BẮT
// BUỘC, luôn hiển thị đủ 6 badge (kể cả khi số lượng = 0), đặt ngay sau Header và trước
// Stats row, không được ẩn theo filter — nên component này không nhận props filter/data.
const STATUS_ORDER: FindingStatus[] = [
  "pass",
  "error",
  "warning",
  "missing_in_en",
  "needs_supplementing",
  "critical",
];

const DOT_COLOR: Record<FindingStatus, string> = {
  pass: "bg-green-500",
  error: "bg-red-500",
  warning: "bg-yellow-500",
  missing_in_en: "bg-blue-500",
  needs_supplementing: "bg-orange-500",
  critical: "bg-purple-800",
};

export function StatusLegend() {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
      <h4 className="mb-3 text-sm font-bold text-zinc-800">Lưu ý — Ý nghĩa các trạng thái</h4>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {STATUS_ORDER.map((status) => (
          <div key={status} className="flex items-start gap-2">
            <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${DOT_COLOR[status]}`} />
            <div>
              <div className="text-xs font-semibold text-zinc-800">{STATUS_LABELS[status]}</div>
              <div className="text-xs text-zinc-500">{STATUS_LEGEND[status]}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
