import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import { getCheck, deleteCheck } from "@/lib/db/checks-repository";
import { listFindingsForCheck } from "@/lib/db/findings-repository";
import { uploadsDirFor } from "@/lib/db/client";

export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ checkId: string }>;
}

export async function GET(_req: Request, ctx: Params) {
  const { checkId } = await ctx.params;
  const check = getCheck(checkId);
  if (!check) {
    return NextResponse.json({ error: "Không tìm thấy kiểm tra." }, { status: 404 });
  }
  const findings = check.status === "done" ? listFindingsForCheck(checkId) : [];
  return NextResponse.json({ check, findings });
}

export async function DELETE(_req: Request, ctx: Params) {
  const { checkId } = await ctx.params;
  deleteCheck(checkId);
  await fs.rm(uploadsDirFor(checkId), { recursive: true, force: true });
  return NextResponse.json({ ok: true });
}
