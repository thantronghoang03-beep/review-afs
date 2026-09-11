import { NextResponse } from "next/server";
import { getCheck } from "@/lib/db/checks-repository";
import { generateRiskHtmlReport } from "@/lib/export/risk-html-report";

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
  const html = generateRiskHtmlReport(check, check.riskAnalysis);

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="phan-tich-rui-ro-${checkId}.html"`,
    },
  });
}
