import { extractPdfPages } from "@/lib/pdf/extract";
import { buildPageDelimitedDocument } from "@/lib/pdf/build-document";
import { runReview } from "@/lib/ai/review";
import { runRiskAnalysis } from "@/lib/ai/risk-analysis";
import {
  markCheckDone,
  markCheckError,
  markCheckStarted,
  getCheck,
  getPreviousCheckForCompany,
} from "@/lib/db/checks-repository";
import { insertFindings } from "@/lib/db/findings-repository";
import { downloadFile } from "@/lib/storage/supabase-storage";
import { CLAUDE_MODEL } from "@/lib/ai/client";
import { SEVERITY_BY_STATUS } from "@/types/finding";
import type { CategoriesChecked, FindingCategory } from "@/types/finding";
import type { FindingsResponse } from "@/lib/ai/findings-schema";
import type { Check } from "@/types/check";
import type { RiskAnalysis } from "@/types/risk";

function toCategoriesChecked(categories: FindingsResponse["categories"]): CategoriesChecked {
  const entries = Object.entries(categories) as Array<
    [FindingCategory, { checked: boolean; skipped_reason: string | null }]
  >;
  return Object.fromEntries(
    entries.map(([key, value]) => [key, { checked: value.checked, skippedReason: value.skipped_reason }])
  ) as CategoriesChecked;
}

async function extractFromStorage(storagePath: string) {
  const buffer = await downloadFile(storagePath);
  return extractPdfPages(buffer);
}

interface RunCheckOptions {
  ercChanged?: "na" | "yes";
  ircChanged?: "na" | "yes";
}

function errorMessageOf(error: unknown): string {
  return error instanceof Error ? error.message : "Lỗi không xác định.";
}

// Mục 0 điểm 2 / Mục 2.1 (v6.6): mỗi chế độ là 1 lệnh gọi API độc lập — chạy song song
// bằng Promise.allSettled để tổng thời gian chờ ≈ thời gian của lệnh gọi lâu nhất, và
// để 1 lệnh gọi lỗi không làm mất kết quả đã chạy thành công của lệnh gọi kia.

async function runAuditReviewTask(
  check: Check,
  checkId: string,
  vnDocument: string,
  enDocument: string,
  options: RunCheckOptions
) {
  let ercDocument: string | null = null;
  if (check.fileErcLatestPath) {
    const parts: string[] = [];
    parts.push(buildPageDelimitedDocument("ERC-LATEST", await extractFromStorage(check.fileErcLatestPath)));
    if (check.fileErcOriginalPath) {
      parts.push(buildPageDelimitedDocument("ERC-ORIGINAL", await extractFromStorage(check.fileErcOriginalPath)));
    }
    ercDocument = parts.join("\n\n");
  }

  let ircDocument: string | null = null;
  if (check.fileIrcLatestPath) {
    const parts: string[] = [];
    parts.push(buildPageDelimitedDocument("IRC-LATEST", await extractFromStorage(check.fileIrcLatestPath)));
    if (check.fileIrcOriginalPath) {
      parts.push(buildPageDelimitedDocument("IRC-ORIGINAL", await extractFromStorage(check.fileIrcOriginalPath)));
    }
    ircDocument = parts.join("\n\n");
  }

  // v6.1 — Mục 15: đối chiếu phiên bản liền kề. Không cần upload riêng — tự lấy lượt
  // kiểm tra hoàn tất gần nhất trước đó của CÙNG công ty (nếu có) và dùng chính báo cáo
  // VN/EN đã tải lên ở lượt đó làm bản đối chiếu.
  let draftDocument: string | null = null;
  if (check.companyId) {
    const previousCheck = await getPreviousCheckForCompany(check.companyId, checkId);
    if (previousCheck) {
      const [prevVn, prevEn] = await Promise.all([
        extractFromStorage(previousCheck.fileVnPath),
        extractFromStorage(previousCheck.fileEnPath),
      ]);
      draftDocument = [
        buildPageDelimitedDocument("DRAFT-PREV-VN", prevVn),
        buildPageDelimitedDocument("DRAFT-PREV-EN", prevEn),
      ].join("\n\n");
    }
  }

  // v6.1 — Mục 9A: hồ sơ pháp lý mở rộng, có thể nhiều file — ghép lại thành 1 khối.
  let legalDossierDocument: string | null = null;
  if (check.fileLegalDossierPaths.length > 0) {
    const parts = await Promise.all(
      check.fileLegalDossierPaths.map(async (path, i) =>
        buildPageDelimitedDocument(`HO-SO-PHAP-LY-${i + 1}`, await extractFromStorage(path))
      )
    );
    legalDossierDocument = parts.join("\n\n");
  }

  const result = await runReview({
    clientName: check.clientName,
    fiscalYear: check.fiscalYear,
    periodCurrentStart: check.periodCurrentStart,
    periodCurrentEnd: check.periodCurrentEnd,
    periodPriorStart: check.periodPriorStart,
    periodPriorEnd: check.periodPriorEnd,
    periodType: check.periodType,
    vnDocument,
    enDocument,
    ercDocument,
    ircDocument,
    ercHasOriginal: Boolean(check.fileErcOriginalPath),
    ircHasOriginal: Boolean(check.fileIrcOriginalPath),
    ercChanged: check.fileErcLatestPath ? (options.ercChanged ?? "na") : null,
    ircChanged: check.fileIrcLatestPath ? (options.ircChanged ?? "na") : null,
    draftDocument,
    legalDossierDocument,
  });

  const findingsToInsert = result.data.findings.map((f, index) => ({
    checkId,
    section: f.section,
    group: f.group,
    fieldLabel: f.field_label,
    pageVn: f.page_vn,
    pageEn: f.page_en,
    contentVn: f.content_vn,
    contentEn: f.content_en,
    status: f.status,
    category: f.category,
    severity: SEVERITY_BY_STATUS[f.status],
    note: f.note,
    displayOrder: index,
  }));
  await insertFindings(findingsToInsert);

  return {
    categoriesChecked: toCategoriesChecked(result.data.categories),
    claudeModel: CLAUDE_MODEL,
    claudeInputTokens: result.inputTokens,
    claudeOutputTokens: result.outputTokens,
    claudeCacheReadTokens: result.cacheReadTokens,
    rawAiResponseJson: JSON.stringify(result.data),
    overallNotes: result.data.summary.overall_notes,
  };
}

async function runRiskAnalysisTask(check: Check, vnDocument: string, enDocument: string): Promise<RiskAnalysis> {
  const risk = await runRiskAnalysis({
    clientName: check.clientName,
    fiscalYear: check.fiscalYear,
    periodType: check.periodType,
    periodCurrentStart: check.periodCurrentStart,
    periodCurrentEnd: check.periodCurrentEnd,
    periodPriorStart: check.periodPriorStart,
    periodPriorEnd: check.periodPriorEnd,
    vnDocument,
    enDocument,
    businessDescription: check.businessDescription,
  });

  return {
    kpis: risk.kpis.map((k) => ({ label: k.label, value: k.value, comparison: k.comparison, tone: k.tone })),
    overallRisk: { level: risk.overall_risk.level, summary: risk.overall_risk.summary },
    ratios: risk.ratios.map((r) => ({
      category: r.category,
      name: r.name,
      unit: r.unit,
      currentYearValue: r.current_year_value,
      priorYearValue: r.prior_year_value,
      note: r.note,
    })),
    variances: risk.variances.map((v) => ({
      label: v.label,
      currentYearValue: v.current_year_value,
      priorYearValue: v.prior_year_value,
      percentChange: v.percent_change,
      level: v.level,
      note: v.note,
    })),
    riskItems: risk.risk_items.map((r) => ({
      group: r.group,
      title: r.title,
      level: r.level,
      page: r.page,
      valueVn: r.value_vn,
      summaryEn: r.summary_en,
      assessment: r.assessment,
    })),
    summary: risk.summary,
  };
}

export async function runCheckJob(checkId: string, options: RunCheckOptions = {}): Promise<void> {
  const check = await getCheck(checkId);
  if (!check) return;

  await markCheckStarted(checkId);

  try {
    const [vnExtracted, enExtracted] = await Promise.all([
      extractFromStorage(check.fileVnPath),
      extractFromStorage(check.fileEnPath),
    ]);
    const vnDocument = buildPageDelimitedDocument("VN", vnExtracted);
    const enDocument = buildPageDelimitedDocument("EN", enExtracted);

    // Người dùng chọn chạy tác vụ nào ở form "Tạo kiểm tra mới" — ít nhất 1 trong 2
    // phải bật (ép ở validation phía client/server). Chạy song song, không để 1 tác vụ
    // lỗi làm mất kết quả tác vụ kia đã chạy thành công.
    const [auditSettled, riskSettled] = await Promise.allSettled([
      check.runAuditReview
        ? runAuditReviewTask(check, checkId, vnDocument, enDocument, options)
        : Promise.resolve(null),
      check.runRiskAnalysis ? runRiskAnalysisTask(check, vnDocument, enDocument) : Promise.resolve(null),
    ]);

    const auditReviewData = auditSettled.status === "fulfilled" ? auditSettled.value : null;
    const auditReviewError =
      check.runAuditReview && auditSettled.status === "rejected" ? errorMessageOf(auditSettled.reason) : null;

    const riskAnalysisData = riskSettled.status === "fulfilled" ? riskSettled.value : null;
    const riskAnalysisError =
      check.runRiskAnalysis && riskSettled.status === "rejected" ? errorMessageOf(riskSettled.reason) : null;

    // Chỉ toàn bộ check là "error" khi KHÔNG tác vụ nào được chọn mà chạy thành công —
    // nếu chọn cả 2 và chỉ 1 cái lỗi, vẫn lưu kết quả cái thành công + ghi rõ lỗi cái kia.
    const anySucceeded =
      (check.runAuditReview && auditReviewData) || (check.runRiskAnalysis && riskAnalysisData);

    if (!anySucceeded) {
      const messages = [auditReviewError, riskAnalysisError].filter((m): m is string => Boolean(m));
      throw new Error(messages.join(" | ") || "Không có tác vụ nào chạy thành công.");
    }

    await markCheckDone(checkId, {
      auditReview: auditReviewData ?? undefined,
      riskAnalysis: riskAnalysisData ?? undefined,
      auditReviewError,
      riskAnalysisError,
    });
  } catch (error) {
    await markCheckError(checkId, errorMessageOf(error));
  }
}
