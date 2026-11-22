"use strict";
/* ===== Binding dei dati ai nodi (data-bind + data-cam) ===== */
const batClass = (b) => (b < 20 ? "low" : b < 40 ? "mid" : "");
/* ===== Trasferimento file dalla camera (diretto, con controllo di integrità) ===== */
const FS = typeof window.showDirectoryPicker === "function";
const withTimeout = (p, ms, what) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(Object.assign(new Error(what), { name: "Timeout" })), ms))]);
const Dest = { mode: FS ? store.get("gdc.dest", "folder") : "device", handle: null, health: null, checking: false,
  // prova reale: scrive e cancella un piccolo file nella cartella (disco scollegato, pieno o permesso scaduto si vedono subito)
  async check() {
    if (this.mode !== "folder" || !this.handle) return null; if (this.checking) return this.health; this.checking = true; let h;
    this.checkAt = Date.now();
    try {
      let p = "denied"; try { p = await withTimeout(this.handle.queryPermission({ mode: "readwrite" }), 6000, "permesso"); } catch (x) { if (x.name === "Timeout") throw x; }
      if (p !== "granted") h = { ok: false, why: "permesso", msg: "la cartella chiede di nuovo il permesso: tocca “Verifica cartella”" };
      else await withTimeout((async () => { const fh = await this.handle.getFileHandle(".gdc-prova", { create: true }), w = await fh.createWritable(); await w.write(new Uint8Array(4096)); await w.close(); await this.handle.removeEntry(".gdc-prova"); h = { ok: true, msg: "raggiungibile e scrivibile" }; })(), 15000, "scrittura");
    } catch (e) { h = { ok: false, why: e.name, msg: e.name === "Timeout" ? e.message === "permesso" ? "la cartella non risponde da oltre 6 s (permesso): dopo aver riaperto la pagina il browser deve ridare il permesso. Tocca “Cambia cartella” e scegli di nuovo la stessa cartella (basta una volta), oppure controlla che il disco sia collegato" : `la cartella non risponde da oltre 15 s (${e.message}): disco scollegato o in sospensione?` : e.name === "QuotaExceededError" ? "il disco è pieno" : e.name === "NotFoundError" ? "cartella non trovata: disco scollegato o spento?" : `la cartella non risponde (${e.name})` }; }
    finally { this.checking = false; }
    const was = this.health; this.health = h;
    if (!was || was.ok !== h.ok || was.msg !== h.msg) { dbg(h.ok ? "info" : "warn", "file", `cartella ${this.handle.name}: ${h.msg}`); if (was) log("", h.ok ? `Cartella “${this.handle.name}” di nuovo raggiungibile` : `Cartella “${this.handle.name}”: ${h.msg}`); Xfer.refresh(); renderPreflight(); if (h.ok) Xfer.autoAll(); }
    return h;
  } };
const kv = (() => {
  let h = null; const open = () => h ? Promise.resolve(h) : new Promise((res, rej) => { const r = indexedDB.open("gdc-dash", 1); r.onupgradeneeded = () => r.result.createObjectStore("kv"); r.onsuccess = () => res((h = r.result)); r.onerror = () => rej(r.error); });
  return { get: (k) => open().then((d) => new Promise((res, rej) => { const q = d.transaction("kv").objectStore("kv").get(k); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); })),
    set: (k, v) => open().then((d) => new Promise((res, rej) => { const t = d.transaction("kv", "readwrite"); t.objectStore("kv").put(v, k); t.oncomplete = res; t.onerror = () => rej(t.error); })) };
})();
// avvii all'apertura della pagina: si lanciano da 16-avvio.js, quando tutti i moduli sono stati caricati
function destAvvio() {
  { const m = store.get("gdc.memTest", null); if (m && m.running) { store.set("gdc.memTest", null); dbg("error", "memoria", `LA PROVA DI MEMORIA PRECEDENTE SI È INTERROTTA: la pagina si era richiusa dopo aver retto ${m.mb} MB (il passo successivo non è riuscito)`); log("", `La prova di memoria precedente si è interrotta dopo ${m.mb} MB: è il limite di questo dispositivo.`); } }
  if (FS) kv.get("dir").then((hd) => { if (hd) { Dest.handle = hd; dbg("info", "file", `cartella ricordata: ${hd.name}`); Xfer.refresh(); Dest.check(); } }).catch(() => {});
  setInterval(() => { if (typeof Xfer !== "undefined" && Dest.mode === "folder" && Dest.handle && !Xfer.active().some((j) => j.state === "in corso")) Dest.check(); }, 15000);
}
const fmtMB = (b) => (b / 1048576 >= 100 ? Math.round(b / 1048576) : (b / 1048576).toFixed(1)) + " MB";
