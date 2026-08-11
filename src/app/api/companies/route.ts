import { NextResponse } from "next/server";
import { listCompanies, createCompany } from "@/lib/db/companies-repository";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ companies: listCompanies() });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "Tên công ty là bắt buộc." }, { status: 400 });
  }
  const company = createCompany(name);
  return NextResponse.json({ company }, { status: 201 });
}
