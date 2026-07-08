// Reads ../thesis-wordlist.xlsx (Thai | English | Note) and regenerates
// src/lib/translations.ts. Rows with an empty English cell are skipped.
// Run after editing the Excel file:  node scripts/import-wordlist.js
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "..", "..", "thesis-wordlist.xlsx");
const out = path.join(__dirname, "..", "src", "lib", "translations.ts");

const wb = XLSX.readFile(src);
const ws = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }).slice(1);

const pairs = rows
  .map((r) => [String(r[0] ?? "").trim(), String(r[1] ?? "").trim()])
  .filter(([th, en]) => th && en)
  // Longest Thai phrase first so partial phrases never shadow full ones
  .sort((a, b) => b[0].length - a[0].length);

const body = pairs.map(([th, en]) => `  [${JSON.stringify(th)}, ${JSON.stringify(en)}],`).join("\n");
fs.writeFileSync(
  out,
  `// AUTO-GENERATED from thesis-wordlist.xlsx — do not edit by hand.\n` +
  `// Regenerate with: node scripts/import-wordlist.js\n` +
  `export const TH_EN: [string, string][] = [\n${body}\n];\n`,
  "utf8"
);
console.log(`Wrote ${pairs.length} pairs to ${out}`);
