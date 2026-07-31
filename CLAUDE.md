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
  page.tsx                        new/active conversation (hero + composer, or the thread)
  /review/[id]/page.tsx           hydrate and continue a past conversation
  /history/page.tsx               past reviews, links into /review/[id]
  /rules/page.tsx                 browsable rule pack
  /api/review/route.ts            POST — starts a thread: runs agent, streams progress
  /api/reviews/route.ts           GET  — review history list
  /api/reviews/[id]/route.ts      GET  — hydrate a full thread (review + findings + messages)
  /api/reviews/[id]/messages/route.ts  POST — follow-up chat turn, token-streamed
/agent
  graph.ts               createDeepAgent(...) configuration
  model.ts                exported model client (also used directly for follow-ups)
  prompts.ts              system prompts (main agent, rewriter sub-agent, follow-up chat)
  buildReviewMessage.ts    builds the turn-1 review prompt
  buildFollowupMessage.ts  builds a follow-up turn's context + prompt
  /tools                  one file per tool
/components
  /chat                  chat-shell, composer, hero, message-list, assistant-turn,
                          rewrite-block, selector-chips, suggestion-chips, sidebar
/lib
  supabase.ts            client
  types.ts               shared types
  reviewStream.ts         NDJSON stream parsing (review + follow-up)
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

-- Follow-up conversation turns only (turn 3+). The first exchange — the
-- original submission and the structured review — is synthesized in the UI
-- from reviews/findings above, not duplicated here. A review row is the
-- conversation thread anchor; there is no separate threads table.
create table messages (
  id uuid primary key default gen_random_uuid(),
  review_id uuid references reviews(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
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

### Follow-up conversation turns

Once a review exists, the user can keep asking questions in the same thread
("why does this violate CLAIM-004", "make the rewrite shorter") without
re-running the full compliance-scan agent. Follow-ups call `model` (from
`agent/model.ts`) directly with no tools and no deepagents graph — grounded in
the stored client profile, original text, findings, and current rewrite via
`buildFollowupMessage.ts`. This keeps Gemini free-tier rate-limit exposure flat
as conversations grow, and — because it has no tool calls — it can use real
token-by-token streaming, unlike the turn-1 review path (see Known failure
modes). The follow-up prompt must not introduce new rule citations beyond what
was already found; it explains, discusses, or revises copy using the given
context, never invents new compliance findings outside `flagViolation`.

## UI

Chat-first: the AI conversation is the product, not a form. One thread per
review; the initial submission and its structured result are turn 1 and turn 2,
after which the user can keep chatting in the same thread.

- Empty state: hero intro + a large message composer (auto-growing textarea,
  Enter to submit, Shift+Enter for newline). Client and content-type are
  floating chips above the composer, required before first submit. Suggestion
  chips populate the composer with example drafts.
- Once submitted, the layout becomes a message list: the user's draft as a
  turn, then the assistant's turn — animated progress steps while the agent
  runs, then the verdict, findings as expandable cards (rule ID, authority,
  explanation, suggested fix), and the rewrite in an editor-style block (copy,
  edit, replace original, export, continue).
- After turn 1, the composer switches to a plain follow-up chat input, and
  further assistant turns stream token-by-token.
- Slim collapsible sidebar (icon-rail when collapsed): New Review, Review
  History, Rules. No large permanent dashboard chrome.

shadcn components: select, textarea, button, badge, card, tabs, skeleton,
separator, scroll-area, sheet, popover, command, accordion, tooltip, sidebar.

Never show a bare spinner for a multi-second agent run — progress steps or
streamed tokens instead.

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
- Rate limits multiplying with conversation length → follow-up turns use a
  single tool-free model call grounded in stored context instead of a full
  agent re-run, keeping Gemini call volume roughly flat per turn regardless of
  thread length
- Token streaming breaking tool-calling → only the tool-free follow-up path
  streams tokens; the turn-1 review path (which does call tools) keeps the
  existing step-progress streaming, since token streaming is documented as
  unreliable there

## Working style

- Propose a plan before non-trivial work. Wait for approval.
- Ask before adding dependencies.
- When something is ambiguous, ask rather than assume.
- Never generate the compliance rule content and treat it as final — flag it for
  human review explicitly.
