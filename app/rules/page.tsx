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

export default async function RulesPage() {
  const { data: rules, error } = await supabase
    .from("compliance_rules")
    .select("*")
    .order("category")
    .order("id");

  if (error) {
    return (
      <main className="mx-auto max-w-3xl p-8">
        <h1 className="text-2xl font-semibold">Compliance rule pack</h1>
        <p className="mt-4 text-destructive">
          Couldn&apos;t load rules: {error.message}
        </p>
      </main>
    );
  }

  if (!rules || rules.length === 0) {
    return (
      <main className="mx-auto max-w-3xl p-8">
        <h1 className="text-2xl font-semibold">Compliance rule pack</h1>
        <p className="mt-4 text-muted-foreground">
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
    <main className="mx-auto max-w-3xl space-y-10 p-8">
      <div>
        <h1 className="text-2xl font-semibold">Compliance rule pack</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          A simplified, plain-English rule pack for a prototype — not legal
          advice, and not a complete compliance reference.
        </p>
      </div>

      {[...byCategory.entries()].map(([category, categoryRules]) => (
        <section key={category} className="space-y-4">
          <h2 className="text-lg font-medium">{category}</h2>
          <Separator />
          <div className="space-y-4">
            {categoryRules.map((rule) => (
              <Card key={rule.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle>{rule.title}</CardTitle>
                      <CardDescription>
                        {rule.id} · {rule.authority}
                      </CardDescription>
                    </div>
                    <Badge variant={SEVERITY_VARIANT[rule.severity_default as keyof typeof SEVERITY_VARIANT] ?? "outline"}>
                      {rule.severity_default}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p>{rule.plain_english_rule}</p>
                  {rule.example_violation && (
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">
                        Violation:
                      </span>{" "}
                      {rule.example_violation}
                    </p>
                  )}
                  {rule.example_fix && (
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">Fix:</span>{" "}
                      {rule.example_fix}
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
