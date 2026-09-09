"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import type { UserRole } from "@/types/auth";
import { ShieldCheckIcon, AlertTriangleIcon } from "@/components/ui/icons";

const LOGIN_PASSWORD = "123456";
const ADMIN_USERNAME = "admin";

function roleForUsername(username: string): UserRole {
  return username.trim().toLowerCase() === ADMIN_USERNAME ? "manager" : "employee";
}

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    if (password !== LOGIN_PASSWORD) {
      setError("Sai mật khẩu đăng nhập.");
      return;
    }

    setError(null);
    login({ name: name.trim(), role: roleForUsername(name) });
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
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
          />
        </div>

        <div className="mt-4">
          <label className="mb-1.5 block text-xs font-semibold tracking-wide text-zinc-500">MẬT KHẨU</label>
          <input
            type="password"
            className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100"
            placeholder="Nhập mật khẩu..."
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(null);
            }}
          />
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-sm text-red-700">
            <AlertTriangleIcon size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={!name.trim() || !password}
          className="mt-6 w-full rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          Đăng nhập →
        </button>
      </form>
    </div>
  );
}
