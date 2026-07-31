create table clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  specialty text not null,        -- 'dental' | 'dermatology' | 'med_spa' | 'chiropractic'
  state text,
  brand_tone text,
  created_at timestamptz default now()
);

create table compliance_rules (
  id text primary key,            -- readable IDs: 'CLAIM-001', 'TEST-003'
  category text not null,
  title text not null,
  plain_english_rule text not null,
  authority text not null,
  applies_to_specialties text[],  -- null = applies to all
  severity_default text not null, -- 'low' | 'medium' | 'high'
  example_violation text,
  example_fix text
);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id),
  content_type text not null,     -- 'social_post' | 'ad_copy' | 'blog' | 'email'
  original_text text not null,
  rewritten_text text,
  overall_risk text,              -- 'pass' | 'needs_revision' | 'high_risk'
  agent_summary text,
  created_at timestamptz default now()
);

create table findings (
  id uuid primary key default gen_random_uuid(),
  review_id uuid references reviews(id) on delete cascade,
  rule_id text references compliance_rules(id),
  flagged_span text not null,     -- exact substring of original_text
  severity text not null,
  explanation text not null,
  suggested_fix text
);

-- Follow-up conversation turns only (turn 3+). The first exchange — the
-- original submission and the structured review — is synthesized in the UI
-- from the reviews/findings rows above, not duplicated here.
create table messages (
  id uuid primary key default gen_random_uuid(),
  review_id uuid references reviews(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
);

-- Row Level Security: compliance_rules is public reference data (anon read,
-- powers /rules). clients/reviews/findings/messages are server-only — no anon
-- policies, so only the service-role key (which bypasses RLS) can touch them.
alter table clients enable row level security;
alter table compliance_rules enable row level security;
alter table reviews enable row level security;
alter table findings enable row level security;
alter table messages enable row level security;

create policy "Public read access to compliance rules"
  on compliance_rules for select
  using (true);
