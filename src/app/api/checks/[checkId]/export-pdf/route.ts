import { NextResponse } from "next/server";
import { getCheck } from "@/lib/db/checks-repository";
import { listFindingsForCheck } from "@/lib/db/findings-repository";
import { generatePdfReport } from "@/lib/export/pdf-report";

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
  const buffer = await generatePdfReport(check, findings);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="bao-cao-loi-${checkId}.pdf"`,
    },
  });
}
