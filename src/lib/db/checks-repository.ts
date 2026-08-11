import { nanoid } from "nanoid";
import { getDb } from "./client";
import type {
  Check,
  CheckListItem,
  CheckListFilters,
  CheckStatus,
  PeriodType,
  CheckFilePaths,
} from "@/types/check";
import type { CategoriesChecked } from "@/types/finding";

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
    status: row.status as CheckStatus,
    errorMessage: (row.error_message as string) ?? null,
    categoriesChecked: row.categories_checked_json
      ? (JSON.parse(row.categories_checked_json as string) as CategoriesChecked)
      : null,
    claudeModel: (row.claude_model as string) ?? null,
    claudeInputTokens: (row.claude_input_tokens as number) ?? null,
    claudeOutputTokens: (row.claude_output_tokens as number) ?? null,
    claudeCacheReadTokens: (row.claude_cache_read_tokens as number) ?? null,
    createdAt: row.created_at as string,
    startedAt: (row.started_at as string) ?? null,
    completedAt: (row.completed_at as string) ?? null,
  };
}

export function createCheck(input: CreateCheckInput): Check {
  const db = getDb();
  const id = input.id;
  db.prepare(
    `INSERT INTO checks (
      id, company_id, client_name, created_by, fiscal_year, period_current_start, period_current_end,
      period_prior_start, period_prior_end, period_type,
      file_vn_path, file_en_path, file_erc_latest_path, file_erc_original_path,
      file_irc_latest_path, file_irc_original_path, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'processing')`
  ).run(
    id,
    input.companyId,
    input.clientName,
    input.createdBy,
    input.fiscalYear,
    input.periodCurrentStart,
    input.periodCurrentEnd,
    input.periodPriorStart,
    input.periodPriorEnd,
    input.periodType,
    input.files.fileVnPath,
    input.files.fileEnPath,
    input.files.fileErcLatestPath,
    input.files.fileErcOriginalPath,
    input.files.fileIrcLatestPath,
    input.files.fileIrcOriginalPath
  );
  return getCheck(id)!;
}

export function getCheck(id: string): Check | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM checks WHERE id = ?").get(id) as
    | Record<string, unknown>
    | undefined;
  return row ? rowToCheck(row) : null;
}

export function markCheckStarted(id: string): void {
  const db = getDb();
  db.prepare(
    "UPDATE checks SET started_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?"
  ).run(id);
}

export function markCheckDone(
  id: string,
  data: {
    categoriesChecked: CategoriesChecked;
    claudeModel: string;
    claudeInputTokens: number;
    claudeOutputTokens: number;
    claudeCacheReadTokens: number;
    rawAiResponseJson: string;
  }
): void {
  const db = getDb();
  db.prepare(
    `UPDATE checks SET
      status = 'done',
      categories_checked_json = ?,
      claude_model = ?,
      claude_input_tokens = ?,
      claude_output_tokens = ?,
      claude_cache_read_tokens = ?,
      raw_ai_response_json = ?,
      completed_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
    WHERE id = ?`
  ).run(
    JSON.stringify(data.categoriesChecked),
    data.claudeModel,
    data.claudeInputTokens,
    data.claudeOutputTokens,
    data.claudeCacheReadTokens,
    data.rawAiResponseJson,
    id
  );
}

export function markCheckError(id: string, errorMessage: string): void {
  const db = getDb();
  db.prepare(
    `UPDATE checks SET status = 'error', error_message = ?, completed_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`
  ).run(errorMessage, id);
}

export function deleteCheck(id: string): void {
  const db = getDb();
  db.prepare("DELETE FROM checks WHERE id = ?").run(id);
}

export function listChecks(filters: CheckListFilters = {}): CheckListItem[] {
  const db = getDb();
  const conditions: string[] = [];
  const params: Array<string> = [];

  if (filters.companyId) {
    conditions.push("c.company_id = ?");
    params.push(filters.companyId);
  }
  if (filters.status) {
    conditions.push("c.status = ?");
    params.push(filters.status);
  }
  if (filters.periodType) {
    conditions.push("c.period_type = ?");
    params.push(filters.periodType);
  }
  if (filters.createdBy) {
    conditions.push("c.created_by = ?");
    params.push(filters.createdBy);
  }
  if (filters.dateFrom) {
    conditions.push("c.created_at >= ?");
    params.push(filters.dateFrom);
  }
  if (filters.dateTo) {
    conditions.push("c.created_at <= ?");
    params.push(filters.dateTo);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const rows = db
    .prepare(
      `SELECT
        c.id, c.company_id, c.client_name, c.created_by, c.fiscal_year, c.period_type, c.status, c.created_at, c.completed_at,
        (SELECT COUNT(*) FROM findings f WHERE f.check_id = c.id AND f.status != 'match') AS total_findings,
        (SELECT COUNT(*) FROM findings f WHERE f.check_id = c.id AND f.severity = 'critical') AS critical_count,
        (SELECT COUNT(*) FROM findings f WHERE f.check_id = c.id AND f.severity = 'medium') AS medium_count,
        (SELECT COUNT(*) FROM findings f WHERE f.check_id = c.id AND f.severity = 'minor') AS minor_count
      FROM checks c
      ${whereClause}
      ORDER BY c.created_at DESC`
    )
    .all(...params) as Record<string, unknown>[];

  return rows.map((row) => ({
    id: row.id as string,
    companyId: (row.company_id as string) ?? null,
    clientName: row.client_name as string,
    createdBy: (row.created_by as string) ?? null,
    fiscalYear: row.fiscal_year as string,
    periodType: row.period_type as PeriodType,
    status: row.status as CheckStatus,
    createdAt: row.created_at as string,
    completedAt: (row.completed_at as string) ?? null,
    totalFindings: row.total_findings as number,
    criticalCount: row.critical_count as number,
    mediumCount: row.medium_count as number,
    minorCount: row.minor_count as number,
  }));
}

export function countChecksSince(isoDate: string): number {
  const db = getDb();
  const row = db
    .prepare("SELECT COUNT(*) as n FROM checks WHERE created_at >= ?")
    .get(isoDate) as { n: number };
  return row.n;
}

export function listDistinctReviewers(): string[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT DISTINCT created_by FROM checks WHERE created_by IS NOT NULL ORDER BY created_by ASC")
    .all() as Array<{ created_by: string }>;
  return rows.map((r) => r.created_by);
}
