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
    <header className="flex h-16 items-center justify-between border-b border-jpa-900/40 bg-jpa-700 px-6">
      <CompanySelector />

      <div className="flex items-center gap-4">
        <NotificationBell />

        {user && (
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-jpa-teal/20 text-sm font-semibold text-white">
              {initials(user.name)}
            </div>
            <div className="leading-tight">
              <div className="text-sm font-medium text-white">{user.name}</div>
              <div className="text-xs text-white/50">{ROLE_LABELS[user.role]}</div>
            </div>
            <button
              onClick={handleLogout}
              className="ml-1 rounded-full p-2 text-white/60 hover:bg-white/10 hover:text-white"
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
