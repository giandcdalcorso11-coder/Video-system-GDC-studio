"use strict";
/* ===== Registrazione: i pezzi vanno subito su disco ===== */
async function startRec() {
  if (recording) { dbg("warn", "rec_start ignorato: già in registrazione"); return; }
  if (tl) { lastErr = "Time-lapse in corso: fermalo prima di registrare"; dbg("warn", "rec_start rifiutato: time-lapse in corso"); publish(); return; }
  { await spaceRefresh(); let i = spaceInfo(); if (i.known && cfg.autoFree && i.minLeft < 5) { await spaceFree(Math.min(i.budget * 0.5, 15 * bytesPerMin())); await spaceRefresh(); i = spaceInfo(); }
    if (i.known && i.minLeft < 1) { lastErr = `Spazio insufficiente per registrare (${Math.round(i.avail / 1048576)} MB disponibili)`; dbg("error", "rec_start rifiutato: spazio insufficiente", { disponibileMB: Math.round(i.avail / 1048576), base: i.basis }); publish(); return; } }
  if (!stream) { dbg("info", "rec_start senza camera: provo ad aprirla"); try { await openCam(); } catch { return; } }
  const mime = ["video/mp4;codecs=avc1", "video/mp4"].find((t) => MediaRecorder.isTypeSupported(t));
  const sid = "s" + Date.now().toString(36), start = Date.now();
  let mr; try { mr = new MediaRecorder(stream, { ...(mime ? { mimeType: mime } : {}), videoBitsPerSecond: Number(cfg.bps) }); } catch (e) { lastErr = "Registrazione non avviabile: " + e.message; dbg("error", `MediaRecorder non creato: ${e.name}: ${e.message}`); publish(); return; }
  const rec = { mr, sid, start, seq: 0, bytes: 0, pending: 0, errs: 0, wr: [], mime: mr.mimeType || mime || "video/mp4", stopping: false };
  recording = rec; lastErr = ""; setWant(true);
  db.putSession({ id: sid, start, end: start, dur: 0, bytes: 0, chunks: 0, mime: rec.mime, res: cfg.res, bps: Number(cfg.bps), status: "in corso" }).catch(() => {});
  rec.hb = setInterval(() => db.putSession({ id: sid, start, end: Date.now(), dur: Date.now() - start, bytes: rec.bytes, chunks: rec.seq, mime: rec.mime, res: cfg.res, bps: Number(cfg.bps), status: "in corso" }).catch(() => {}), 10000);
  dbg("info", `REC avviato sessione ${sid}`, { mime: rec.mime, bps: Number(cfg.bps), res: cfg.res, archivio: storageMode });
  mr.onerror = (e) => dbg("error", `MediaRecorder errore: ${e.error?.name || ""} ${e.error?.message || e.message || ""}`);
  mr.onpause = () => dbg("warn", "MediaRecorder in pausa"); mr.onresume = () => dbg("info", "MediaRecorder ripreso");
  mr.ondataavailable = (e) => {
    if (!e.data.size) return; const k = `${sid}:${String(++rec.seq).padStart(6, "0")}`, t = performance.now(); rec.bytes += e.data.size; rec.pending++;
    db.putChunk(k, e.data).then(() => rec.wr.push(performance.now() - t)).catch((x) => { rec.errs++; lastErr = "Scrittura su disco fallita: " + (x?.name || "errore"); dbg("error", `scrittura pezzo ${k} fallita: ${x?.name}: ${x?.message}`); }).finally(() => rec.pending--);
    { const i = spaceInfo(); if (i.known && i.avail < 30 * 1048576 && !rec.stopping) { lastErr = "Spazio esaurito: registrazione fermata in modo sicuro (il file è valido)"; dbg("error", "spazio esaurito: fermo la registrazione", { disponibileMB: Math.round(i.avail / 1048576), base: i.basis }); stopRec(); } }
  };
  rec.statTimer = setInterval(() => { const vt = stream && stream.getVideoTracks()[0]; dbg("info", `REC ${Math.round((Date.now() - start) / 1000)}s: ${rec.seq} pezzi, ${(rec.bytes / 1048576).toFixed(1)} MB, in scrittura ${rec.pending}, errori ${rec.errs}, buffer ${Math.round(bufBytes() / 1048576)} MB`, { videoTrack: vt ? { stato: vt.readyState, muto: vt.muted, ...vt.getSettings() } : "assente" }); }, 10000);
  mr.onstop = async () => {
    clearInterval(rec.statTimer); clearInterval(rec.hb); while (rec.pending > 0) await sleep(50);
    const s = { id: sid, start, end: Date.now(), dur: Date.now() - start, bytes: rec.bytes, chunks: rec.seq, mime: rec.mime, res: cfg.res, bps: Number(cfg.bps), status: rec.errs ? "errore" : "pronta" };
    try { await db.putSession(s); } catch (e) { lastErr = "Registro non salvato: " + e.name; dbg("error", `registro sessione non salvato: ${e.name}: ${e.message}`); }
    dbg("info", `REC fermato sessione ${sid}`, { durata_s: Math.round(s.dur / 1000), pezzi: s.chunks, MB: +(s.bytes / 1048576).toFixed(1), errori: rec.errs, scrittura_media_ms: rec.wr.length ? Math.round(rec.wr.reduce((a, b) => a + b, 0) / rec.wr.length) : null });
    if (recording === rec) recording = null; await loadSessions(); publish();
  };
  mr.start(1000); publish();
}
function stopRec(byUser) { if (byUser) setWant(false); if (!recording || recording.stopping) return; recording.stopping = true; dbg("info", "richiesto stop registrazione"); try { recording.mr.stop(); } catch (e) { dbg("warn", `stop: ${e.message}`); } publish(); }
