// Strumenti comuni delle prove: server locale delle pagine, browser con camera finta, controlli.
import { createRequire } from "node:module";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
export const DOCS = path.join(here, "..", "docs");
const req = createRequire(import.meta.url);

function load(mod) {
  const dirs = [process.env.PLAYWRIGHT_DIR, undefined, "/opt/node22/lib/node_modules", "/usr/local/lib/node_modules_global"].filter((d, i) => i === 1 || d);
  for (const d of dirs) { try { return d ? req(path.join(d, mod)) : req(mod); } catch { /* prossimo */ } }
  return null;
}
export const playwright = () => { const m = load("playwright"); if (!m) throw new Error("Playwright non trovato: esegui `npm install` nella cartella tests oppure imposta PLAYWRIGHT_DIR"); return m; };
export const jsqrPath = () => { for (const d of [here, process.env.PLAYWRIGHT_DIR].filter(Boolean)) { const p = path.join(d, "node_modules", "jsqr", "dist", "jsQR.js"); if (fs.existsSync(p)) return p; } return null; };

const b64u = (s) => Buffer.from(s).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const MIME = { ".js": "text/javascript", ".html": "text/html", ".css": "text/css" };

// Si ripete in ogni pagina: cartella finta (disco scollegabile/pieno), hash dei file, caduta della connessione dati
const INIT = ({ approve, welcomed }) => {
  try { if (welcomed) localStorage.setItem("gdc.welcomed", "true"); if (!approve) localStorage.setItem("gdc.approve", "false"); } catch { /* ok */ }
  window.__fs = {}; window.__gone = false; window.__full = "";
  window.__mkDir = (name) => {
    const files = (window.__fs[name] = window.__fs[name] || {}), gone = () => { if (window.__gone) { const e = new Error("gone"); e.name = "NotFoundError"; throw e; } }, full = (b) => { if (window.__full === name && b.byteLength !== 4096) { const e = new Error("full"); e.name = "QuotaExceededError"; throw e; } };
    return { name,
      async getFileHandle(n, o) { gone(); if (!(n in files) && !(o && o.create)) { const e = new Error("nf"); e.name = "NotFoundError"; throw e; } if (o && o.create) files[n] = files[n] || [];
        return { async createWritable() { gone(); const parts = []; return { async write(b) { gone(); full(b); parts.push(b); }, async close() { gone(); if (parts.length && window.__full === name && parts[0].byteLength !== 4096) { const e = new Error("full"); e.name = "QuotaExceededError"; throw e; } files[n] = parts; }, async abort() {} }; } }; },
      async removeEntry(n) { delete files[n]; }, async queryPermission() { return "granted"; }, async requestPermission() { return "granted"; } };
  };
  window.__real = (name) => Object.entries(window.__fs[name] || {}).filter(([k]) => !k.startsWith("."));
  window.__sha = async (parts) => { const b = new Blob(parts), h = await crypto.subtle.digest("SHA-256", await b.arrayBuffer()); return [b.size, [...new Uint8Array(h)].map((x) => x.toString(16).padStart(2, "0")).join("")]; };
  const os = RTCDataChannel.prototype.send; let n = 0;
  RTCDataChannel.prototype.send = function (d) { if (window.__dropAfter && typeof d !== "string") { n += d.byteLength; if (n > window.__dropAfter) { window.__dropAfter = 0; n = 0; this.close(); return; } } return os.call(this, d); };
};

export const results = [];
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Ambiente di prova: server, browser, canale finto. `fn(t)` riceve gli strumenti. */
export async function withEnv(opts, fn) {
  const o = { approve: false, welcomed: true, ...opts };
  const srv = http.createServer((q, r) => { const f = path.join(DOCS, q.url.split("?")[0]); if (!f.startsWith(DOCS) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; } const ritardo = typeof o.delay === "function" ? o.delay(q.url) : 0; setTimeout(() => { r.writeHead(200, { "content-type": MIME[path.extname(f)] || "application/octet-stream" }); r.end(fs.readFileSync(f)); }, ritardo || 0); });
  await new Promise((res) => srv.listen(0, res)); const base = `http://localhost:${srv.address().port}`;
  const code = "gdc1." + b64u(JSON.stringify({ u: "https://fake.supabase.test", k: "k", c: ("t" + Math.random().toString(36).slice(2) + "0000000000000000").slice(0, 24) }));
  const br = await playwright().chromium.launch({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] });
  const ctx = await br.newContext({ permissions: ["camera", "microphone"] });
  await ctx.addInitScript(INIT, { approve: o.approve, welcomed: o.welcomed });
  await ctx.route("https://**", (r) => r.abort());
  const errs = [], t = { base, code, ctx, errs, o };
  const watch = (p, id) => { p.on("pageerror", (e) => errs.push(`${id}: ${e.message}${process.env.TEST_STACK ? " @ " + String(e.stack).split("\n").slice(1, 5).join(" <- ") : ""}`)); p.on("requestfailed", (r) => { if (r.url().startsWith(base)) errs.push(`${id}: richiesta fallita ${r.url()} (${r.failure() && r.failure().errorText})`); }); p.on("response", (r) => { if (r.url().startsWith(base) && r.status() >= 400) errs.push(`${id}: risposta ${r.status()} per ${r.url()}`); }); p.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errs.push(`${id}: console: ${m.text()}`); }); };
  t.check = (name, ok, detail = "") => results.push({ name, ok: !!ok, detail: ok ? "" : String(detail) });
  t.until = async (f, ms = 20000, step = 250) => { const end = Date.now() + ms; for (;;) { let v; try { v = await f(); } catch { v = false; } if (v) return v; if (Date.now() > end) return false; await sleep(step); } };
  t.dash = async (q = "&dev=1") => { const p = await ctx.newPage(); watch(p, "dashboard"); await p.goto(`${base}/dashboard.html?mock=1${q}#${code}`); await t.until(() => p.evaluate(() => typeof Join !== "undefined" && typeof Xfer !== "undefined")); return p; };
  t.cam = async (id, c = {}) => { const p = await ctx.newPage(); watch(p, "camera " + id); if (c.init) await p.addInitScript(c.init); await p.goto(`${base}/camera.html?mock=1${c.name ? "&name=" + encodeURIComponent(c.name) : ""}#${code}~${id}`); await t.until(() => p.evaluate(() => typeof db !== "undefined" && typeof sessions !== "undefined")); return p; };
  /** la camera è collegata alla regia e accesa */
  t.ready = (dash, id) => t.until(() => dash.evaluate((id) => state[id] && state[id].online && state[id].camReady, id), 25000);
  /** registra per `s` secondi e aspetta che la clip sia salvata */
  t.rec = async (cam, s) => { await cam.evaluate(() => document.getElementById("recBtn").click()); await t.until(() => cam.evaluate(() => !!recording)); await sleep(s * 1000); await cam.evaluate(() => document.getElementById("recBtn").click()); await t.until(() => cam.evaluate(() => !recording && sessions.length && sessions[0].status !== "in corso")); await sleep(500); };
  t.clipHash = (cam, sid) => cam.evaluate(async (sid) => { const keys = await db.chunkKeys(sid), bl = []; for (const k of keys) bl.push(await db.getChunk(k)); return window.__sha(bl); }, sid);
  try { await fn(t); } finally { t.check("nessun errore di pagina", errs.length === 0, errs.join(" | ")); await br.close(); srv.close(); }
}
