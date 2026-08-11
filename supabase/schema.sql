-- Review AFS — Supabase (Postgres) schema.
-- Run this once in the Supabase Dashboard: Project → SQL Editor → paste → Run.
-- Safe to re-run (every statement is idempotent).

create table if not exists companies (
  id         text primary key,
  name       text not null,
  created_at timestamptz not null default now()
);

create table if not exists checks (
  id                       text primary key,
  company_id               text references companies(id) on delete set null,
  client_name              text not null,
  created_by               text,
  fiscal_year              text not null,
  period_current_start     text not null,
  period_current_end       text not null,
  period_prior_start       text,
  period_prior_end         text,
  period_type              text not null,

  file_vn_path             text not null,
  file_en_path             text not null,
  file_erc_latest_path     text,
  file_erc_original_path  text,
  file_irc_latest_path    text,
  file_irc_original_path  text,

  status                   text not null default 'processing',
  error_message            text,

  categories_checked_json  jsonb,

  claude_model             text,
  claude_input_tokens      integer,
  claude_output_tokens     integer,
  claude_cache_read_tokens integer,
  raw_ai_response_json     jsonb,

  created_at               timestamptz not null default now(),
  started_at               timestamptz,
  completed_at             timestamptz
);

create table if not exists findings (
  id            text primary key,
  check_id      text not null references checks(id) on delete cascade,
  section       text not null,
  field_label   text not null,
  page_vn       integer,
  page_en       integer,
  content_vn    text,
  content_en    text,
  status        text not null,
  category      text not null,
  severity      text,
  note          text,
  display_order integer not null default 0
);

create index if not exists idx_findings_check_id on findings(check_id);
create index if not exists idx_findings_severity  on findings(check_id, severity);
create index if not exists idx_checks_created_at  on checks(created_at desc);
create index if not exists idx_checks_company_id  on checks(company_id);

-- Lock every table down by default. The app talks to Supabase only from trusted
-- server code using the service_role key, which bypasses RLS entirely — these
-- policies exist so the anon/public key (if ever used) cannot read or write anything.
alter table companies enable row level security;
alter table checks     enable row level security;
alter table findings   enable row level security;
