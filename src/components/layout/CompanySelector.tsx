"use client";

import { useRef, useState } from "react";
import { useCompany } from "@/lib/context/CompanyContext";
import { Building2Icon, ChevronDownIcon, BuildingPlusIcon } from "@/components/ui/icons";
import { useOnClickOutside } from "@/lib/hooks/useOnClickOutside";

export function CompanySelector() {
  const { companies, selectedCompanyId, selectedCompany, setSelectedCompanyId, createCompany } = useCompany();
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useOnClickOutside(ref, () => setOpen(false));

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      await createCompany(newName.trim());
      setNewName("");
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tạo công ty.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
      >
        <Building2Icon size={16} className="text-zinc-400" />
        <span className="max-w-[180px] truncate">{selectedCompany?.name ?? "Chọn công ty"}</span>
        <ChevronDownIcon size={16} className="text-zinc-400" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-2 w-72 rounded-xl border border-zinc-200 bg-white p-2 shadow-lg">
          <button
            onClick={() => {
              setSelectedCompanyId(null);
              setOpen(false);
            }}
            className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
              selectedCompanyId === null ? "bg-blue-50 text-blue-700" : "text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            Tất cả công ty
          </button>

          <div className="my-1 max-h-56 overflow-y-auto">
            {companies.length === 0 && (
              <p className="px-3 py-2 text-xs text-zinc-400">Chưa có công ty nào.</p>
            )}
            {companies.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedCompanyId(c.id);
                  setOpen(false);
                }}
                className={`w-full truncate rounded-lg px-3 py-2 text-left text-sm ${
                  selectedCompanyId === c.id ? "bg-blue-50 text-blue-700" : "text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          <form onSubmit={handleCreate} className="flex items-center gap-2 border-t border-zinc-100 p-2">
            <BuildingPlusIcon size={16} className="shrink-0 text-zinc-400" />
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Tên công ty mới..."
              className="min-w-0 grow rounded-lg border border-zinc-200 px-2 py-1.5 text-sm focus:border-blue-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!newName.trim() || creating}
              className="shrink-0 rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white disabled:bg-zinc-300"
            >
              Thêm
            </button>
          </form>
          {error && <p className="px-2 pb-1 text-xs text-red-500">{error}</p>}
        </div>
      )}
    </div>
  );
}
