// A masthead, not a landing-page hero — left-aligned like a letterhead, with
// a rule closing it off from the composer below. The one deliberate use of
// the serif outside reviewed copy: this is the document's own title, not
// interface chrome.
export function Hero() {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <p className="text-[0.7rem] font-medium tracking-[0.22em] text-primary/80 uppercase">
        ClaimGuard · Compliance desk
      </p>
      <h1 className="mt-3 text-balance font-serif text-4xl leading-[1.1] font-normal tracking-tight sm:text-5xl">
        Review marketing copy for compliance risk
      </h1>
      <p className="mt-4 max-w-lg text-sm leading-relaxed text-foreground/75 sm:text-base">
        Paste a social post, ad, blog section, or email — ClaimGuard flags compliance
        risks, cites the rule, and hands back a compliant rewrite.
      </p>
      <div className="mt-7 h-px w-full bg-border" />
    </div>
  );
}
