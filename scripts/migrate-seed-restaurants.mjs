#!/usr/bin/env node
// One-shot migration: wrap `name`, `description`, `notes`, `reason` string
// literals in `{ en: "...", pl: "..." }` objects so the seed file matches the
// new LocalizedString type. Polish defaults to the English text and gets
// hand-translated below in seed-restaurants.ts directly.
import fs from "node:fs";
import path from "node:path";

const target = path.resolve("src/data/seed-restaurants.ts");
const original = fs.readFileSync(target, "utf-8");

// We only wrap fields that hold human prose. We leave `id`, `slug`, `region`,
// `grape`, `style`, `vintage`, `coverGradient`, `wineId`, `category`, etc.
// untouched.
const fieldsToWrap = ["name", "description", "notes", "reason"];

let next = original;

for (const field of fieldsToWrap) {
  // Match  ` <field>: "..."` or  ` <field>:\n  "..."` (multiline strings via
  // single double-quoted token only — the seed file does not use template
  // literals or back-tick strings).
  const pattern = new RegExp(
    `(\\b${field}:\\s*)("(?:\\\\.|[^"\\\\])*")`,
    "g",
  );
  next = next.replace(pattern, (_, prefix, literal) => {
    return `${prefix}{ en: ${literal}, pl: ${literal} }`;
  });
}

if (next === original) {
  console.error("No replacements made — aborting to avoid silent no-op.");
  process.exit(1);
}

fs.writeFileSync(target, next, "utf-8");
console.log("Migrated seed-restaurants.ts to LocalizedString shape.");
