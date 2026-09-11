"use client";

import { useRef, useState } from "react";
import { useNotifications } from "@/lib/context/NotificationsContext";
import { BellIcon, CheckCircleIcon, ClockIcon, AlertTriangleIcon } from "@/components/ui/icons";
import { useOnClickOutside } from "@/lib/hooks/useOnClickOutside";
import { formatDateTime } from "@/lib/format/date";
import Link from "next/link";

export function NotificationBell() {
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useOnClickOutside(ref, () => setOpen(false));

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => {
          setOpen((v) => !v);
          if (!open) markAllRead();
        }}
        className="relative rounded-full p-2 text-zinc-500 hover:bg-zinc-100"
        aria-label="Thông báo"
      >
        <BellIcon size={20} />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-80 rounded-xl border border-zinc-200 bg-white shadow-lg">
          <div className="border-b border-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-800">
            Thông báo
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-zinc-400">Chưa có thông báo nào.</p>
            )}
            {notifications.map((n) => (
              <Link
                key={n.checkId}
                href={`/checks/${n.checkId}`}
                className="flex items-start gap-3 border-b border-zinc-50 px-4 py-3 hover:bg-zinc-50"
              >
                {n.status === "processing" && <ClockIcon size={16} className="mt-0.5 shrink-0 text-blue-500" />}
                {n.status === "done" && <CheckCircleIcon size={16} className="mt-0.5 shrink-0 text-green-500" />}
                {n.status === "error" && <AlertTriangleIcon size={16} className="mt-0.5 shrink-0 text-red-500" />}
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-zinc-800">{n.clientName}</div>
                  <div className="text-xs text-zinc-400">
                    {n.status === "processing" && "Đang xử lý..."}
                    {n.status === "done" && `Hoàn tất lúc ${formatDateTime(n.completedAt)}`}
                    {n.status === "error" && "Có lỗi xảy ra"}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
