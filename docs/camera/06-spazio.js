"use strict";
/* ===== Spazio: quanto si può ancora registrare, avvisi, arresto sicuro e liberazione facoltativa ===== */
const RESERVE = 200 * 1048576, SPACE = { quota: null, usage: null, at: 0, measuredMB: store.get("gdc.spaceMeasured", null), level: "ok", freed: 0 };
const bytesPerMin = () => (Number(cfg.bps) + 128000) / 8 * 60;
const storedBytes = () => sessions.reduce((a, s) => a + (s.bytes || 0), 0) + (recording && !sessions.some((s) => s.id === recording.sid) ? recording.bytes : 0) + (tl ? tl.bytes : 0);
async function spaceRefresh() {
  try { if (navigator.storage && navigator.storage.estimate) { const e = await navigator.storage.estimate(); SPACE.quota = e.quota; SPACE.usage = e.usage; } } catch { /* ok */ }
  SPACE.at = Date.now();
}
function spaceInfo() {
  const used = storedBytes(); let avail = Infinity; const basis = [];
  if (SPACE.quota != null && SPACE.usage != null) { avail = Math.min(avail, SPACE.quota - SPACE.usage - RESERVE); basis.push("quota del browser"); }
  const cap = SPACE.measuredMB ? SPACE.measuredMB * 1048576 * 0.9 : (IS_IOS || SPACE.quota == null ? MAX_BUF : null); // senza misura: limite prudente su iOS e dove il browser non stima la quota
  if (cap != null) { avail = Math.min(avail, cap - used); basis.push(SPACE.measuredMB ? "limite misurato" : "limite prudente"); }
  if (!isFinite(avail)) return { known: false, used, basis: "non misurabile" };
  avail = Math.max(0, avail); const budget = used + avail, pct = budget ? used / budget : 0, minLeft = avail / bytesPerMin();
  const level = pct >= 0.95 || minLeft < 5 ? "crit" : pct >= 0.8 || minLeft < 15 ? "warn" : "ok";
  return { known: true, used, avail, budget, pct, minLeft, level, basis: basis.join(" + ") };
}
function spaceState() {
  const i = spaceInfo(), o = { known: i.known, autoFree: !!cfg.autoFree, measuredMB: SPACE.measuredMB, freedMB: Math.round(SPACE.freed / 1048576), quotaMB: SPACE.quota != null ? Math.round(SPACE.quota / 1048576) : null, usageMB: SPACE.usage != null ? Math.round(SPACE.usage / 1048576) : null, usedMB: Math.round(i.used / 1048576), basis: i.basis };
  if (i.known) Object.assign(o, { availMB: Math.round(i.avail / 1048576), minLeft: Math.floor(i.minLeft), level: i.level, pct: Math.round(i.pct * 100) });
  return o;
}
const spaceText = () => { const i = spaceInfo(); return i.known ? `<span class="${i.level === "ok" ? "" : "err"}">circa ${Math.floor(i.minLeft)} min (${Math.round(i.avail / 1048576)} MB)</span>` : "non misurabile"; };
// elimina le clip più vecchie già trasferite e verificate (stato "inviata"), mai le altre
async function spaceFree(targetBytes) {
  const done = sessions.filter((s) => s.status === "inviata").sort((a, b) => a.start - b.start); let freedNow = 0;
  for (const s of done) {
    const i = spaceInfo(); if (i.known && i.avail >= targetBytes) break;
    try { await db.delSession(s.id); } catch (e) { dbg("warn", `spazio: clip ${s.id} non eliminata: ${e.name}`); continue; }
    const b = s.bytes || 0; SPACE.freed += b; freedNow += b; if (SPACE.usage != null) SPACE.usage = Math.max(0, SPACE.usage - b); sessions = sessions.filter((x) => x.id !== s.id);
    dbg("info", `spazio: eliminata la clip ${s.id} (già trasferita e verificata), liberati ${(b / 1048576).toFixed(0)} MB`);
  }
  if (freedNow) renderClips();
  return freedNow;
}
let spaceBusy = false;
async function spaceTick() {
  if (spaceBusy) return; spaceBusy = true;
  try {
    await spaceRefresh(); let i = spaceInfo();
    if (cfg.autoFree && i.known && i.level !== "ok" && sessions.some((s) => s.status === "inviata")) { await spaceFree(Math.min(i.budget * 0.5, 30 * bytesPerMin())); await spaceRefresh(); i = spaceInfo(); }
    if (i.known && i.level !== SPACE.level) { dbg(i.level === "crit" ? "error" : i.level === "warn" ? "warn" : "info", `spazio: livello ${SPACE.level} → ${i.level} (circa ${Math.floor(i.minLeft)} min, ${Math.round(i.avail / 1048576)} MB, ${Math.round(i.pct * 100)}% del disponibile)`, { base: i.basis }); SPACE.level = i.level; publish(); }
  } catch (e) { dbg("warn", `spazio: controllo non riuscito: ${e.name}: ${e.message}`); }
  spaceBusy = false;
}
// misura lo spazio realmente scrivibile nell'archivio del browser (fino a 4 GB) e lo ricorda
async function spaceMeasure() {
  if (recording || tl || spaceBusy) { dbg("warn", "misura spazio: non possibile durante una registrazione"); return; }
  spaceBusy = true; const btn = $("spaceTest"); btn.disabled = true; const cap = (window.__spaceCapMB || 4096) * 1048576, step = 32 * 1048576, name = "gdc-space-test", t0 = performance.now();
  try {
    await spaceRefresh(); dbg("info", "=== INIZIO MISURA SPAZIO ===", { quotaMB: SPACE.quota != null ? Math.round(SPACE.quota / 1048576) : "n/d", usatoMB: SPACE.usage != null ? Math.round(SPACE.usage / 1048576) : "n/d", tettoProvaMB: 4096, ua: navigator.userAgent });
    await new Promise((r) => { const q = indexedDB.deleteDatabase(name); q.onsuccess = q.onerror = q.onblocked = () => r(); });
    const d = await new Promise((res, rej) => { const q = indexedDB.open(name, 1); q.onupgradeneeded = () => q.result.createObjectStore("f", { autoIncrement: true }); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); });
    const buf = new Uint8Array(step); for (let i = 0; i < buf.length; i += 4096) buf[i] = (i >> 12) & 255;
    let written = 0, err = null;
    while (written < cap) {
      try { await new Promise((res, rej) => { const t = d.transaction("f", "readwrite"); t.objectStore("f").put(new Blob([buf])); t.oncomplete = res; t.onerror = () => rej(t.error); t.onabort = () => rej(t.error || new Error("transazione annullata")); }); written += step; btn.textContent = `Misura spazio: ${Math.round(written / 1048576)} MB`; }
      catch (e) { err = e; break; }
    }
    d.close(); await new Promise((r) => { const q = indexedDB.deleteDatabase(name); q.onsuccess = q.onerror = q.onblocked = () => r(); });
    const mb = Math.floor(written / 1048576); SPACE.measuredMB = mb; store.set("gdc.spaceMeasured", mb); await spaceRefresh();
    dbg("info", "=== MISURA SPAZIO COMPLETATA ===", { scrittiMB: mb, esito: err ? `fermata da errore ${err.name}: ${err.message}` : "tetto di prova raggiunto senza errori (lo spazio reale è almeno questo)", secondi: Math.round((performance.now() - t0) / 1000), quotaMB: SPACE.quota != null ? Math.round(SPACE.quota / 1048576) : "n/d" });
  } catch (e) { dbg("error", `misura spazio fallita: ${e.name}: ${e.message}`); }
  btn.disabled = false; btn.textContent = "Misura spazio reale"; spaceBusy = false; publish();
}
