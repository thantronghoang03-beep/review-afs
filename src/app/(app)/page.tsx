import Link from "next/link";
import { listChecks } from "@/lib/db/checks-repository";
import { PERIOD_TYPE_LABELS } from "@/types/check";
import { PlusCircleIcon, HistoryIcon, ClockIcon, EyeIcon } from "@/components/ui/icons";
import { formatDateTime } from "@/lib/format/date";

export const dynamic = "force-dynamic";

export default function Home() {
  const checks = listChecks().slice(0, 5);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Chào mừng đến với Review AFS</h1>
        <p className="text-sm text-zinc-400">
          Kiểm tra chính tả, số liệu, format và đối chiếu VN/EN cho báo cáo kiểm toán bằng AI.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/new-check"
          className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-5 transition-colors hover:border-blue-300 hover:bg-blue-50/40"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white">
            <PlusCircleIcon size={22} />
          </div>
          <div>
            <div className="font-semibold text-zinc-900">Tạo kiểm tra mới</div>
            <div className="text-sm text-zinc-400">Tải lên BCTC VN/EN và bắt đầu review bằng AI</div>
          </div>
        </Link>

        <Link
          href="/history"
          className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-5 transition-colors hover:border-blue-300 hover:bg-blue-50/40"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800 text-white">
            <HistoryIcon size={22} />
          </div>
          <div>
            <div className="font-semibold text-zinc-900">Lịch sử kiểm tra</div>
            <div className="text-sm text-zinc-400">Xem lại các kết quả kiểm tra đã thực hiện</div>
          </div>
        </Link>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-zinc-800">Kiểm tra gần đây</h2>
          <Link href="/history" className="text-xs font-medium text-blue-600 hover:underline">
            Xem tất cả
          </Link>
        </div>

        {checks.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-zinc-400">
            <ClockIcon size={28} />
            <p className="text-sm">Chưa có kiểm tra nào. Bắt đầu bằng cách tạo kiểm tra mới.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {checks.map((c) => (
              <Link
                key={c.id}
                href={`/checks/${c.id}`}
                className="flex items-center justify-between gap-4 py-3 hover:bg-zinc-50"
              >
                <div>
                  <div className="text-sm font-medium text-zinc-800">{c.clientName}</div>
                  <div className="text-xs text-zinc-400">
                    {PERIOD_TYPE_LABELS[c.periodType]} · {formatDateTime(c.createdAt)}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusPill status={c.status} />
                  <EyeIcon size={16} className="text-zinc-400" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    processing: "bg-blue-50 text-blue-600",
    done: "bg-green-50 text-green-600",
    error: "bg-red-50 text-red-600",
  };
  const labels: Record<string, string> = {
    processing: "Đang xử lý",
    done: "Hoàn tất",
    error: "Lỗi",
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${styles[status]}`}>{labels[status]}</span>
  );
}
