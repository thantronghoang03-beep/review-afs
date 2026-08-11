CREATE TABLE IF NOT EXISTS companies (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS checks (
  id                       TEXT PRIMARY KEY,
  company_id               TEXT REFERENCES companies(id) ON DELETE SET NULL,
  client_name              TEXT NOT NULL,
  created_by               TEXT,
  fiscal_year              TEXT NOT NULL,
  period_current_start     TEXT NOT NULL,
  period_current_end       TEXT NOT NULL,
  period_prior_start       TEXT,
  period_prior_end         TEXT,
  period_type              TEXT NOT NULL,

  file_vn_path             TEXT NOT NULL,
  file_en_path             TEXT NOT NULL,
  file_erc_latest_path     TEXT,
  file_erc_original_path   TEXT,
  file_irc_latest_path     TEXT,
  file_irc_original_path   TEXT,

  status                   TEXT NOT NULL DEFAULT 'processing',
  error_message            TEXT,

  categories_checked_json  TEXT,

  claude_model             TEXT,
  claude_input_tokens      INTEGER,
  claude_output_tokens     INTEGER,
  claude_cache_read_tokens INTEGER,
  raw_ai_response_json     TEXT,

  created_at               TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  started_at               TEXT,
  completed_at             TEXT
);

CREATE TABLE IF NOT EXISTS findings (
  id            TEXT PRIMARY KEY,
  check_id      TEXT NOT NULL REFERENCES checks(id) ON DELETE CASCADE,
  section       TEXT NOT NULL,
  field_label   TEXT NOT NULL,
  page_vn       INTEGER,
  page_en       INTEGER,
  content_vn    TEXT,
  content_en    TEXT,
  status        TEXT NOT NULL,
  category      TEXT NOT NULL,
  severity      TEXT,
  note          TEXT,
  display_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_findings_check_id ON findings(check_id);
CREATE INDEX IF NOT EXISTS idx_findings_severity  ON findings(check_id, severity);
CREATE INDEX IF NOT EXISTS idx_checks_created_at  ON checks(created_at DESC);
-- idx_checks_company_id intentionally NOT here — it references a column added via migration
-- for pre-existing databases, and creating it here (before that migration runs) would fail
-- with "no such column" on any db file created before company_id existed. See client.ts migrate().
