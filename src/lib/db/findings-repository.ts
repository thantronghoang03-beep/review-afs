import { nanoid } from "nanoid";
import { getSupabase } from "@/lib/supabase/client";
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

export async function insertFindings(inputs: InsertFindingInput[]): Promise<void> {
  if (inputs.length === 0) return;
  const supabase = getSupabase();
  const rows = inputs.map((input) => ({
    id: `fnd_${nanoid(12)}`,
    check_id: input.checkId,
    section: input.section,
    field_label: input.fieldLabel,
    page_vn: input.pageVn,
    page_en: input.pageEn,
    content_vn: input.contentVn,
    content_en: input.contentEn,
    status: input.status,
    category: input.category,
    severity: input.severity,
    note: input.note,
    display_order: input.displayOrder,
  }));
  const { error } = await supabase.from("findings").insert(rows);
  if (error) throw error;
}

export async function listFindingsForCheck(checkId: string): Promise<Finding[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("findings")
    .select("*")
    .eq("check_id", checkId)
    .order("display_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToFinding);
}
