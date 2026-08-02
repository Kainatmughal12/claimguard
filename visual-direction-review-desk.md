# ClaimGuard — visual direction: the review desk

## The problem with the current design

The interface currently reads as a generic AI product: purple gradient
headline, an italic accent word, a large centered hero. This is the default
aesthetic of every AI tool released in the last two years, and it says nothing
about what ClaimGuard is or who uses it.

It also abandons the design system already established in this project — a
restrained slate-blue accent chosen specifically so it would not compete with
the red/amber/green severity colors that carry the product's actual meaning.
The purple now fights that system.

## The direction

ClaimGuard is not a chatbot. It is a **review desk** — the digital equivalent
of handing a draft to a compliance reviewer who marks it up and hands it back.
The visual language should come from professional editorial and legal document
review, not from AI product marketing.

Think: track changes, proofreader's marks, redlines, marked-up manuscripts. A
tool that a marketer opens forty times a week and trusts.

Everything below serves that idea.

---

## 1. Kill the AI-product tells

Remove entirely:
- The purple gradient headline and the italic gradient accent word
- The large centered hero with the glowing icon badge
- Any gradient anywhere in the interface
- Purple as an accent color

Restore the established system: slate-blue accent, severity colors as the only
other chroma on screen.

---

## 2. Typography carries the identity

This is the highest-leverage change and the most distinctive.

**Use a serif for the copy under review.** The draft text, the rewrite, and the
flagged spans should be set in a readable serif — this is the text being
scrutinised, and serif signals "manuscript under review" the way sans signals
"app interface." Something like Source Serif, Newsreader, or Instrument Serif.

**Keep the sans for all UI chrome** — nav, labels, buttons, metadata.

**Keep the mono for rule IDs only** — `GUAR-001` reads as a reference code.

Three typefaces, three clear jobs. This alone will make the product look
considered rather than templated, and it is thematically honest: the serif is
the document, the sans is the tool.

---

## 3. The empty state is a desk, not a landing page

Replace the hero with something a working tool would show:

- A modest heading, left-aligned or lightly centered — no gradient, normal
  weight, `text-xl` at most
- One short line of description
- The composer, prominent
- The example drafts as small cards with a label and one-line description,
  arranged in a row beneath the composer
- A quiet line: "Checked against 27 rules across 7 categories" linking to the
  rule pack

Total vertical space: the composer and examples should sit comfortably in the
upper half of the viewport, not fill it.

---

## 4. Fix the Recent list

Currently five identical entries. Each row needs:

```
Bright Sky Dermatology              ▌High Risk
Ad copy · 4 issues · 2 days ago
```

- Client name, with a severity-colored bar or dot for the verdict
- Second line: content type, finding count, relative date
- Truncated draft excerpt on hover, or as a third muted line

A list where every row looks the same is not a list.

---

## 5. The review result should look like a marked-up document

This is the moment the product proves itself. Design it as such:

- The draft in serif, generous line height, comfortable measure (~70
  characters), on a subtly lighter surface than the page background — like
  paper on a desk
- Flagged spans marked with a severity-colored underline *and* a soft
  background tint, not tint alone. An underline reads as an editorial mark;
  a highlight alone reads as a search result.
- Small superscript markers next to each flagged span (¹ ² ³) linking to the
  numbered finding in the panel — this is exactly how annotated documents work
  and it makes the connection legible without interaction
- The verdict block at the top of the findings panel, weighty, severity-colored

---

## 6. Original / Rewritten as a document comparison

The toggle already exists. Make it feel like comparing two drafts:

- Tab labels: "Original" and "Revised" (revised is the editorial term)
- Same serif, same measure, same surface in both views — only the marks change
- On the revised view, optionally mark the *changed* passages with a subtle
  positive treatment so the marketer can see what moved

---

## 7. Restraint rules

- No gradients, glows, glassmorphism, or blur effects
- No animated transitions beyond hover states and the progress log appending
- Icons only where they carry meaning — no decorative iconography
- One accent color, plus the severity system. Nothing else.
- Borders over shadows. This is a document tool, not a floating-card dashboard.

---

## 8. What "polished" actually means here

Not visual effects. These:

- Consistent spacing rhythm — a real scale (4/8/12/16/24/32), used consistently
- Consistent border radius across every surface
- Optical alignment, not just mathematical — text baselines lining up across
  columns
- Hover and focus states on every interactive element, including flagged spans
  and finding cards
- Nothing shifting position when content loads
- Comfortable line length everywhere text is read

---

## Verification

Screenshot in a real browser, light and dark, at 1440px and 1024px:

1. Empty state
2. Mid-stream
3. Completed review, high risk
4. Completed review, pass
5. Recent list with varied entries

Use mock data. Do not spend live agent runs on visual checks.
