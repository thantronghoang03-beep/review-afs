import { NextResponse } from "next/server";
import { getCheck, deleteCheck } from "@/lib/db/checks-repository";
import { listFindingsForCheck } from "@/lib/db/findings-repository";
import { deleteFiles } from "@/lib/storage/supabase-storage";

export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ checkId: string }>;
}

export async function GET(_req: Request, ctx: Params) {
  const { checkId } = await ctx.params;
  const check = await getCheck(checkId);
  if (!check) {
    return NextResponse.json({ error: "Không tìm thấy kiểm tra." }, { status: 404 });
  }
  const findings = check.status === "done" ? await listFindingsForCheck(checkId) : [];
  return NextResponse.json({ check, findings });
}

export async function DELETE(_req: Request, ctx: Params) {
  const { checkId } = await ctx.params;
  const check = await getCheck(checkId);
  await deleteCheck(checkId);
  if (check) {
    const paths = [
      check.fileVnPath,
      check.fileEnPath,
      check.fileErcLatestPath,
      check.fileErcOriginalPath,
      check.fileIrcLatestPath,
      check.fileIrcOriginalPath,
    ].filter((p): p is string => Boolean(p));
    await deleteFiles(paths);
  }
  return NextResponse.json({ ok: true });
}
