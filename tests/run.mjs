// Lancia tutte le prove in cases/ (o solo quelle il cui nome file corrisponde all'espressione data): node run.mjs [filtro]  es. node run.mjs '^0[12]'
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { results } from "./lib.mjs";

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "cases"), filtro = process.argv[2] || "";
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".mjs") && new RegExp(filtro).test(f)).sort();
let fail = 0, tot = 0; const t0 = Date.now();
for (const f of files) {
  const m = await import(pathToFileURL(path.join(dir, f)).href), start = results.length, t1 = Date.now();
  console.log(`\n▶ ${m.name || f}`);
  try { await m.run(); } catch (e) { results.push({ name: "la prova si è interrotta", ok: false, detail: e.stack || e.message }); }
  for (const r of results.slice(start)) { tot++; if (!r.ok) fail++; console.log(`  ${r.ok ? "✓" : "✗"} ${r.name}${r.ok ? "" : "\n      → " + r.detail}`); }
  console.log(`  (${((Date.now() - t1) / 1000).toFixed(0)} s)`);
}
console.log(`\n${fail ? "FALLITE" : "TUTTE OK"}: ${tot - fail}/${tot} controlli superati in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
process.exit(fail ? 1 : 0);
