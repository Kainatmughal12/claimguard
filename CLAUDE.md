# ClaimGuard — healthcare marketing compliance agent

## What this is

A take-home project: an AI agent that reviews healthcare marketing copy for
compliance risk. A marketer pastes draft content for a clinic client; the agent
flags risky claims, cites the specific rule each one implicates, assigns a
severity, and produces a compliant rewrite that preserves the marketing intent.

Target user: a marketer at a healthcare-focused digital agency writing content
for clinic clients (dental, dermatology, med spa, chiropractic).

Scope discipline: this is a weekend build. One capability, done well. Do not add
auth, multi-tenancy, billing, or user management. Do not add features not listed
in this file without asking first.

## Stack — do not substitute

- Next.js (App Router) + TypeScript
- Tailwind + shadcn/ui
- Supabase (Postgres) for persistence
- `deepagents` (JavaScript — `langchain-ai/deepagentsjs`) for the agent harness,
  which returns a compiled LangGraph graph
- Deployed to Vercel

The agent runs inside Next.js API routes. Single repo, single deploy. Keep the
`/agent` directory free of Next.js imports so it stays architecturally
separable — this is a deliberate decision to defend in review.

## Repo layout

```
/app
  page.tsx              review workspace (main screen)
  /history/page.tsx     past reviews
  /rules/page.tsx       browsable rule pack
  /api/review/route.ts  POST — runs agent, streams progress
  /api/reviews/route.ts GET  — review history
/agent
  graph.ts              createDeepAgent(...) configuration
  prompts.ts            system prompts (main agent + rewriter sub-agent)
  /tools                one file per tool
/lib
  supabase.ts           client
  types.ts              shared types
/supabase
  schema.sql
  seed.sql
```

## Database schema

Source of truth. Do not alter without asking.

```sql
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
```

## Rule pack categories

Seed roughly 20–25 rules across these categories:

| Category | Catches |
|---|---|
| Treatment/outcome claims | Claims a service cures, treats, or prevents disease without substantiation |
| Substantiation | Statistics or efficacy claims with no cited evidence |
| Testimonials & endorsements | Testimonials implying typical results; undisclosed material connections |
| Superlatives & credentials | "Best", "#1", "specialist" where not verifiable |
| Guarantees & risk language | Absolute promises about outcomes or safety |
| Patient privacy | Patient photos, names, or details used without authorization |
| Required disclosures | Missing "individual results vary" or before/after disclaimers |

Authorities to reference: FTC Act §5, FTC Endorsement Guides (16 CFR Part 255),
FDA disease-claim restrictions, HIPAA marketing provisions, state medical board
advertising rules.

IMPORTANT: this is a simplified demo rule pack for a prototype, not legal
advice. Never imply otherwise in UI copy, the README, or generated output. A
production version needs a compliance professional maintaining it and
state-by-state variation.

## Agent design

Main agent = compliance reviewer. Sub-agent = rewriter (isolated context;
receives original text + findings + brand tone, returns compliant copy).

Workflow the system prompt should enforce:
1. Load client context
2. Load applicable rules
3. Scan the text span by span
4. Flag each issue via the tool — never in freeform prose
5. Decide overall risk
6. Delegate the rewrite
7. Persist

### Tool signatures

```ts
getClientProfile(clientId: string)
  -> { name, specialty, state, brandTone }

lookupComplianceRules(categories: string[], specialty: string)
  -> Rule[]

flagViolation(span: string, ruleId: string, severity: 'low'|'medium'|'high',
              explanation: string, suggestedFix: string)
  -> { ok: boolean }

checkSubstantiation(claimText: string)
  -> { requiresEvidence: boolean, reasoning: string }

saveReview(review: ReviewInput, findings: FindingInput[])
  -> { reviewId: string }
```

### Hard constraints

- Every finding MUST cite a `rule_id` that exists in `compliance_rules`.
  Validate on write and drop findings with unknown IDs. This is the primary
  defence against hallucinated regulations.
- `flagged_span` must be an exact substring of `original_text`. If the UI can't
  locate it, degrade gracefully — show the finding without highlighting rather
  than crashing.
- The product suggests; it never auto-publishes. Human stays in the loop.

## UI

Single main screen, three regions:
- Left: client selector, content-type selector, textarea, Review button
- Centre: original text with flagged spans highlighted by severity, clickable
- Right: findings cards (rule ID, authority, explanation, suggested fix), then
  the rewrite with copy-to-clipboard

shadcn components: select, textarea, button, badge, card, tabs, skeleton,
separator, scroll-area.

Stream agent progress to the UI ("retrieved 14 rules… found 3 issues…"). Never
show a bare spinner for a multi-second agent run.

Handle loading, empty, and error states on every screen. A reviewer will click
into a blank state and it should look intentional.

## Conventions

- TypeScript strict. No `any` — use `unknown` and narrow.
- Server components by default; `'use client'` only where interactivity needs it.
- Supabase keys via env vars only, never committed. `.env.example` stays current.
- Small, focused commits after each working phase.
- No comments explaining what code does; comment only non-obvious *why*.

## Build order

Follow this sequence. Do not jump ahead.

1. **De-risk**: scaffold, connect Supabase, one working `createDeepAgent` call
   returning a response from an API route, deployed live on Vercel.
2. **Domain layer**: rule pack written and seeded, `/rules` page to verify it.
3. **Agent**: system prompts, five tools, rewriter sub-agent. Test from a script
   against 6–8 sample drafts (clean, flagrant, borderline).
4. **Wire up**: streaming API route against real agent and real Supabase.
5. **UI**: review workspace, span highlighting, findings, rewrite panel.
6. **Polish**: loading/empty/error states, history page, redeploy, test live.

## Known failure modes to design against

- False positives eroding trust → severity tiers, required rule citations,
  dismissible findings
- Hallucinated rules → validate `rule_id` against the DB on write
- Rewrite drifting off-brand → pass brand tone explicitly, show side by side
- Rule staleness → rules live in the DB, not the prompt
- Latency → stream progress; note rule-lookup caching as future work

## Working style

- Propose a plan before non-trivial work. Wait for approval.
- Ask before adding dependencies.
- When something is ambiguous, ask rather than assume.
- Never generate the compliance rule content and treat it as final — flag it for
  human review explicitly.
