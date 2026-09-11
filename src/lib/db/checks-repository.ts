import { nanoid } from "nanoid";
import { getSupabase } from "@/lib/supabase/client";
import type {
  Check,
  CheckListItem,
  CheckListFilters,
  CheckStatus,
  PeriodType,
  CheckFilePaths,
} from "@/types/check";
import type { CategoriesChecked } from "@/types/finding";
import type { RiskAnalysis } from "@/types/risk";

interface CreateCheckInput {
  id: string;
  companyId: string | null;
  clientName: string;
  createdBy: string | null;
  fiscalYear: string;
  periodCurrentStart: string;
  periodCurrentEnd: string;
  periodPriorStart: string | null;
  periodPriorEnd: string | null;
  periodType: PeriodType;
  files: CheckFilePaths;
  runAuditReview: boolean;
  runRiskAnalysis: boolean;
  businessDescription: string | null;
}

export function generateCheckId(): string {
  return `chk_${nanoid(12)}`;
}

function rowToCheck(row: Record<string, unknown>): Check {
  return {
    id: row.id as string,
    companyId: (row.company_id as string) ?? null,
    clientName: row.client_name as string,
    createdBy: (row.created_by as string) ?? null,
    fiscalYear: row.fiscal_year as string,
    periodCurrentStart: row.period_current_start as string,
    periodCurrentEnd: row.period_current_end as string,
    periodPriorStart: (row.period_prior_start as string) ?? null,
    periodPriorEnd: (row.period_prior_end as string) ?? null,
    periodType: row.period_type as PeriodType,
    fileVnPath: row.file_vn_path as string,
    fileEnPath: row.file_en_path as string,
    fileErcLatestPath: (row.file_erc_latest_path as string) ?? null,
    fileErcOriginalPath: (row.file_erc_original_path as string) ?? null,
    fileIrcLatestPath: (row.file_irc_latest_path as string) ?? null,
    fileIrcOriginalPath: (row.file_irc_original_path as string) ?? null,
    fileLegalDossierPaths: (row.file_legal_dossier_paths as string[]) ?? [],
    status: row.status as CheckStatus,
    errorMessage: (row.error_message as string) ?? null,
    categoriesChecked: (row.categories_checked_json as CategoriesChecked) ?? null,
    claudeModel: (row.claude_model as string) ?? null,
    claudeInputTokens: (row.claude_input_tokens as number) ?? null,
    claudeOutputTokens: (row.claude_output_tokens as number) ?? null,
    claudeCacheReadTokens: (row.claude_cache_read_tokens as number) ?? null,
    overallNotes: (row.overall_notes as string) ?? null,
    runAuditReview: (row.run_audit_review as boolean) ?? true,
    runRiskAnalysis: (row.run_risk_analysis as boolean) ?? false,
    riskAnalysis: (row.risk_analysis_json as RiskAnalysis) ?? null,
    businessDescription: (row.business_description as string) ?? null,
    auditReviewError: (row.audit_review_error as string) ?? null,
    riskAnalysisError: (row.risk_analysis_error as string) ?? null,
    createdAt: row.created_at as string,
    startedAt: (row.started_at as string) ?? null,
    completedAt: (row.completed_at as string) ?? null,
  };
}

export async function createCheck(input: CreateCheckInput): Promise<Check> {
  const supabase = getSupabase();
  const { error } = await supabase.from("checks").insert({
    id: input.id,
    company_id: input.companyId,
    client_name: input.clientName,
    created_by: input.createdBy,
    fiscal_year: input.fiscalYear,
    period_current_start: input.periodCurrentStart,
    period_current_end: input.periodCurrentEnd,
    period_prior_start: input.periodPriorStart,
    period_prior_end: input.periodPriorEnd,
    period_type: input.periodType,
    file_vn_path: input.files.fileVnPath,
    file_en_path: input.files.fileEnPath,
    file_erc_latest_path: input.files.fileErcLatestPath,
    file_erc_original_path: input.files.fileErcOriginalPath,
    file_irc_latest_path: input.files.fileIrcLatestPath,
    file_irc_original_path: input.files.fileIrcOriginalPath,
    file_legal_dossier_paths: input.files.fileLegalDossierPaths,
    run_audit_review: input.runAuditReview,
    run_risk_analysis: input.runRiskAnalysis,
    business_description: input.businessDescription,
    status: "processing",
  });
  if (error) throw error;
  return (await getCheck(input.id))!;
}

export async function getCheck(id: string): Promise<Check | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("checks").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? rowToCheck(data) : null;
}

export async function markCheckStarted(id: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("checks").update({ started_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

export async function markCheckDone(
  id: string,
  data: {
    // Kết quả review v6.1 (đối chiếu VN/EN) — vắng mặt nếu người dùng chỉ chọn chạy
    // "Phân tích rủi ro báo cáo tài chính".
    auditReview?: {
      categoriesChecked: CategoriesChecked;
      claudeModel: string;
      claudeInputTokens: number;
      claudeOutputTokens: number;
      claudeCacheReadTokens: number;
      rawAiResponseJson: string;
      overallNotes: string;
    };
    // Kết quả phân tích rủi ro tài chính — vắng mặt nếu người dùng không chọn chạy.
    riskAnalysis?: RiskAnalysis;
    // v6.6 — lỗi riêng của từng chế độ khi chọn cả 2 mà chỉ 1 cái thất bại (xem
    // run-check.ts) — null nếu chế độ đó không được chọn hoặc chạy thành công.
    auditReviewError?: string | null;
    riskAnalysisError?: string | null;
  }
): Promise<void> {
  const supabase = getSupabase();
  const update: Record<string, unknown> = {
    status: "done",
    completed_at: new Date().toISOString(),
    audit_review_error: data.auditReviewError ?? null,
    risk_analysis_error: data.riskAnalysisError ?? null,
  };
  if (data.auditReview) {
    update.categories_checked_json = data.auditReview.categoriesChecked;
    update.claude_model = data.auditReview.claudeModel;
    update.claude_input_tokens = data.auditReview.claudeInputTokens;
    update.claude_output_tokens = data.auditReview.claudeOutputTokens;
    update.claude_cache_read_tokens = data.auditReview.claudeCacheReadTokens;
    update.raw_ai_response_json = JSON.parse(data.auditReview.rawAiResponseJson);
    update.overall_notes = data.auditReview.overallNotes;
  }
  if (data.riskAnalysis) {
    update.risk_analysis_json = data.riskAnalysis;
  }
  const { error } = await supabase.from("checks").update(update).eq("id", id);
  if (error) throw error;
}

export async function markCheckError(id: string, errorMessage: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("checks")
    .update({ status: "error", error_message: errorMessage, completed_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteCheck(id: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("checks").delete().eq("id", id);
  if (error) throw error;
}

export async function listChecks(filters: CheckListFilters = {}): Promise<CheckListItem[]> {
  const supabase = getSupabase();
  let query = supabase
    .from("checks")
    .select("id, company_id, client_name, created_by, fiscal_year, period_type, status, created_at, completed_at")
    .order("created_at", { ascending: false });

  if (filters.companyId) query = query.eq("company_id", filters.companyId);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.periodType) query = query.eq("period_type", filters.periodType);
  if (filters.createdBy) query = query.eq("created_by", filters.createdBy);
  if (filters.dateFrom) query = query.gte("created_at", filters.dateFrom);
  if (filters.dateTo) query = query.lte("created_at", filters.dateTo);

  const { data: checks, error } = await query;
  if (error) throw error;
  if (!checks || checks.length === 0) return [];

  const checkIds = checks.map((c) => c.id as string);
  const { data: findings, error: findingsError } = await supabase
    .from("findings")
    .select("check_id, status, severity")
    .in("check_id", checkIds);
  if (findingsError) throw findingsError;

  const countsByCheck = new Map<string, { total: number; critical: number; medium: number; minor: number }>();
  for (const f of findings ?? []) {
    const checkId = f.check_id as string;
    const bucket = countsByCheck.get(checkId) ?? { total: 0, critical: 0, medium: 0, minor: 0 };
    // "match" is the legacy (pre-v6.1) name for what is now "pass" — findings created
    // before the rollout still carry it in the DB.
    if (f.status !== "match" && f.status !== "pass") bucket.total += 1;
    if (f.severity === "critical") bucket.critical += 1;
    if (f.severity === "medium") bucket.medium += 1;
    if (f.severity === "minor") bucket.minor += 1;
    countsByCheck.set(checkId, bucket);
  }

  return checks.map((row) => {
    const counts = countsByCheck.get(row.id as string) ?? { total: 0, critical: 0, medium: 0, minor: 0 };
    return {
      id: row.id as string,
      companyId: (row.company_id as string) ?? null,
      clientName: row.client_name as string,
      createdBy: (row.created_by as string) ?? null,
      fiscalYear: row.fiscal_year as string,
      periodType: row.period_type as PeriodType,
      status: row.status as CheckStatus,
      createdAt: row.created_at as string,
      completedAt: (row.completed_at as string) ?? null,
      totalFindings: counts.total,
      criticalCount: counts.critical,
      mediumCount: counts.medium,
      minorCount: counts.minor,
    };
  });
}

export async function countChecksSince(isoDate: string): Promise<number> {
  const supabase = getSupabase();
  const { count, error } = await supabase
    .from("checks")
    .select("id", { count: "exact", head: true })
    .gte("created_at", isoDate);
  if (error) throw error;
  return count ?? 0;
}

// Master Prompt v6.1 — Mục 15 (đối chiếu phiên bản liền kề): thay vì bắt người dùng
// upload lại một bản Draft/Issue riêng, tự lấy lượt kiểm tra hoàn tất gần nhất trước
// đó của CÙNG công ty để dùng làm bản đối chiếu — tận dụng chính báo cáo VN/EN đã tải
// lên ở lượt kiểm tra trước.
export async function getPreviousCheckForCompany(
  companyId: string,
  excludeCheckId: string
): Promise<Check | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("checks")
    .select("*")
    .eq("company_id", companyId)
    .eq("status", "done")
    .neq("id", excludeCheckId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToCheck(data) : null;
}

export async function listDistinctReviewers(): Promise<string[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("checks").select("created_by").not("created_by", "is", null);
  if (error) throw error;
  return Array.from(new Set((data ?? []).map((r) => r.created_by as string))).sort();
}
