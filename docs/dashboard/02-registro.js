"use strict";
/* ===== Registro attività avanzato ===== */
const ADVMAX = 6000, adv = []; let advOpen = false, advTimer = 0;
const sj = (x) => { try { return typeof x === "string" ? x : JSON.stringify(x); } catch { return String(x); } };
const rid = () => Math.random().toString(36).slice(2, 7);
function scheduleAdv() { if (advOpen && !advTimer) advTimer = setTimeout(() => { advTimer = 0; renderAdv(); }, 400); }
function dbg(level, src, msg, extra) { const x = { t: Date.now(), l: level, s: src, m: String(msg) + (extra !== undefined ? " " + sj(extra) : "") }; adv.push(x); if (adv.length > ADVMAX) adv.shift(); if (window.GDC_DEV) GDC_DEV.push(x.t, x.l, `${x.s}: ${x.m}`); scheduleAdv(); }
const fmtAdv = (x) => `${new Date(x.t).toISOString().slice(11, 23)} [${x.l}] ${x.s}: ${x.m}`;
const advSorted = () => adv.map((x, i) => [x, i]).sort((a, b) => a[0].t - b[0].t || a[1] - b[1]).map((x) => x[0]);
function advHeader() {
  const cams = cameras.map((c) => ({ id: c.id, nome: camTitle(c), fp: c.fp, stato: state[c.id] }));
  return [`REGISTRO ATTIVITÀ AVANZATO · ${PAGE_VERSION} · ${new Date().toISOString()}`,
    `modalità: ${REAL ? (MOCK_RT ? "simulazione locale (mock)" : "Supabase") : "simulazione"} · canale …${pairing ? String(pairing.c).slice(-4) : "-"} · collegamento: ${connStatus}`,
    `ambiente: ${navigator.userAgent} · schermo ${screen.width}x${screen.height}@${devicePixelRatio} · finestra ${innerWidth}x${innerHeight} · fuso ${Intl.DateTimeFormat().resolvedOptions().timeZone}`,
    `presenti nel canale: ${sj(transport.rt ? transport.rt.peers : [])}`, `anteprime attive: ${sj(Preview.active)}`, `camere (stato attuale): ${sj(cams)}`].join("\n");
}
const advText = () => advHeader() + "\n\n" + advSorted().map(fmtAdv).join("\n");
function renderAdv() { const pre = $("#advPre"); if (!pre) return; pre.textContent = advSorted().slice(-400).map(fmtAdv).join("\n"); pre.scrollTop = pre.scrollHeight; }
async function copyText(text, btn) {
  const done = () => { if (btn) { const o = btn.dataset.o || btn.textContent; btn.dataset.o = o; btn.textContent = "Copiato ✓"; setTimeout(() => (btn.textContent = o), 1500); } };
  try { await navigator.clipboard.writeText(text); done(); return; } catch { /* provo il metodo alternativo */ }
  try { const ta = document.createElement("textarea"); ta.value = text; ta.style.cssText = "position:fixed;top:0;left:0;opacity:0"; document.body.appendChild(ta); ta.focus(); ta.select(); const ok = document.execCommand("copy"); ta.remove(); if (ok) { done(); return; } } catch { /* ok */ }
  prompt("Copia questo testo", text.slice(0, 20000));
}
addEventListener("error", (e) => dbg("error", "pagina", `${e.message} @${(e.filename || "").split("/").pop()}:${e.lineno}`));
addEventListener("unhandledrejection", (e) => dbg("error", "pagina", `promessa rifiutata: ${e.reason?.name || ""} ${e.reason?.message || e.reason}`));
/* Controllo della pagina: visibilità, durata in secondo piano, focus, congelamenti e timer rallentati dal browser */
const PageWatch = { hiddenAt: document.hidden ? Date.now() : 0, last: Date.now(), lagN: 0, lagMax: 0,
  state() { return `${document.visibilityState}${document.hasFocus && document.hasFocus() ? ", con focus" : ", senza focus"}`; },
  hiddenFor() { return this.hiddenAt ? Math.round((Date.now() - this.hiddenAt) / 1000) : 0; } };
document.addEventListener("visibilitychange", () => {
  if (document.hidden) { PageWatch.hiddenAt = Date.now(); dbg("info", "pagina", `visibilità: nascosta (finestra o scheda in secondo piano) [${PageWatch.state()}]`); }
  else { const s = PageWatch.hiddenFor(); PageWatch.hiddenAt = 0; dbg("info", "pagina", `visibilità: di nuovo visibile dopo ${s} s${PageWatch.lagN ? `; timer in ritardo ${PageWatch.lagN} volte (massimo ${PageWatch.lagMax} s)` : ""}`); PageWatch.lagN = 0; PageWatch.lagMax = 0; }
});
addEventListener("focus", () => dbg("trace", "pagina", "focus: la finestra è attiva")); addEventListener("blur", () => dbg("trace", "pagina", `focus perso (${document.visibilityState})`));
document.addEventListener("freeze", () => dbg("warn", "pagina", "pagina congelata dal browser")); document.addEventListener("resume", () => dbg("info", "pagina", "pagina ripresa dal congelamento"));
setInterval(() => { const n = Date.now(), gap = n - PageWatch.last; PageWatch.last = n; if (gap > 2500) { PageWatch.lagN++; PageWatch.lagMax = Math.max(PageWatch.lagMax, Math.round(gap / 1000)); dbg("warn", "pagina", `timer in ritardo: ${(gap / 1000).toFixed(1)} s invece di 1 s [${PageWatch.state()}${PageWatch.hiddenAt ? `, nascosta da ${PageWatch.hiddenFor()} s` : ""}]`); } }, 1000);
addEventListener("online", () => dbg("info", "pagina", "rete: online")); addEventListener("offline", () => dbg("warn", "pagina", "rete: offline"));
addEventListener("pageshow", (e) => dbg("info", "pagina", `pageshow persisted=${e.persisted}`)); addEventListener("pagehide", (e) => dbg("info", "pagina", `pagehide persisted=${e.persisted}`));
