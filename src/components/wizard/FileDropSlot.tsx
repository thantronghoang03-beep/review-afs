"use client";

import { useRef } from "react";
import { UploadCloudIcon, FileTextIcon, XIcon } from "@/components/ui/icons";

interface FileDropSlotProps {
  label: string;
  sublabel?: string;
  file: File | null;
  onChange: (file: File | null) => void;
  required?: boolean;
}

export function FileDropSlot({ label, sublabel, file, onChange, required }: FileDropSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) onChange(dropped);
  }

  if (file) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500">
          <FileTextIcon size={20} />
        </div>
        <div className="min-w-0 grow">
          <div className="truncate text-sm font-medium text-zinc-800">{label}</div>
          <div className="truncate text-xs text-zinc-400">
            {file.name} · {(file.size / (1024 * 1024)).toFixed(2)} MB
          </div>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="shrink-0 rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
          aria-label={`Xóa ${label}`}
        >
          <XIcon size={16} />
        </button>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 px-3 py-5 text-center hover:border-blue-300 hover:bg-blue-50/30"
    >
      <UploadCloudIcon size={22} className="text-zinc-400" />
      <div className="text-sm font-medium text-zinc-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </div>
      {sublabel && <div className="text-xs text-zinc-400">{sublabel}</div>}
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}
