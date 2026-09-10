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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-jpa-900 via-jpa-600 to-jpa-900 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-3xl bg-white p-12 shadow-2xl"
      >
        <div className="flex flex-col items-center">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-jpa-600 text-white">
            <ShieldCheckIcon size={40} />
          </div>
          <h1 className="text-center text-2xl font-bold text-zinc-900">JPA Vietvalues – Review AFS</h1>
          <p className="mt-2 text-base tracking-wide text-zinc-400">VIETVALUES · HCMB</p>
        </div>

        <div className="mt-9">
          <label className="mb-2 block text-sm font-semibold tracking-wide text-zinc-500">
            TÊN ĐĂNG NHẬP
          </label>
          <input
            autoFocus
            className="w-full rounded-xl border border-zinc-200 px-5 py-3.5 text-base focus:border-jpa-400 focus:outline-none focus:ring-2 focus:ring-jpa-100"
            placeholder="Nhập tên của bạn..."
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
          />
        </div>

        <div className="mt-5">
          <label className="mb-2 block text-sm font-semibold tracking-wide text-zinc-500">MẬT KHẨU</label>
          <input
            type="password"
            className="w-full rounded-xl border border-zinc-200 px-5 py-3.5 text-base focus:border-jpa-400 focus:outline-none focus:ring-2 focus:ring-jpa-100"
            placeholder="Nhập mật khẩu..."
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(null);
            }}
          />
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3.5 text-base text-red-700">
            <AlertTriangleIcon size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={!name.trim() || !password}
          className="mt-8 w-full rounded-xl bg-jpa-600 py-4 text-base font-semibold text-white transition-colors hover:bg-jpa-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          Đăng nhập →
        </button>
      </form>
    </div>
  );
}
