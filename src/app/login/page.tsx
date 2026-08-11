"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import type { UserRole } from "@/types/auth";
import { ShieldCheckIcon, UserIcon, CrownIcon } from "@/components/ui/icons";

const ROLE_OPTIONS: Array<{ value: UserRole; label: string; icon: typeof UserIcon; desc: string }> = [
  { value: "employee", label: "Nhân Viên – chỉ xem & nhập của mình", icon: UserIcon, desc: "Chỉ thấy data của mình" },
  { value: "manager", label: "Manager", icon: CrownIcon, desc: "Xem tất cả · Báo cáo" },
];

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>("employee");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    login({ name: name.trim(), role });
    router.push("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-teal-900 to-slate-800 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl"
      >
        <div className="flex flex-col items-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-600 text-white">
            <ShieldCheckIcon size={32} />
          </div>
          <h1 className="text-center text-xl font-bold text-zinc-900">JPA Vietnam – Review AFS</h1>
          <p className="mt-1 text-sm tracking-wide text-zinc-400">VIETVALUES · HCMB</p>
        </div>

        <div className="mt-7">
          <label className="mb-1.5 block text-xs font-semibold tracking-wide text-zinc-500">
            TÊN ĐĂNG NHẬP
          </label>
          <input
            autoFocus
            className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100"
            placeholder="Nhập tên của bạn..."
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="mt-4">
          <label className="mb-1.5 block text-xs font-semibold tracking-wide text-zinc-500">VAI TRÒ</label>
          <select
            className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={!name.trim()}
          className="mt-6 w-full rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          Đăng nhập →
        </button>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {ROLE_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isActive = role === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRole(opt.value)}
                className={`rounded-xl border p-3 text-left transition-colors ${
                  isActive
                    ? opt.value === "employee"
                      ? "border-teal-300 bg-teal-50"
                      : "border-orange-300 bg-orange-50"
                    : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100"
                }`}
              >
                <div
                  className={`flex items-center gap-1.5 text-sm font-semibold ${
                    opt.value === "employee" ? "text-teal-700" : "text-orange-600"
                  }`}
                >
                  <Icon size={14} /> {opt.value === "employee" ? "Nhân Viên" : "Manager"}
                </div>
                <div className="mt-0.5 text-xs text-zinc-500">{opt.desc}</div>
              </button>
            );
          })}
        </div>
      </form>
    </div>
  );
}
