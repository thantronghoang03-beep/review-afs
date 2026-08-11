"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { ROLE_LABELS } from "@/types/auth";
import { LogOutIcon } from "@/components/ui/icons";
import { CompanySelector } from "./CompanySelector";
import { NotificationBell } from "./NotificationBell";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const lastTwo = parts.slice(-2);
  return lastTwo.map((p) => p[0]?.toUpperCase() ?? "").join("");
}

export function Topbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-6">
      <CompanySelector />

      <div className="flex items-center gap-4">
        <NotificationBell />

        {user && (
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
              {initials(user.name)}
            </div>
            <div className="leading-tight">
              <div className="text-sm font-medium text-zinc-900">{user.name}</div>
              <div className="text-xs text-zinc-400">{ROLE_LABELS[user.role]}</div>
            </div>
            <button
              onClick={handleLogout}
              className="ml-1 rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
              aria-label="Đăng xuất"
            >
              <LogOutIcon size={16} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
