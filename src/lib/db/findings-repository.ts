import { nanoid } from "nanoid";
import { getDb } from "./client";
import type { Finding, FindingCategory, FindingSeverity, FindingStatus } from "@/types/finding";

interface InsertFindingInput {
  checkId: string;
  section: string;
  fieldLabel: string;
  pageVn: number | null;
  pageEn: number | null;
  contentVn: string | null;
  contentEn: string | null;
  status: FindingStatus;
  category: FindingCategory;
  severity: FindingSeverity | null;
  note: string | null;
  displayOrder: number;
}

function rowToFinding(row: Record<string, unknown>): Finding {
  return {
    id: row.id as string,
    checkId: row.check_id as string,
    section: row.section as string,
    fieldLabel: row.field_label as string,
    pageVn: (row.page_vn as number) ?? null,
    pageEn: (row.page_en as number) ?? null,
    contentVn: (row.content_vn as string) ?? null,
    contentEn: (row.content_en as string) ?? null,
    status: row.status as FindingStatus,
    category: row.category as FindingCategory,
    severity: (row.severity as FindingSeverity) ?? null,
    note: (row.note as string) ?? null,
    displayOrder: row.display_order as number,
  };
}

export function insertFindings(inputs: InsertFindingInput[]): void {
  const db = getDb();
  const stmt = db.prepare(
    `INSERT INTO findings (
      id, check_id, section, field_label, page_vn, page_en,
      content_vn, content_en, status, category, severity, note, display_order
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const input of inputs) {
    stmt.run(
      `fnd_${nanoid(12)}`,
      input.checkId,
      input.section,
      input.fieldLabel,
      input.pageVn,
      input.pageEn,
      input.contentVn,
      input.contentEn,
      input.status,
      input.category,
      input.severity,
      input.note,
      input.displayOrder
    );
  }
}

export function listFindingsForCheck(checkId: string): Finding[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM findings WHERE check_id = ? ORDER BY display_order ASC")
    .all(checkId) as Record<string, unknown>[];
  return rows.map(rowToFinding);
}
