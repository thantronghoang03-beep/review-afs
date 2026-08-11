import { NextResponse } from "next/server";
import { countChecksSince } from "@/lib/db/checks-repository";

export const dynamic = "force-dynamic";

const PACKAGE_NAME = "Professional";
const MONTHLY_LIMIT = 50;

export async function GET() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const used = await countChecksSince(monthStart);
  const percent = Math.min(100, Math.round((used / MONTHLY_LIMIT) * 100));

  return NextResponse.json({
    packageName: PACKAGE_NAME,
    used,
    limit: MONTHLY_LIMIT,
    percent,
  });
}
