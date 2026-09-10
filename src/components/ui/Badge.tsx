import type { FindingStatus } from "@/types/finding";
import { STATUS_LABELS, normalizeFindingStatus } from "@/types/finding";

const STATUS_STYLES: Record<FindingStatus, string> = {
  pass: "bg-green-50 text-green-700 border-green-200",
  error: "bg-red-50 text-red-700 border-red-200",
  warning: "bg-yellow-50 text-yellow-700 border-yellow-200",
  missing_in_en: "bg-blue-50 text-blue-700 border-blue-200",
  needs_supplementing: "bg-orange-50 text-orange-700 border-orange-200",
  // Đỏ đậm/tím than — khác biệt rõ với "error" (Mục 7.6 v6.1), dành riêng cho phát hiện
  // pháp lý/tuân thủ nghiêm trọng.
  critical: "bg-purple-100 text-purple-900 border-purple-300",
};

export function StatusBadge({ status }: { status: FindingStatus }) {
  const normalized = normalizeFindingStatus(status);
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[normalized]}`}
    >
      {STATUS_LABELS[normalized]}
    </span>
  );
}
