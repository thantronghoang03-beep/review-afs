"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  PlusCircleIcon,
  HistoryIcon,
  FileTextIcon,
  HelpCircleIcon,
  SettingsIcon,
  ShieldCheckIcon,
} from "@/components/ui/icons";

const NAV_ITEMS = [
  { href: "/", label: "Trang chủ", icon: HomeIcon },
  { href: "/new-check", label: "Tạo kiểm tra mới", icon: PlusCircleIcon },
  { href: "/history", label: "Lịch sử kiểm tra", icon: HistoryIcon },
  { href: "/templates", label: "Mẫu báo cáo", icon: FileTextIcon },
  { href: "/guide", label: "Hướng dẫn sử dụng", icon: HelpCircleIcon },
  { href: "/settings", label: "Cài đặt", icon: SettingsIcon },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col bg-jpa-700">
      <div className="flex items-center gap-2 border-b border-white/10 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-jpa-teal text-white">
          <ShieldCheckIcon size={20} />
        </div>
        <div>
          <div className="text-base font-bold leading-tight text-white">Review AFS</div>
          <div className="text-[11px] leading-tight text-white/50">Audit Report Checker</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-jpa-teal/20 text-white"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
