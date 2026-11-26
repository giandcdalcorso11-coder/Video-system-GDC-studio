"use strict";
/* ===== Registro attività (locale + inviato alla dashboard) ===== */
const LOGMAX = 4000, dbgBuf = [], dbgOut = []; let dbgOpen = false, dbgTimer = 0, rt = null;
const sj = (x) => { try { return typeof x === "string" ? x : JSON.stringify(x); } catch { return String(x); } };
function dbg(level, msg, extra) {
  const line = { t: Date.now(), l: level, m: String(msg) + (extra !== undefined ? " " + sj(extra) : "") };
  dbgBuf.push(line); if (dbgBuf.length > LOGMAX) dbgBuf.shift(); if (window.GDC_DEV) GDC_DEV.push(line.t, level, line.m); dbgOut.push(line); if (dbgOut.length > 600) dbgOut.shift();
  if (dbgOpen && !dbgTimer) dbgTimer = setTimeout(() => { dbgTimer = 0; renderDbg(); }, 400);
}
const fmtLine = (x) => `${new Date(x.t).toISOString().slice(11, 23)} [${x.l}] ${x.m}`;
function renderDbg() { const pre = $("dbgPre"); pre.textContent = dbgBuf.slice(-300).map(fmtLine).join("\n"); pre.scrollTop = pre.scrollHeight; }
function flushDbg() { if (rt && rt.status && /^connesso/.test(rt.status) && dbgOut.length) { const lines = dbgOut.splice(0, 40); rt.send("dbg", { id: ID, lines }); } }
async function copyText(text, btn) {
  const done = () => { if (btn) { const o = btn.dataset.o || btn.textContent; btn.dataset.o = o; btn.textContent = "Copiato ✓"; setTimeout(() => (btn.textContent = o), 1500); } };
  try { await navigator.clipboard.writeText(text); done(); return; } catch { /* provo il metodo alternativo */ }
  try { const ta = document.createElement("textarea"); ta.value = text; ta.style.cssText = "position:fixed;top:0;left:0;opacity:0"; document.body.appendChild(ta); ta.focus(); ta.select(); const ok = document.execCommand("copy"); ta.remove(); if (ok) { done(); return; } } catch { /* ok */ }
  prompt("Copia questo testo", text.slice(0, 20000));
}
addEventListener("error", (e) => { dbg("error", `errore pagina: ${e.message} @${(e.filename || "").split("/").pop()}:${e.lineno}`); });
addEventListener("unhandledrejection", (e) => { dbg("error", `promessa rifiutata: ${e.reason?.name || ""} ${e.reason?.message || e.reason}`); });
const PageWatch = { hiddenAt: document.hidden ? Date.now() : 0, last: Date.now(), lagN: 0, lagMax: 0,
  state() { return `${document.visibilityState}${document.hasFocus && document.hasFocus() ? ", con focus" : ", senza focus"}`; },
  hiddenFor() { return this.hiddenAt ? Math.round((Date.now() - this.hiddenAt) / 1000) : 0; } };
addEventListener("focus", () => dbg("trace", "focus: la pagina è attiva")); addEventListener("blur", () => dbg("trace", `focus perso (${document.visibilityState})`));
setInterval(() => { const n = Date.now(), gap = n - PageWatch.last; PageWatch.last = n; if (gap > 2500) { PageWatch.lagN++; PageWatch.lagMax = Math.max(PageWatch.lagMax, Math.round(gap / 1000)); dbg("warn", `timer in ritardo: ${(gap / 1000).toFixed(1)} s invece di 1 s [${PageWatch.state()}${PageWatch.hiddenAt ? `, nascosta da ${PageWatch.hiddenFor()} s` : ""}${recording ? ", in REC" : ""}]`); } }, 1000);
document.addEventListener("visibilitychange", () => { if (document.hidden) { PageWatch.hiddenAt = Date.now(); dbg("info", `visibilità: nascosta [${PageWatch.state()}${recording ? ", in REC" : ""}${xferBusy ? ", con trasferimento" : ""}]`); } else { const s = PageWatch.hiddenFor(); PageWatch.hiddenAt = 0; dbg("info", `visibilità: di nuovo visibile dopo ${s} s${PageWatch.lagN ? `; timer in ritardo ${PageWatch.lagN} volte (massimo ${PageWatch.lagMax} s)` : ""}`); PageWatch.lagN = 0; PageWatch.lagMax = 0; } if (document.visibilityState === "visible") { setTimeout(() => { try { stageFit("ritorno in primo piano"); } catch { /* ok */ } }, 700); if (stream) wakeOn(); db.reset(); loadSessions(); publish(); setTimeout(() => autoOpen("ritorno in primo piano"), 800); } });
addEventListener("pagehide", (e) => { dbg("info", `pagehide persisted=${e.persisted}`); if (!e.persisted && !CAM_DUP) Lease.release(); });
addEventListener("pageshow", (e) => { dbg("info", `pageshow persisted=${e.persisted}`); if (e.persisted) { if (!CAM_DUP) { if (Lease.other()) { superseded(); return; } Lease.write(); } db.reset(); loadSessions(); publish(); } });
addEventListener("online", () => dbg("info", "rete: online")); addEventListener("offline", () => dbg("warn", "rete: offline"));
document.addEventListener("freeze", () => dbg("warn", "pagina congelata dal browser")); document.addEventListener("resume", () => dbg("info", "pagina ripresa"));
