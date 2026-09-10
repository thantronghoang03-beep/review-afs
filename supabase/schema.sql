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
  -- v6.1: hồ sơ pháp lý mở rộng — giấy phép con, ưu đãi thuế, hợp đồng thuê đất...
  -- (Mục 9A), tùy chọn, có thể nhiều file. (Mục 15 — đối chiếu phiên bản liền kề —
  -- không cần cột riêng: server tự lấy báo cáo hoàn tất gần nhất trước đó của cùng
  -- công ty, xem getPreviousCheckForCompany() trong checks-repository.ts.)
  file_legal_dossier_paths    jsonb,

  status                   text not null default 'processing',
  error_message            text,

  categories_checked_json  jsonb,

  claude_model             text,
  claude_input_tokens      integer,
  claude_output_tokens     integer,
  claude_cache_read_tokens integer,
  raw_ai_response_json     jsonb,
  -- v6.1 Mục 14 điểm 5: tóm tắt cuối lượt review, hiển thị trong note-box.
  overall_notes            text,

  -- Người dùng chọn chạy tác vụ nào khi tạo kiểm tra mới (ít nhất 1 trong 2 phải bật).
  -- "Phân tích rủi ro báo cáo tài chính" là một tính năng độc lập với review v6.1 —
  -- tính tỷ số tài chính + cảnh báo rủi ro, không liên quan đối chiếu VN/EN.
  run_audit_review         boolean not null default true,
  run_risk_analysis        boolean not null default false,
  risk_analysis_json       jsonb,
  -- Mô tả hoạt động công ty do người dùng nhập (nguyên tắc doanh thu, giá vốn, chi
  -- phí...) khi tick "Phân tích rủi ro báo cáo tài chính" — tùy chọn, dùng làm bối cảnh
  -- cho AI khi đánh giá rủi ro.
  business_description     text,

  created_at               timestamptz not null default now(),
  started_at               timestamptz,
  completed_at             timestamptz
);

create table if not exists findings (
  id            text primary key,
  check_id      text not null references checks(id) on delete cascade,
  section       text not null,
  -- v6.1: which of the 17 Mục 14-điểm-6 display groups this finding belongs to (e.g.
  -- 'bcdkt', 'hieu_luc_phap_ly') — used to render the detail table grouped/ordered per
  -- spec. Named group_name, not "group" (a reserved SQL keyword).
  group_name    text,
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

-- v6.1: adds the legal-dossier column to a `checks` table created by an earlier
-- version of this schema. `create table if not exists` above is a no-op once the table
-- already exists, so this ALTER is what actually applies the new column on re-run.
-- (An earlier revision of this file also added file_draft_prev_path — since dropped
-- from the app; if you already ran that version the column is simply unused now, safe
-- to leave or `alter table checks drop column if exists file_draft_prev_path;`.)
alter table checks add column if not exists file_legal_dossier_paths jsonb;
alter table findings add column if not exists group_name text;
alter table checks add column if not exists overall_notes text;
alter table checks add column if not exists run_audit_review boolean not null default true;
alter table checks add column if not exists run_risk_analysis boolean not null default false;
alter table checks add column if not exists risk_analysis_json jsonb;
alter table checks add column if not exists business_description text;

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
