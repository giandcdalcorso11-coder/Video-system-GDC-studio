import fs from "node:fs";
import path from "node:path";
import { DOCS, results } from "../lib.mjs";
export const name = "Sintassi di pagine e script";
export async function run() {
  for (const f of ["camera.html", "dashboard.html"]) {
    const s = fs.readFileSync(path.join(DOCS, f), "utf8"), m = [...s.matchAll(/<script>([\s\S]*?)<\/script>/g)].pop();
    let err = ""; try { new Function(m[1]); } catch (e) { err = e.message; }
    results.push({ name: `${f}: lo script principale è valido`, ok: !err, detail: err });
    const v = s.match(/PAGE_VERSION = "([^"]+)"/); results.push({ name: `${f}: ha un numero di versione`, ok: !!v, detail: "PAGE_VERSION mancante" });
  }
  for (const f of ["xfer.js", "dev.js", "rt.js"]) { let err = ""; try { new Function(fs.readFileSync(path.join(DOCS, f), "utf8")); } catch (e) { err = e.message; } results.push({ name: `${f} è valido`, ok: !err, detail: err }); }
}
