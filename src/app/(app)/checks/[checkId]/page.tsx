import Link from "next/link";
import { notFound } from "next/navigation";
import { getCheck } from "@/lib/db/checks-repository";
import { listFindingsForCheck } from "@/lib/db/findings-repository";
import { Step3Results } from "@/components/wizard/Step3Results";
import { AlertTriangleIcon, ClockIcon } from "@/components/ui/icons";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ checkId: string }>;
}

export default async function CheckDetailPage({ params }: PageProps) {
  const { checkId } = await params;
  const check = getCheck(checkId);
  if (!check) notFound();

  if (check.status === "processing") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-zinc-200 bg-white py-20 text-center text-zinc-400">
        <ClockIcon size={32} />
        <p>Kiểm tra này vẫn đang được xử lý. Vui lòng quay lại sau.</p>
      </div>
    );
  }

  if (check.status === "error") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-red-200 bg-red-50 py-20 text-center text-red-700">
        <AlertTriangleIcon size={32} />
        <p className="max-w-md text-sm">{check.errorMessage ?? "Có lỗi xảy ra trong quá trình kiểm tra."}</p>
        <Link href="/new-check" className="text-sm font-medium underline">
          Tạo kiểm tra mới
        </Link>
      </div>
    );
  }

  const findings = listFindingsForCheck(checkId);
  return <Step3Results check={check} findings={findings} />;
}
