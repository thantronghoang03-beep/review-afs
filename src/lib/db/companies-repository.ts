import { nanoid } from "nanoid";
import { getSupabase } from "@/lib/supabase/client";

export interface Company {
  id: string;
  name: string;
  createdAt: string;
}

function rowToCompany(row: Record<string, unknown>): Company {
  return {
    id: row.id as string,
    name: row.name as string,
    createdAt: row.created_at as string,
  };
}

export async function listCompanies(): Promise<Company[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("companies").select("*").order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToCompany);
}

export async function getCompany(id: string): Promise<Company | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("companies").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? rowToCompany(data) : null;
}

export async function createCompany(name: string): Promise<Company> {
  const supabase = getSupabase();
  const id = `co_${nanoid(10)}`;
  const { error } = await supabase.from("companies").insert({ id, name });
  if (error) throw error;
  return (await getCompany(id))!;
}
