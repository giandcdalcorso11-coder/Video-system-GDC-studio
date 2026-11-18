import fs from "node:fs";
import path from "node:path";
import { DOCS, results } from "../lib.mjs";
export const name = "Struttura e sintassi: pagine, moduli e numeri di versione";
const ok = (name, cond, detail = "") => results.push({ name, ok: !!cond, detail: cond ? "" : String(detail) });
const valido = (src) => { try { new Function(src); return ""; } catch (e) { return e.message; } };
export async function run() {
  for (const page of ["camera", "dashboard"]) {
    const html = fs.readFileSync(path.join(DOCS, page + ".html"), "utf8");
    const pv = html.match(/PAGE_VERSION = "([^"]+)"/);
    ok(`${page}.html: ha un numero di versione`, pv, "PAGE_VERSION mancante");
    const corto = pv ? pv[1].split(" ").pop() : "?";
    const tags = [...html.matchAll(/<script defer src="(\w+\/[\w-]+\.js)\?v=([^"]+)"><\/script>/g)];
    ok(`${page}.html: i moduli usano defer (scaricati insieme, eseguiti in ordine: nessuna esecuzione a metà)`, !/<script src="(camera|dashboard)\//.test(html), "ci sono moduli senza defer");
    ok(`${page}.html: carica i moduli della cartella ${page}/`, tags.length >= 10, tags.length);
    ok(`${page}.html: tutti i moduli hanno lo stesso ?v= della versione (${corto}), così Safari non mescola file vecchi e nuovi`, tags.every((t) => t[2] === corto), tags.filter((t) => t[2] !== corto).map((t) => t[1] + "?v=" + t[2]).join(", "));
    const files = fs.readdirSync(path.join(DOCS, page)).filter((f) => f.endsWith(".js")).map((f) => `${page}/${f}`).sort();
    ok(`${page}/: ogni modulo presente nella cartella è caricato dalla pagina e viceversa`, JSON.stringify(files) === JSON.stringify(tags.map((t) => t[1]).sort()), `cartella: ${files.length}, pagina: ${tags.length}`);
    const locali = [...html.matchAll(/<script src="([\w.\/-]+\.js)(\?v=[^"]*)?"><\/script>/g)];
    ok(`${page}.html: anche rt.js, dev.js, xfer.js e qr.js hanno ?v= uguale alla versione`, locali.length >= 3 && locali.every((m) => m[2] === "?v=" + corto), locali.map((m) => m[1] + (m[2] || "")).join(", "));
    const ordine = tags.map((t) => t[1]); ok(`${page}.html: i moduli sono caricati in ordine numerico`, JSON.stringify(ordine) === JSON.stringify([...ordine].sort()), ordine.join(" "));
    for (const f of files) {
      const src = fs.readFileSync(path.join(DOCS, f), "utf8"), err = valido(src);
      ok(`${f}: sintassi valida`, !err, err); ok(`${f}: parte con "use strict"`, src.startsWith('"use strict";'));
    }
  }
  for (const f of ["xfer.js", "dev.js", "rt.js", "qr.js"]) { const err = valido(fs.readFileSync(path.join(DOCS, f), "utf8")); ok(`${f} è valido`, !err, err); }
}
