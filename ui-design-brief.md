# ClaimGuard UI design brief

The current interface works but reads as a scaffold: uniform type sizes, flat
cards, and no moment where the product feels like it has delivered a verdict.
This brief is the direction for making it feel like a working professional tool.

Keep everything that already exists — the severity color system, Geist
Sans/Mono, the slate-blue accent, the no-decorative-motion rule. This is
refinement, not a redesign.

---

## The core problem

Right now every element has roughly the same visual weight. A compliance review
has a natural dramatic arc — you submit copy, the agent works, and it returns a
verdict. The interface should follow that arc. At the moment it returns a list.

Three things need to carry more weight than they currently do:

1. The verdict (overall risk)
2. The findings, as structured objects rather than stacked paragraphs
3. The rewrite, as the payoff

---

## 1. Typography scale

Currently almost everything is `text-xs` / `text-sm`. Introduce real hierarchy:

| Element | Treatment |
|---|---|
| Verdict | `text-2xl`, semibold, severity-colored |
| Panel headers ("Findings", "Rewrite") | `text-sm`, medium, muted, uppercase tracking-wide |
| Finding rule ID | `text-sm`, mono, medium |
| Finding title | `text-sm`, medium |
| Body text (explanations, draft) | `text-sm`, `leading-relaxed` — this is reading text, give it room |
| Metadata (authority, category) | `text-xs`, muted |

The draft text in the centre panel is the thing a marketer actually reads
closely. It should be comfortable: `leading-relaxed`, generous line length, not
cramped against the panel edge.

---

## 2. The verdict block

When a review completes, the findings panel should open with a substantial
verdict block, not a small badge:

- Large severity-colored risk level ("High Risk" / "Needs Revision" / "Pass")
- Beneath it, a plain-language line: "4 issues found — 3 high, 1 medium"
- Beneath that, the agent's own summary sentence
- A thin severity-colored rule or left border tying it to the color system

This is the single most important output of the product. It should read as a
verdict, not a label.

For a `pass` result, this block is the whole payoff — make it feel like a clear
all-clear, calm and confident, using the reserved green.

---

## 3. Finding cards

Give each card real internal structure instead of stacked text:

```
┌─────────────────────────────────────────┐
│▌ GUAR-001              Outcome guarantees│   ← severity stripe on left edge
│  FTC Act §5 · state board rules     High │   ← metadata row + severity badge
│                                          │
│  Promising a guaranteed clinical result  │   ← explanation, leading-relaxed
│  is deceptive and violates advertising   │
│  rules.                                  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ SUGGESTED FIX                      │  │   ← visually distinct sub-block,
│  │ Designed to brighten your smile;   │  │     subtle background tint
│  │ results vary by patient.           │  │
│  └────────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

Key changes:
- A 3px severity-colored stripe on the left edge of each card, so the panel is
  scannable by severity without reading a word
- The suggested fix in its own tinted sub-block — it's a different kind of
  content (proposed text, not analysis) and should look like it
- Metadata (authority, category) demoted to a quiet row, not competing with the
  explanation
- Consistent internal padding; tighter between related elements, looser between
  sections

---

## 4. Original vs rewrite as a comparison

Currently the rewrite is a card at the bottom of the findings panel. It's the
product's payoff and deserves better placement.

Option A (preferred): once a review completes, the centre panel gains a toggle —
**Original** / **Rewritten** — so the marketer can flip between them in place
and see the same text with and without the problems. The highlights disappear in
the rewritten view. This makes the value obvious in one interaction and demos
extremely well.

Option B: keep the rewrite in the right panel but give it a proper header, a
copy button in the header rather than below, and clear visual separation from
the findings list above it.

Go with A if it can be done cleanly. It is the single strongest visual argument
for what this product does.

---

## 5. The streaming state

The progress log is the moment the product feels alive, and it's currently a
plain list of strings. Make it feel like a machine working:

- Each completed step gets a small check mark and settles to muted
- The current step is the only one at full contrast
- Steps append downward, no layout jump when a new one arrives
- On completion the log collapses to a single summary line ("Reviewed in 34s —
  6 steps") that can be expanded

No spinners, no skeleton shimmer competing with the log. The log *is* the
loading state.

---

## 6. Client context should be visible

Once a client is selected, show their context persistently — a compact chip or
line near the top of the workspace:

```
Maple Street Dental · dental · TX · warm and reassuring
```

Two reasons. It reminds the marketer what lens the review is being run through.
And it makes visible, to anyone evaluating this, that the agent is working from
real domain context rather than generic prompting — which is otherwise invisible
in the UI.

---

## 7. Layout proportions

The three columns currently read as roughly equal. They shouldn't be:

- **Left (form):** fixed narrow width, ~320px. It's an input panel, not a
  content panel.
- **Centre (draft):** the largest share. This is where reading happens.
- **Right (findings):** comfortable but secondary, independently scrollable so
  long finding lists don't push the page.

On the empty state, the whole layout should feel deliberately composed rather
than three boxes waiting for content.

---

## 8. Empty state

Make it a genuine introduction rather than a placeholder line:

- One clear sentence on what the tool does and who it's for
- The example drafts as small clickable cards with a label and a one-line
  description ("Flagrant — guarantees, unsourced stats, and absolute safety
  claims"), not bare text links
- A quiet line pointing to the rule pack: "Reviews are checked against 27 rules
  across 7 categories — browse the rule pack"

Someone landing here cold should understand the product in five seconds without
running anything.

---

## 9. Details that separate polished from adequate

- Consistent border radius across cards, inputs, and badges
- Cards: a single subtle border, no heavy shadows in dark mode
- Hover states on anything clickable, including finding cards and highlighted
  spans
- Visible focus rings for keyboard use (accessibility, and it reads as
  considered)
- The highlighted spans should have a subtle underline in addition to the
  background tint — color alone shouldn't carry the meaning
- Generous vertical rhythm between sections; tight within them

---

## What not to do

- No gradients, glows, or glassmorphism
- No animated transitions beyond hover and the progress log appending
- No icons for decoration — only where they carry meaning (the check marks in
  the progress log, the copy button)
- No marketing-page patterns: no hero, no feature grid, no testimonial section
- Don't change the color system. It was chosen deliberately and it works.

---

## Verification

Screenshot each state in a real browser and check it — not just the code:

1. Empty state
2. Mid-stream (progress log running)
3. Completed review with findings (high risk)
4. Completed review with no findings (pass)
5. Error state

Use mock data where possible rather than spending live agent runs.
