"use client";

import { cn } from "@/lib/utils";
import type { ContentType } from "@/lib/types";

export const EXAMPLE_DRAFTS: {
  label: string;
  contentType: ContentType;
  text: string;
}[] = [
  {
    label: "Facebook ad — teeth whitening",
    contentType: "ad_copy",
    text: "Guaranteed to whiten your teeth in just 3 days — 100% safe, no risk, and clinically proven! Join thousands of happy patients.",
  },
  {
    label: "Instagram caption — new patient special",
    contentType: "social_post",
    text: "New patient special this month — book your first cleaning and exam with us today!",
  },
  {
    label: "Email campaign — med spa results",
    contentType: "email",
    text: "Our patients see dramatic, permanent results after just one session — no downtime, no side effects, guaranteed or your money back.",
  },
  {
    label: "Landing page — chiropractic care",
    contentType: "blog",
    text: "Dr. Smith is the #1 rated chiropractor in the state and can cure your chronic back pain permanently, as seen in this patient testimonial: \"I was in a wheelchair and after two visits I was completely healed.\"",
  },
];

interface SuggestionChipsProps {
  onSelect: (draft: { contentType: ContentType; text: string }) => void;
  disabled?: boolean;
  className?: string;
}

export function SuggestionChips({ onSelect, disabled, className }: SuggestionChipsProps) {
  return (
    <div className={cn("flex flex-wrap justify-center gap-2", className)}>
      {EXAMPLE_DRAFTS.map((draft) => (
        <button
          key={draft.label}
          type="button"
          disabled={disabled}
          onClick={() => onSelect({ contentType: draft.contentType, text: draft.text })}
          className="inline-flex items-center rounded-full border border-border/70 bg-card/40 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
        >
          {draft.label}
        </button>
      ))}
    </div>
  );
}
