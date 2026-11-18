"use strict";
/* ===== Archivio locale: pezzi della registrazione e registrazioni (IndexedDB, con riapertura automatica) ===== */
const db = (() => {
  let h = null; const mem = { chunks: new Map(), sessions: new Map(), frames: new Map() };
  const open = () => h ? Promise.resolve(h) : new Promise((res, rej) => {
    const r = indexedDB.open("gdc-camera", 2);
    r.onupgradeneeded = () => { const d = r.result; if (!d.objectStoreNames.contains("chunks")) d.createObjectStore("chunks"); if (!d.objectStoreNames.contains("sessions")) d.createObjectStore("sessions", { keyPath: "id" }); if (!d.objectStoreNames.contains("frames")) d.createObjectStore("frames"); };
    r.onsuccess = () => { h = r.result; h.onclose = () => { dbg("warn", "IndexedDB: connessione chiusa dal browser"); h = null; }; h.onversionchange = () => { dbg("warn", "IndexedDB: versionchange"); try { h.close(); } catch { /* ok */ } h = null; }; res(h); };
    r.onerror = () => rej(r.error); r.onblocked = () => dbg("warn", "IndexedDB: apertura bloccata");
  });
  const run = async (fn) => {
    let last;
    for (let i = 0; i < 3; i++) {
      try { return await fn(await open()); }
      catch (e) { last = e; if (i < 2 && ["InvalidStateError", "TransactionInactiveError", "UnknownError", "AbortError"].includes(e.name)) { dbg("warn", `IndexedDB ${e.name} (${e.message}): riapro e riprovo ${i + 1}/2`); try { h && h.close(); } catch { /* ok */ } h = null; await sleep(200 * (i + 1)); continue; } throw e; }
    }
    throw last;
  };
  const rq = (r) => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  const done = (t) => new Promise((res, rej) => { t.oncomplete = res; t.onerror = () => rej(t.error); t.onabort = () => rej(t.error || new Error("transazione annullata")); });
  const range = (sid) => IDBKeyRange.bound(sid + ":", sid + ":￿");
  return {
    reset() { try { h && h.close(); } catch { /* ok */ } h = null; },
    async selfTest() {
      const t0 = performance.now();
      try { await run(async (d) => { const t = d.transaction("chunks", "readwrite"); t.objectStore("chunks").put(new Blob(["x"]), "_test"); await done(t); const t2 = d.transaction("chunks", "readwrite"); t2.objectStore("chunks").delete("_test"); await done(t2); }); dbg("info", `archivio IndexedDB ok (${Math.round(performance.now() - t0)} ms)`); storageMode = "indexeddb"; return true; }
      catch (e) { dbg("error", `archivio IndexedDB NON utilizzabile: ${e.name}: ${e.message}`); storageMode = "memoria"; return false; }
    },
    putFrame: (k, b) => storageMode === "memoria" ? Promise.resolve(void mem.frames.set(k, b)) : run(async (d) => { const t = d.transaction("frames", "readwrite"); t.objectStore("frames").put(b, k); await done(t); }),
    frameKeys: (sid) => storageMode === "memoria" ? Promise.resolve([...mem.frames.keys()].filter((k) => k.startsWith(sid + ":")).sort()) : run((d) => rq(d.transaction("frames").objectStore("frames").getAllKeys(range(sid)))),
    getFrame: (k) => storageMode === "memoria" ? Promise.resolve(mem.frames.get(k)) : run((d) => rq(d.transaction("frames").objectStore("frames").get(k))),
    delFrameKeys: (keys) => storageMode === "memoria" ? Promise.resolve(keys.forEach((k) => mem.frames.delete(k))) : run(async (d) => { const t = d.transaction("frames", "readwrite"), st = t.objectStore("frames"); keys.forEach((k) => st.delete(k)); await done(t); }),
    delFrames: (sid) => storageMode === "memoria" ? Promise.resolve([...mem.frames.keys()].filter((k) => k.startsWith(sid + ":")).forEach((k) => mem.frames.delete(k))) : run(async (d) => { const t = d.transaction("frames", "readwrite"); t.objectStore("frames").delete(range(sid)); await done(t); }),
    putChunk: (k, b) => storageMode === "memoria" ? Promise.resolve(void mem.chunks.set(k, b)) : run(async (d) => { const t = d.transaction("chunks", "readwrite"); t.objectStore("chunks").put(b, k); await done(t); }),
    allChunkKeys: () => storageMode === "memoria" ? Promise.resolve([...mem.chunks.keys()]) : run((d) => rq(d.transaction("chunks").objectStore("chunks").getAllKeys())),
    chunkKeys: (sid) => storageMode === "memoria" ? Promise.resolve([...mem.chunks.keys()].filter((k) => k.startsWith(sid + ":")).sort()) : run((d) => rq(d.transaction("chunks").objectStore("chunks").getAllKeys(range(sid)))),
    getChunk: (k) => storageMode === "memoria" ? Promise.resolve(mem.chunks.get(k)) : run((d) => rq(d.transaction("chunks").objectStore("chunks").get(k))),
    putSession: (o) => storageMode === "memoria" ? Promise.resolve(void mem.sessions.set(o.id, o)) : run(async (d) => { const t = d.transaction("sessions", "readwrite"); t.objectStore("sessions").put(o); await done(t); }),
    sessions: () => storageMode === "memoria" ? Promise.resolve([...mem.sessions.values()]) : run((d) => rq(d.transaction("sessions").objectStore("sessions").getAll())),
    chunks: (sid) => storageMode === "memoria" ? Promise.resolve([...mem.chunks.entries()].filter(([k]) => k.startsWith(sid + ":")).sort((a, b) => (a[0] < b[0] ? -1 : 1)).map((x) => x[1])) : run((d) => rq(d.transaction("chunks").objectStore("chunks").getAll(range(sid)))),
    delSession: (sid) => storageMode === "memoria" ? Promise.resolve((mem.sessions.delete(sid), [...mem.chunks.keys()].filter((k) => k.startsWith(sid + ":")).forEach((k) => mem.chunks.delete(k)))) : run(async (d) => { const t = d.transaction(["chunks", "sessions", "frames"], "readwrite"); t.objectStore("chunks").delete(range(sid)); t.objectStore("frames").delete(range(sid)); t.objectStore("sessions").delete(sid); await done(t); }),
  };
})();
let sessions = [];
const bufBytes = () => sessions.filter((s) => s.status !== "inviata").reduce((a, s) => a + (s.bytes || 0), 0) + (recording && !sessions.some((s) => s.id === recording.sid) ? recording.bytes : 0) + (tl ? tl.bytes : 0);
async function loadSessions() {
  try { sessions = (await db.sessions()).sort((a, b) => b.start - a.start); if (lastErr.startsWith("Archivio")) lastErr = ""; dbg("info", `registrazioni nell'archivio: ${sessions.length}`); }
  catch (e) { lastErr = "Archivio non disponibile: " + e.name; dbg("error", `lettura archivio fallita: ${e.name}: ${e.message}`); }
  renderClips();
}

// recupero: se la pagina viene chiusa dal sistema durante la registrazione, i pezzi restano nell'archivio: al riavvio si ricostruisce la clip
async function recoverOrphans() {
  try {
    const keys = await db.allChunkKeys(), bySid = {}; keys.forEach((k) => { const sid = String(k).split(":")[0]; (bySid[sid] = bySid[sid] || []).push(k); });
    const known = new Map((await db.sessions()).map((x) => [x.id, x])); let n = 0;
    for (const sid of Object.keys(bySid)) {
      if (recording && recording.sid === sid) continue; const old = known.get(sid); if (old && old.status !== "in corso") continue;
      let bytes = 0; for (const k of bySid[sid]) { const b = await db.getChunk(k); bytes += b ? b.size : 0; }
      const start = old ? old.start : parseInt(sid.slice(1), 36) || Date.now(), end = start + Math.max(bySid[sid].length * 1000, old && old.end > old.start ? old.end - old.start : 0); // un pezzo ogni secondo di ripresa
      const s = { id: sid, start, end, dur: end - start, bytes, chunks: bySid[sid].length, mime: old ? old.mime : "video/mp4", res: old ? old.res : cfg.res, bps: old ? old.bps : Number(cfg.bps), status: bytes ? "pronta" : "errore", recovered: true };
      await db.putSession(s); n++; dbg("warn", `registrazione ${sid} recuperata dopo un blocco`, { MB: +(bytes / 1048576).toFixed(1), pezzi: s.chunks, durataCirca_s: Math.round(s.dur / 1000) });
    }
    for (const x of known.values()) if (x.status === "in corso" && !bySid[x.id] && !(recording && recording.sid === x.id)) { await db.delSession(x.id); dbg("info", `registro vuoto ${x.id} eliminato`); }
    if (n) { lastErr = `${n === 1 ? "Una registrazione è stata recuperata" : n + " registrazioni sono state recuperate"} dopo un blocco della pagina: la fine potrebbe mancare`; await loadSessions(); publish(); }
  } catch (e) { dbg("error", `recupero registrazioni: ${e.name}: ${e.message}`); }
}
