import type { FindingStatus } from "@/types/finding";
import { STATUS_LABELS } from "@/types/finding";

const STATUS_STYLES: Record<FindingStatus, string> = {
  match: "bg-green-50 text-green-700 border-green-200",
  difference: "bg-red-50 text-red-700 border-red-200",
  warning: "bg-yellow-50 text-yellow-700 border-yellow-200",
  missing_in_en: "bg-blue-50 text-blue-700 border-blue-200",
  needs_supplementing: "bg-orange-50 text-orange-700 border-orange-200",
};

export function StatusBadge({ status }: { status: FindingStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
