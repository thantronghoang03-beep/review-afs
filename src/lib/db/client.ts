import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "review-afs.db");
const SCHEMA_PATH = path.join(process.cwd(), "src", "lib", "db", "schema.sql");

declare global {
  var __reviewAfsDb: DatabaseSync | undefined;
}

function columnExists(db: DatabaseSync, table: string, column: string): boolean {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  return rows.some((r) => r.name === column);
}

// Additive migration for columns introduced after the initial schema — CREATE TABLE IF NOT EXISTS
// won't add columns to an already-existing table, so new columns need an explicit ALTER TABLE.
function migrate(db: DatabaseSync): void {
  if (!columnExists(db, "checks", "company_id")) {
    db.exec("ALTER TABLE checks ADD COLUMN company_id TEXT REFERENCES companies(id) ON DELETE SET NULL");
  }
  if (!columnExists(db, "checks", "created_by")) {
    db.exec("ALTER TABLE checks ADD COLUMN created_by TEXT");
  }
  // Must run after the ALTERs above — an index on company_id can't be created before the
  // column exists, which rules out putting this in schema.sql (see comment there).
  db.exec("CREATE INDEX IF NOT EXISTS idx_checks_company_id ON checks(company_id)");
}

function createDb(): DatabaseSync {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const db = new DatabaseSync(DB_PATH);
  db.exec("PRAGMA foreign_keys = ON;");
  const schema = fs.readFileSync(SCHEMA_PATH, "utf-8");
  db.exec(schema);
  migrate(db);
  return db;
}

// Cached on globalThis so Next.js dev-mode module reloads don't open the file repeatedly.
export function getDb(): DatabaseSync {
  if (!globalThis.__reviewAfsDb) {
    globalThis.__reviewAfsDb = createDb();
  }
  return globalThis.__reviewAfsDb;
}

export function uploadsDirFor(checkId: string): string {
  return path.join(DATA_DIR, "uploads", checkId);
}
