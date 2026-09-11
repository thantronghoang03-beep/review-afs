import { NextResponse } from "next/server";
import { getCheck } from "@/lib/db/checks-repository";
import { generateRiskXlsxReport } from "@/lib/export/risk-xlsx-report";

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
  if (!check.riskAnalysis) {
    return NextResponse.json({ error: "Kiểm tra này chưa có kết quả phân tích rủi ro." }, { status: 404 });
  }
  const buffer = await generateRiskXlsxReport(check, check.riskAnalysis);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="phan-tich-rui-ro-${checkId}.xlsx"`,
    },
  });
}
