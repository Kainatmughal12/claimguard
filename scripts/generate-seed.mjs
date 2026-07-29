// Generates supabase/seed.sql from compliance-rules.md (rules) plus a small
// hardcoded set of demo clients. Rerun after editing compliance-rules.md;
// the emitted SQL uses ON CONFLICT so re-applying it is idempotent.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const rulesPath = path.join(rootDir, "compliance-rules.md");
const outPath = path.join(rootDir, "supabase", "seed.sql");

const REQUIRED_FIELDS = ["category", "title", "plainEnglishRule", "authority", "severity"];

function sqlString(value) {
  if (value === null || value === undefined) return "NULL";
  return `'${value.replace(/'/g, "''")}'`;
}

function normalizeWhitespace(text) {
  return text.replace(/\s*\n\s*/g, " ").trim();
}

function extractField(block, label) {
  const re = new RegExp(
    `\\*\\*${label}:\\*\\*\\s*([\\s\\S]*?)(?=\\n\\*\\*(?:Rule|Authority|Severity|Violation|Fix):\\*\\*|$)`,
  );
  const match = block.match(re);
  return match ? normalizeWhitespace(match[1]) : null;
}

function parseRules(markdown) {
  const lines = markdown.split("\n");
  const categoryHeadingRe = /^## Category \d+ — (.+)$/;
  const ruleHeadingRe = /^### (\S+) — (.+)$/;

  const rules = [];
  let currentCategory = null;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const categoryMatch = line.match(categoryHeadingRe);
    if (categoryMatch) {
      currentCategory = categoryMatch[1].trim();
      i++;
      continue;
    }

    const ruleMatch = line.match(ruleHeadingRe);
    if (ruleMatch) {
      const [, id, title] = ruleMatch;
      const blockLines = [];
      i++;
      while (
        i < lines.length &&
        !/^##\s/.test(lines[i]) &&
        !/^###\s/.test(lines[i]) &&
        lines[i].trim() !== "---"
      ) {
        blockLines.push(lines[i]);
        i++;
      }
      const block = blockLines.join("\n");

      const rule = {
        id,
        category: currentCategory,
        title: title.trim(),
        plainEnglishRule: extractField(block, "Rule"),
        authority: extractField(block, "Authority"),
        severity: extractField(block, "Severity")?.toLowerCase() ?? null,
        exampleViolation: extractField(block, "Violation"),
        exampleFix: extractField(block, "Fix"),
      };

      for (const field of REQUIRED_FIELDS) {
        if (!rule[field]) {
          throw new Error(`Rule ${id}: missing required field "${field}"`);
        }
      }

      rules.push(rule);
      continue;
    }

    i++;
  }

  return rules;
}

function ruleInsert(rule) {
  return `insert into compliance_rules (id, category, title, plain_english_rule, authority, applies_to_specialties, severity_default, example_violation, example_fix)
values (${sqlString(rule.id)}, ${sqlString(rule.category)}, ${sqlString(rule.title)}, ${sqlString(rule.plainEnglishRule)}, ${sqlString(rule.authority)}, NULL, ${sqlString(rule.severity)}, ${sqlString(rule.exampleViolation)}, ${sqlString(rule.exampleFix)})
on conflict (id) do update set
  category = excluded.category,
  title = excluded.title,
  plain_english_rule = excluded.plain_english_rule,
  authority = excluded.authority,
  applies_to_specialties = excluded.applies_to_specialties,
  severity_default = excluded.severity_default,
  example_violation = excluded.example_violation,
  example_fix = excluded.example_fix;`;
}

// Fixed UUIDs (generated once) so reseeding via ON CONFLICT stays idempotent,
// and step 3's getClientProfile tool has stable IDs to reference.
const CLIENTS = [
  {
    id: "fcf02b32-e149-4899-8d92-27669cd46ad2",
    name: "Maple Street Dental",
    specialty: "dental",
    state: "OH",
    brand_tone: "warm, reassuring, family-friendly",
  },
  {
    id: "49e97159-0b21-479f-8875-0600b8b67908",
    name: "Bright Sky Dermatology",
    specialty: "dermatology",
    state: "CA",
    brand_tone: "clinical but approachable, confidence-forward",
  },
  {
    id: "84133b03-6ac1-43ba-917d-d38910f1d59f",
    name: "Willow & Glow Med Spa",
    specialty: "med_spa",
    state: "FL",
    brand_tone: "upscale, calming, aspirational",
  },
  {
    id: "4bac44f1-8987-4fb8-91fc-63fc79f83b77",
    name: "Cascade Chiropractic & Wellness",
    specialty: "chiropractic",
    state: "WA",
    brand_tone: "energetic, practical, no-nonsense",
  },
];

function clientInsert(client) {
  return `insert into clients (id, name, specialty, state, brand_tone)
values (${sqlString(client.id)}, ${sqlString(client.name)}, ${sqlString(client.specialty)}, ${sqlString(client.state)}, ${sqlString(client.brand_tone)})
on conflict (id) do update set
  name = excluded.name,
  specialty = excluded.specialty,
  state = excluded.state,
  brand_tone = excluded.brand_tone;`;
}

const markdown = readFileSync(rulesPath, "utf8");
const rules = parseRules(markdown);

if (rules.length === 0) {
  throw new Error("Parsed zero rules from compliance-rules.md — check the file format.");
}

const sql = [
  "-- Generated by scripts/generate-seed.mjs. Do not hand-edit; edit",
  "-- compliance-rules.md (rules) or this script (clients) and regenerate.",
  "",
  `-- ${rules.length} compliance rules`,
  ...rules.map(ruleInsert),
  "",
  `-- ${CLIENTS.length} demo clients (one per specialty)`,
  ...CLIENTS.map(clientInsert),
  "",
].join("\n\n");

writeFileSync(outPath, sql);
console.log(`Wrote ${rules.length} rules and ${CLIENTS.length} clients to ${outPath}`);
