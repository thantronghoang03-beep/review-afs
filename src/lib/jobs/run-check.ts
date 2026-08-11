import { extractPdfPages } from "@/lib/pdf/extract";
import { buildPageDelimitedDocument } from "@/lib/pdf/build-document";
import { runReview } from "@/lib/ai/review";
import { markCheckDone, markCheckError, markCheckStarted, getCheck } from "@/lib/db/checks-repository";
import { insertFindings } from "@/lib/db/findings-repository";
import { SEVERITY_BY_STATUS } from "@/types/finding";
import type { CategoriesChecked, FindingCategory } from "@/types/finding";
import type { FindingsResponse } from "@/lib/ai/findings-schema";

function toCategoriesChecked(categories: FindingsResponse["categories"]): CategoriesChecked {
  const entries = Object.entries(categories) as Array<
    [FindingCategory, { checked: boolean; skipped_reason: string | null }]
  >;
  return Object.fromEntries(
    entries.map(([key, value]) => [key, { checked: value.checked, skippedReason: value.skipped_reason }])
  ) as CategoriesChecked;
}

export async function runCheckJob(checkId: string): Promise<void> {
  const check = getCheck(checkId);
  if (!check) return;

  markCheckStarted(checkId);

  try {
    const [vnExtracted, enExtracted] = await Promise.all([
      extractPdfPages(check.fileVnPath),
      extractPdfPages(check.fileEnPath),
    ]);
    const vnDocument = buildPageDelimitedDocument("VN", vnExtracted);
    const enDocument = buildPageDelimitedDocument("EN", enExtracted);

    let ercDocument: string | null = null;
    if (check.fileErcLatestPath) {
      const parts: string[] = [];
      parts.push(buildPageDelimitedDocument("ERC-LATEST", await extractPdfPages(check.fileErcLatestPath)));
      if (check.fileErcOriginalPath) {
        parts.push(buildPageDelimitedDocument("ERC-ORIGINAL", await extractPdfPages(check.fileErcOriginalPath)));
      }
      ercDocument = parts.join("\n\n");
    }

    let ircDocument: string | null = null;
    if (check.fileIrcLatestPath) {
      const parts: string[] = [];
      parts.push(buildPageDelimitedDocument("IRC-LATEST", await extractPdfPages(check.fileIrcLatestPath)));
      if (check.fileIrcOriginalPath) {
        parts.push(buildPageDelimitedDocument("IRC-ORIGINAL", await extractPdfPages(check.fileIrcOriginalPath)));
      }
      ircDocument = parts.join("\n\n");
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
    });

    const findingsToInsert = result.data.findings.map((f, index) => ({
      checkId,
      section: f.section,
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
    insertFindings(findingsToInsert);

    markCheckDone(checkId, {
      categoriesChecked: toCategoriesChecked(result.data.categories),
      claudeModel: "claude-sonnet-5",
      claudeInputTokens: result.inputTokens,
      claudeOutputTokens: result.outputTokens,
      claudeCacheReadTokens: result.cacheReadTokens,
      rawAiResponseJson: JSON.stringify(result.data),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định khi xử lý kiểm tra.";
    markCheckError(checkId, message);
  }
}
