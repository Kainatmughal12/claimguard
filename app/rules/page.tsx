import { supabase } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { ComplianceRule } from "@/lib/types";

const SEVERITY_VARIANT = {
  high: "destructive",
  medium: "secondary",
  low: "outline",
} as const;

// Queries Supabase on every request instead of at build time. Without this,
// Next.js tries to statically prerender the page during `next build`, which
// runs the Supabase query in the build sandbox — if that's unreachable
// (as on Vercel's build step) the build fails with "Failed to collect page
// data" instead of the page just rendering normally at request time.
export const dynamic = "force-dynamic";

export default async function RulesPage() {
  let rules: ComplianceRule[] | null = null;
  let errorMessage: string | null = null;

  try {
    const { data, error } = await supabase
      .from("compliance_rules")
      .select("*")
      .order("category")
      .order("id");

    if (error) {
      errorMessage = error.message;
    } else {
      rules = data;
    }
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : "Unknown error";
  }

  if (errorMessage) {
    return (
      <main className="mx-auto max-w-3xl p-8">
        <h1 className="text-2xl font-semibold tracking-tight">Compliance rule pack</h1>
        <p className="mt-4 text-sm text-destructive">Couldn&apos;t load rules: {errorMessage}</p>
      </main>
    );
  }

  if (!rules || rules.length === 0) {
    return (
      <main className="mx-auto max-w-3xl p-8">
        <h1 className="text-2xl font-semibold tracking-tight">Compliance rule pack</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          No rules found. Has supabase/seed.sql been applied yet?
        </p>
      </main>
    );
  }

  const byCategory = new Map<string, ComplianceRule[]>();
  for (const rule of rules) {
    const list = byCategory.get(rule.category) ?? [];
    list.push(rule);
    byCategory.set(rule.category, list);
  }

  return (
    <main className="mx-auto max-w-3xl space-y-10 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Compliance rule pack</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          A simplified, plain-English rule pack for a prototype — not legal advice, and not a
          complete compliance reference. {rules.length} rules across {byCategory.size} categories.
        </p>
      </div>

      {[...byCategory.entries()].map(([category, categoryRules]) => (
        <section key={category} className="space-y-4">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            {category}
          </h2>
          <Separator />
          <div className="space-y-3">
            {categoryRules.map((rule) => (
              <Card key={rule.id} className="bg-card/50">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle>{rule.title}</CardTitle>
                      <CardDescription className="font-mono text-xs">
                        {rule.id} · {rule.authority}
                      </CardDescription>
                    </div>
                    <Badge variant={SEVERITY_VARIANT[rule.severity_default as keyof typeof SEVERITY_VARIANT] ?? "outline"}>
                      {rule.severity_default}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm leading-relaxed">
                  <p>{rule.plain_english_rule}</p>
                  {rule.example_violation && (
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">Violation:</span>{" "}
                      {rule.example_violation}
                    </p>
                  )}
                  {rule.example_fix && (
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">Fix:</span> {rule.example_fix}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
