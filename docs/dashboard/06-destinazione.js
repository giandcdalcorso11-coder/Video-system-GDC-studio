"use strict";
/* ===== Binding dei dati ai nodi (data-bind + data-cam) ===== */
const batClass = (b) => (b < 20 ? "low" : b < 40 ? "mid" : "");
/* ===== Trasferimento file dalla camera (diretto, con controllo di integrità) ===== */
const FS = typeof window.showDirectoryPicker === "function";
const Dest = { mode: FS ? store.get("gdc.dest", "folder") : "device", handle: null, health: null, checking: false,
  // prova reale: scrive e cancella un piccolo file nella cartella (disco scollegato, pieno o permesso scaduto si vedono subito)
  async check() {
    if (this.mode !== "folder" || !this.handle) return null; if (this.checking) return this.health; this.checking = true; let h;
    try {
      let p = "denied"; try { p = await this.handle.queryPermission({ mode: "readwrite" }); } catch { /* ok */ }
      if (p !== "granted") h = { ok: false, why: "permesso", msg: "la cartella chiede di nuovo il permesso: tocca “Verifica cartella”" };
      else { const fh = await this.handle.getFileHandle(".gdc-prova", { create: true }), w = await fh.createWritable(); await w.write(new Uint8Array(4096)); await w.close(); await this.handle.removeEntry(".gdc-prova"); h = { ok: true, msg: "raggiungibile e scrivibile" }; }
    } catch (e) { h = { ok: false, why: e.name, msg: e.name === "QuotaExceededError" ? "il disco è pieno" : e.name === "NotFoundError" ? "cartella non trovata: disco scollegato o spento?" : `la cartella non risponde (${e.name})` }; }
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
{ const m = store.get("gdc.memTest", null); if (m && m.running) { store.set("gdc.memTest", null); dbg("error", "memoria", `LA PROVA DI MEMORIA PRECEDENTE SI È INTERROTTA: la pagina si era richiusa dopo aver retto ${m.mb} MB (il passo successivo non è riuscito)`); log("", `La prova di memoria precedente si è interrotta dopo ${m.mb} MB: è il limite di questo dispositivo.`); } }
if (FS) kv.get("dir").then((hd) => { if (hd) { Dest.handle = hd; dbg("info", "file", `cartella ricordata: ${hd.name}`); Xfer.refresh(); Dest.check(); } }).catch(() => {});
setInterval(() => { if (typeof Xfer !== "undefined" && Dest.mode === "folder" && Dest.handle && !Xfer.active().some((j) => j.state === "in corso")) Dest.check(); }, 15000);
const fmtMB = (b) => (b / 1048576 >= 100 ? Math.round(b / 1048576) : (b / 1048576).toFixed(1)) + " MB";
