import { NextResponse } from "next/server";
import { createCheck, generateCheckId, listChecks } from "@/lib/db/checks-repository";
import { uploadFile, uploadPathFor } from "@/lib/storage/supabase-storage";
import { computePeriodType } from "@/lib/ai/period-type";
import { createCheckFieldsSchema, validateUploadedFile, validateUploadedFiles } from "@/lib/validation/create-check";
import { runCheckJob } from "@/lib/jobs/run-check";
import type { CheckStatus, PeriodType } from "@/types/check";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const companyId = url.searchParams.get("companyId") ?? undefined;
  const status = url.searchParams.get("status") ?? undefined;
  const periodType = url.searchParams.get("periodType") ?? undefined;
  const createdBy = url.searchParams.get("createdBy") ?? undefined;
  const dateFrom = url.searchParams.get("dateFrom") ?? undefined;
  const dateTo = url.searchParams.get("dateTo") ?? undefined;

  // Enforce "employees only see their own checks" server-side, not just by hiding rows
  // client-side — the client sends who's asking and what role they logged in as; anyone
  // not "manager" gets forcibly scoped to their own name, ignoring any other createdBy
  // filter they might have sent (the "reviewer" filter is manager-only in the UI anyway).
  const viewerRole = url.searchParams.get("viewerRole") ?? undefined;
  const viewerName = url.searchParams.get("viewerName") ?? undefined;
  const effectiveCreatedBy = viewerRole === "manager" ? createdBy || undefined : viewerName || undefined;

  const checks = await listChecks({
    companyId: companyId || undefined,
    status: (status as CheckStatus) || undefined,
    periodType: (periodType as PeriodType) || undefined,
    createdBy: effectiveCreatedBy,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });
  return NextResponse.json({ checks });
}

async function saveFile(checkId: string, file: File, filename: string): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const storagePath = uploadPathFor(checkId, filename);
  await uploadFile(storagePath, buffer);
  return storagePath;
}

export async function POST(request: Request) {
  const formData = await request.formData();

  const fields = createCheckFieldsSchema.safeParse({
    companyId: formData.get("companyId") || null,
    clientName: formData.get("clientName"),
    createdBy: formData.get("createdBy") || null,
    fiscalYear: formData.get("fiscalYear"),
    periodCurrentStart: formData.get("periodCurrentStart"),
    periodCurrentEnd: formData.get("periodCurrentEnd"),
    periodPriorStart: formData.get("periodPriorStart") || null,
    periodPriorEnd: formData.get("periodPriorEnd") || null,
    isDissolution: formData.get("isDissolution") === "true",
    ercChanged: formData.get("ercChanged") || "na",
    ircChanged: formData.get("ircChanged") || "na",
    runAuditReview: formData.get("runAuditReview") === "true",
    runRiskAnalysis: formData.get("runRiskAnalysis") === "true",
    businessDescription: formData.get("businessDescription") || null,
    isSample: formData.get("isSample") === "true",
  });

  if (!fields.success) {
    return NextResponse.json(
      { error: fields.error.issues.map((i) => i.message).join("; ") },
      { status: 400 }
    );
  }

  const fileVn = formData.get("fileVn") as File | null;
  const fileEn = formData.get("fileEn") as File | null;
  const fileErcLatest = formData.get("fileErcLatest") as File | null;
  const fileErcOriginal = formData.get("fileErcOriginal") as File | null;
  const fileIrcLatest = formData.get("fileIrcLatest") as File | null;
  const fileIrcOriginal = formData.get("fileIrcOriginal") as File | null;
  // v6.1 — Mục 9A (hồ sơ pháp lý mở rộng), tùy chọn, có thể nhiều file (giấy phép con,
  // ưu đãi thuế, hợp đồng thuê đất...) nên gửi nhiều entry cùng field name
  // "fileLegalDossier". Mục 15 (đối chiếu phiên bản liền kề) không nhận file ở đây nữa
  // — xem getPreviousCheckForCompany() dùng trong run-check.ts.
  const filesLegalDossier = formData.getAll("fileLegalDossier") as File[];

  const fileErrors = [
    validateUploadedFile(fileVn, "BCTC Tiếng Việt", true),
    validateUploadedFile(fileEn, "BCTC Tiếng Anh", true),
    validateUploadedFile(fileErcLatest, "ERC (mới nhất)", false),
    validateUploadedFile(fileErcOriginal, "ERC (bản gốc)", false),
    validateUploadedFile(fileIrcLatest, "IRC (mới nhất)", false),
    validateUploadedFile(fileIrcOriginal, "IRC (bản gốc)", false),
    validateUploadedFiles(filesLegalDossier, "Hồ sơ pháp lý mở rộng", false),
  ].filter((e): e is string => e !== null);

  if (fileErrors.length > 0) {
    return NextResponse.json({ error: fileErrors.join("; ") }, { status: 400 });
  }

  const data = fields.data;
  const periodType = computePeriodType({
    periodPriorStart: data.periodPriorStart,
    periodPriorEnd: data.periodPriorEnd,
    isDissolution: data.isDissolution,
  });

  const checkId = generateCheckId();

  const fileVnPath = await saveFile(checkId, fileVn!, "bctc_vn.pdf");
  const fileEnPath = await saveFile(checkId, fileEn!, "bctc_en.pdf");
  const fileErcLatestPath =
    fileErcLatest && fileErcLatest.size > 0 ? await saveFile(checkId, fileErcLatest, "erc_latest.pdf") : null;
  const fileErcOriginalPath =
    fileErcOriginal && fileErcOriginal.size > 0
      ? await saveFile(checkId, fileErcOriginal, "erc_original.pdf")
      : null;
  const fileIrcLatestPath =
    fileIrcLatest && fileIrcLatest.size > 0 ? await saveFile(checkId, fileIrcLatest, "irc_latest.pdf") : null;
  const fileIrcOriginalPath =
    fileIrcOriginal && fileIrcOriginal.size > 0
      ? await saveFile(checkId, fileIrcOriginal, "irc_original.pdf")
      : null;
  const realLegalDossierFiles = filesLegalDossier.filter((f) => f.size > 0);
  const fileLegalDossierPaths = await Promise.all(
    realLegalDossierFiles.map((f, i) => saveFile(checkId, f, `legal_dossier_${i + 1}.pdf`))
  );

  const check = await createCheck({
    id: checkId,
    companyId: data.companyId,
    clientName: data.clientName,
    createdBy: data.createdBy,
    fiscalYear: data.fiscalYear,
    periodCurrentStart: data.periodCurrentStart,
    periodCurrentEnd: data.periodCurrentEnd,
    periodPriorStart: data.periodPriorStart,
    periodPriorEnd: data.periodPriorEnd,
    periodType,
    files: {
      fileVnPath,
      fileEnPath,
      fileErcLatestPath,
      fileErcOriginalPath,
      fileIrcLatestPath,
      fileIrcOriginalPath,
      fileLegalDossierPaths,
    },
    runAuditReview: data.runAuditReview,
    runRiskAnalysis: data.runRiskAnalysis,
    businessDescription: data.businessDescription,
    isSample: data.isSample,
  });

  // Fire-and-forget: runCheckJob catches all errors internally and persists them to the DB row.
  void runCheckJob(check.id, { ercChanged: data.ercChanged, ircChanged: data.ircChanged });

  return NextResponse.json({ checkId: check.id }, { status: 201 });
}
