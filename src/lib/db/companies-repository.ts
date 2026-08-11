import { nanoid } from "nanoid";
import { getDb } from "./client";

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

export function listCompanies(): Company[] {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM companies ORDER BY name ASC").all() as Record<string, unknown>[];
  return rows.map(rowToCompany);
}

export function getCompany(id: string): Company | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM companies WHERE id = ?").get(id) as
    | Record<string, unknown>
    | undefined;
  return row ? rowToCompany(row) : null;
}

export function createCompany(name: string): Company {
  const db = getDb();
  const id = `co_${nanoid(10)}`;
  db.prepare("INSERT INTO companies (id, name) VALUES (?, ?)").run(id, name);
  return getCompany(id)!;
}
