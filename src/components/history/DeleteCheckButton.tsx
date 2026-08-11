"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { TrashIcon } from "@/components/ui/icons";

export function DeleteCheckButton({ checkId }: { checkId: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Xóa kiểm tra này? Hành động không thể hoàn tác.")) return;
    setDeleting(true);
    await fetch(`/api/checks/${checkId}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="rounded-full p-2 text-zinc-400 hover:bg-red-50 hover:text-red-600"
      aria-label="Xóa"
    >
      <TrashIcon size={16} />
    </button>
  );
}
