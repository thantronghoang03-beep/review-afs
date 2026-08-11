import { NextResponse } from "next/server";
import { getCheck } from "@/lib/db/checks-repository";
import { listFindingsForCheck } from "@/lib/db/findings-repository";
import { generateXlsxReport } from "@/lib/export/xlsx-report";

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
  const findings = listFindingsForCheck(checkId);
  const buffer = await generateXlsxReport(check, findings);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="chi-tiet-loi-${checkId}.xlsx"`,
    },
  });
}
