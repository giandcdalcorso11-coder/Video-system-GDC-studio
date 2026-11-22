"use strict";
/* ===== Time-lapse: le immagini (JPEG) vanno su disco, poi si compongono in un video ===== */
const tlCanvas = document.createElement("canvas");
let tl = null; // {sid, mode, int, fps, q, start, seq, keys, bytes, k, busy, skipped, errs, stage, progress, timer, next}
const autoK = (sec) => (sec < 600 ? 0 : Math.floor(Math.log2(sec / 600)) + 1); // come l'app Fotocamera: 2 imm/s, poi intervallo raddoppiato a 10, 20, 40... min
const tlInterval = () => (!tl ? 0 : tl.mode === "auto" ? 0.5 * 2 ** tl.k : tl.int);
function tlState() { return tl ? { stage: tl.stage, mode: tl.mode, frames: tl.keys.length, skipped: tl.skipped, errs: tl.errs, intS: tlInterval(), fps: tl.fps, elapsedMs: Date.now() - tl.start, progress: tl.progress, MB: Math.round(tl.bytes / 1048576) } : null; }
const loadBmp = async (b) => { if (window.createImageBitmap) return createImageBitmap(b); const i = new Image(); i.src = URL.createObjectURL(b); await i.decode(); return i; };
async function tlStart(o) {
  if (tl) { dbg("warn", "time-lapse già in corso"); return false; }
  if (recording) { lastErr = "Registrazione in corso: fermala prima del time-lapse"; dbg("warn", "tl_start rifiutato: REC in corso"); publish(); return false; }
  if (!stream) { try { await openCam(); } catch { return false; } }
  const sid = "t" + Date.now().toString(36); tagClip(sid);
  tl = { sid, mode: o.mode === "man" ? "man" : "auto", int: Number(o.int) || 5, fps: Number(o.fps) || 30, q: Number(o.q) || 0.92, start: Date.now(), seq: 0, keys: [], bytes: 0, k: 0, busy: false, skipped: 0, errs: 0, stage: "shooting", progress: 0, timer: 0, next: Date.now() };
  lastErr = ""; dbg("info", `time-lapse avviato ${sid}`, { modalita: tl.mode, intervallo_s: tl.int, fps: tl.fps, qualitaJpeg: tl.q, camera: `${$("vid").videoWidth}x${$("vid").videoHeight}`, archivio: storageMode });
  const loop = async () => {
    if (!tl || tl.stage !== "shooting") return;
    const el = (Date.now() - tl.start) / 1000;
    if (tl.mode === "auto" && autoK(el) > tl.k) { tl.k = autoK(el); await tlThin(); }
    const int = tlInterval() * 1000; await tlCapture(); if (!tl || tl.stage !== "shooting") return;
    tl.next = Math.max(tl.next + int, Date.now()); tl.timer = setTimeout(loop, tl.next - Date.now());
  };
  tl.timer = setTimeout(loop, 0); tl.statT = setInterval(() => { if (tl) dbg("info", `time-lapse: ${tl.keys.length} immagini, ${(tl.bytes / 1048576).toFixed(1)} MB, intervallo ${tlInterval()} s, saltate ${tl.skipped}, errori ${tl.errs}, buffer ${Math.round(bufBytes() / 1048576)} MB`); }, 15000);
  publish(); return true;
}
async function tlCapture() {
  const t = tl; if (t.busy) { t.skipped++; return; } t.busy = true; const t0 = performance.now();
  try {
    const v = $("vid"); if (!v.videoWidth) throw new Error("video non pronto");
    tlCanvas.width = v.videoWidth; tlCanvas.height = v.videoHeight; tlCanvas.getContext("2d").drawImage(v, 0, 0);
    const blob = await new Promise((r) => tlCanvas.toBlob(r, "image/jpeg", t.q)); if (!blob) throw new Error("immagine vuota");
    const k = `${t.sid}:${String(++t.seq).padStart(6, "0")}`; await db.putFrame(k, blob); t.keys.push(k); t.bytes += blob.size;
    if (t.keys.length % 50 === 1) dbg("trace", `time-lapse: immagine ${t.seq} ${(blob.size / 1024).toFixed(0)} KB in ${Math.round(performance.now() - t0)} ms`);
    { const i = spaceInfo(); if (i.known && i.avail < 30 * 1048576 && t.stage === "shooting") { lastErr = "Spazio esaurito: time-lapse fermato in modo sicuro"; dbg("error", "spazio esaurito: fermo il time-lapse", { disponibileMB: Math.round(i.avail / 1048576) }); tlStop(); } }
  } catch (e) { t.errs++; lastErr = "Time-lapse: cattura fallita (" + (e.name || "errore") + ")"; dbg("error", `time-lapse: cattura fallita ${e.name}: ${e.message}`); }
  t.busy = false; publish();
}
async function tlThin() {
  const del = tl.keys.filter((_, i) => i % 2); tl.keys = tl.keys.filter((_, i) => i % 2 === 0); tl.bytes = tl.bytes / 2;
  try { await db.delFrameKeys(del); } catch (e) { dbg("error", `time-lapse: scarto immagini fallito ${e.name}: ${e.message}`); }
  dbg("info", `time-lapse: intervallo raddoppiato (livello ${tl.k}, ora ${tlInterval()} s), scartate ${del.length} immagini`);
}
async function tlStop() {
  if (!tl || tl.stage !== "shooting") return; clearTimeout(tl.timer); clearInterval(tl.statT); tl.stage = "rendering"; dbg("info", `time-lapse fermato: ${tl.keys.length} immagini in ${Math.round((Date.now() - tl.start) / 1000)} s`, { saltate: tl.skipped, errori: tl.errs });
  const t = tl; publish();
  try { await tlRender(t.sid, t.keys.slice(), t.fps, t.start); } catch (e) { lastErr = "Creazione del video fallita: " + (e.name || "errore"); dbg("error", `time-lapse: creazione video fallita ${e.name}: ${e.message}`); }
  if (tl === t) tl = null; await loadSessions(); publish();
}
async function tlRender(sid, keys, fps, startTs, silent) {
  if (!keys.length) throw new Error("nessuna immagine");
  const t = tl && tl.sid === sid ? tl : null, g = tlCanvas.getContext("2d"), t0 = performance.now();
  const first = await loadBmp(await db.getFrame(keys[0])); tlCanvas.width = first.width; tlCanvas.height = first.height; g.drawImage(first, 0, 0);
  const mime = ["video/mp4;codecs=avc1", "video/mp4"].find((x) => MediaRecorder.isTypeSupported(x)), vsid = silent ? sid + "v" : sid;
  const cs0 = tlCanvas.captureStream(0), vtr = cs0.getVideoTracks()[0], manual = !!(vtr && typeof vtr.requestFrame === "function"), mr = new MediaRecorder(manual ? cs0 : tlCanvas.captureStream(fps), { ...(mime ? { mimeType: mime } : {}), videoBitsPerSecond: 20000000 });
  let seq = 0, bytes = 0, pending = 0, errs = 0; dbg("info", `time-lapse: creo il video da ${keys.length} immagini a ${fps} fps`, { mime: mr.mimeType, dimensioni: `${tlCanvas.width}x${tlCanvas.height}`, durataAttesa_s: +(keys.length / fps).toFixed(1) });
  mr.ondataavailable = (e) => { if (!e.data.size) return; const k = `${vsid}:${String(++seq).padStart(6, "0")}`; bytes += e.data.size; pending++; db.putChunk(k, e.data).catch((x) => { errs++; dbg("error", `scrittura pezzo video fallita: ${x.name}`); }).finally(() => pending--); };
  mr.onerror = (e) => dbg("error", `MediaRecorder (time-lapse): ${e.error?.name || ""} ${e.error?.message || ""}`);
  const stopped = new Promise((r) => (mr.onstop = r)); mr.start(1000);
  /* Cadenza esatta: le immagini si decodificano in anticipo e ogni fotogramma viene disegnato alla sua scadenza (non "attesa + decodifica"), così i tempi nel video sono regolari. */
  const AHEAD = 6, step = 1000 / fps, q = new Map(); let late = 0, lateMs = 0, maxLate = 0;
  const fetchF = (i) => { if (i < keys.length && !q.has(i)) q.set(i, db.getFrame(keys[i]).then(loadBmp).catch(() => null)); };
  q.set(0, Promise.resolve(first)); for (let i = 1; i < Math.min(AHEAD, keys.length); i++) fetchF(i);
  const push = () => { if (manual) { try { vtr.requestFrame(); } catch { /* ok */ } } };
  let T0 = performance.now(), last = first; push();
  for (let i = 0; i < keys.length; i++) {
    const w = T0 + i * step - performance.now(); if (w > 0) await sleep(w);
    fetchF(i + AHEAD); const bmp = await q.get(i); q.delete(i);
    const lag = performance.now() - (T0 + i * step); if (lag > step) { late++; lateMs += lag; if (lag > maxLate) maxLate = lag; T0 += lag - step; }
    if (bmp) { last = bmp; g.drawImage(bmp, 0, 0); } else g.drawImage(last, 0, 0);
    push(); if (bmp && bmp !== first && bmp.close) bmp.close();
    if (t) t.progress = (i + 1) / keys.length; if (i % 5 === 0 || i === keys.length - 1) publish();
  }
  dbg("info", `time-lapse: cadenza video, ${late} fotogrammi in ritardo di ${keys.length}`, { ritardoMedio_ms: late ? Math.round(lateMs / late) : 0, ritardoMax_ms: Math.round(maxLate), scattoManuale: manual, durataReale_s: +((performance.now() - T0) / 1000).toFixed(1), durataAttesa_s: +(keys.length / fps).toFixed(1) });
  await sleep(700); try { mr.requestData(); } catch { /* ok */ } await sleep(150); mr.stop(); await stopped; while (pending > 0) await sleep(50);
  const ok = bytes > 0 && !errs, s = { id: vsid, start: startTs, end: Date.now(), dur: Math.round((keys.length / fps) * 1000), bytes, chunks: seq, mime: mr.mimeType || mime, res: `${tlCanvas.width}x${tlCanvas.height}`, bps: 20000000, status: ok ? "pronta" : "video non creato", kind: "timelapse", frames: keys.length, fps, src: sid };
  await db.putSession(s); dbg(ok ? "info" : "error", `time-lapse: video ${ok ? "pronto" : "NON creato correttamente"}`, { MB: +(bytes / 1048576).toFixed(1), pezzi: seq, errori: errs, tempoCreazione_s: Math.round((performance.now() - t0) / 1000) });
  if (ok) { await db.delFrames(sid).catch((e) => dbg("warn", `pulizia immagini: ${e.name}`)); } else { lastErr = "Creazione del video non riuscita: le immagini restano sul telefono"; }
}
