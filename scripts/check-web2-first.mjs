// Easy Ride — Web2-first guard (M24)
// Enforces the product's #1 hard rule: NO blockchain terminology in user-facing
// UI. Scans .tsx under src/app and src/components for forbidden terms that can
// actually RENDER — i.e. JSX text nodes and human-prose string literals. It
// deliberately ignores code identifiers (`const wallet`, `wallet?.status`,
// `getWalletSummary`), import paths, comments, and non-prose strings (CSS
// classes, enum values, URLs) so it flags copy, not internals.
// Allowed surface for technical terms: Settings → Advanced only (those labels
// are already neutral). Exits non-zero on any finding so it can gate a deploy.
//
// Run:  node scripts/check-web2-first.mjs

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOTS = ["src/app", "src/components"].map((p) => resolve(process.cwd(), p));

// High-signal forbidden terms (whole-word, case-insensitive). camelCase
// identifiers like `getWalletSummary` do NOT match `\bwallet\b` (no word
// boundary mid-identifier), so internal code names are safe by construction.
const FORBIDDEN = [
  "wallet", "blockchain", "crypto", "smart contract", "on-chain", "onchain",
  "web3", "metamask", "ethereum", "seed phrase", "private key", "gas fee",
  "gwei", "transaction hash",
];
const PATTERN = new RegExp(`\\b(${FORBIDDEN.join("|")})\\b`, "i");

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (full.endsWith(".tsx")) out.push(full);
  }
  return out;
}

function isSkippable(line) {
  const t = line.trim();
  return (
    t.startsWith("import ") ||
    t.startsWith("//") ||
    t.startsWith("/*") ||
    t.startsWith("*") ||
    t.includes("{/*") || // JSX comment line
    /\bfrom\s+["']/.test(t)
  );
}

// A string literal counts as human prose only if it reads like a sentence/label:
// contains a space OR starts with a capital letter. This skips CSS classes,
// enum values, URLs, and lowercase identifiers-as-strings.
function isProse(s) {
  return /\s/.test(s.trim()) || /^[A-Z]/.test(s.trim());
}

// Extract only the renderable text from a line: prose string literals + JSX text
// (tag/expression residue on tag-bearing lines).
function renderableText(line) {
  const chunks = [];

  // 1) Prose string literals.
  const strRe = /"([^"]*)"|'([^']*)'|`([^`]*)`/g;
  let m;
  while ((m = strRe.exec(line)) !== null) {
    const s = m[1] ?? m[2] ?? m[3] ?? "";
    if (isProse(s)) chunks.push(s);
  }

  // 2) JSX text — only on lines that actually carry a tag, with tags, JSX
  //    expressions, and strings stripped out so identifiers don't leak in.
  if (/<\/?[A-Za-z]/.test(line)) {
    const text = line
      .replace(/<[^>]*>/g, " ")
      .replace(/\{[^}]*\}/g, " ")
      .replace(/"[^"]*"|'[^']*'|`[^`]*`/g, " ");
    chunks.push(text);
  }

  return chunks.join("  ");
}

const findings = [];
for (const root of ROOTS) {
  let files;
  try {
    files = walk(root);
  } catch {
    continue; // root may not exist
  }
  for (const file of files) {
    const lines = readFileSync(file, "utf8").split("\n");
    lines.forEach((line, i) => {
      if (isSkippable(line)) return;
      const m = renderableText(line).match(PATTERN);
      if (m) {
        findings.push({ file, line: i + 1, term: m[1], text: line.trim() });
      }
    });
  }
}

if (findings.length) {
  console.error(`✗ Web2-first violation — forbidden term(s) in user-facing UI:\n`);
  for (const f of findings) {
    console.error(`  ${f.file}:${f.line}  [${f.term}]  ${f.text}`);
  }
  console.error(
    `\nUse consumer language instead (Easy Ride Balance, Protected Payment,` +
      ` Secure Ride Lock, Digital Receipt). Technical details belong only in` +
      ` Settings → Advanced.`,
  );
  process.exit(1);
}

console.log("✓ Web2-first check passed — no blockchain terms in user-facing UI.");
