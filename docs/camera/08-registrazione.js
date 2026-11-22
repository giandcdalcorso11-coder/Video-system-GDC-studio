"use strict";
/* ===== Registrazione: i pezzi vanno subito su disco ===== */
async function startRec() {
  if (recording) { dbg("warn", "rec_start ignorato: già in registrazione"); return; }
  if (tl) { lastErr = "Time-lapse in corso: fermalo prima di registrare"; dbg("warn", "rec_start rifiutato: time-lapse in corso"); publish(); return; }
  { await spaceRefresh(); let i = spaceInfo(); if (i.known && cfg.autoFree && i.minLeft < 5) { await spaceFree(Math.min(i.budget * 0.5, 15 * bytesPerMin())); await spaceRefresh(); i = spaceInfo(); }
    if (i.known && i.minLeft < 1) { lastErr = `Spazio insufficiente per registrare (${Math.round(i.avail / 1048576)} MB disponibili)`; dbg("error", "rec_start rifiutato: spazio insufficiente", { disponibileMB: Math.round(i.avail / 1048576), base: i.basis }); publish(); return; } }
  if (stream && stream.getAudioTracks().some((t) => t.readyState === "ended")) { dbg("warn", "il microfono si era interrotto (cuffie o altro audio?): riapro la camera prima di registrare"); closePreviews(); stream.getTracks().forEach((t) => { t.onended = null; try { t.stop(); } catch { /* ok */ } }); stream = null; }
  if (!stream) { dbg("info", "rec_start senza camera: provo ad aprirla"); try { await openCam(); } catch { return; } }
  const mime = ["video/mp4;codecs=avc1", "video/mp4"].find((t) => MediaRecorder.isTypeSupported(t));
  const sid = "s" + Date.now().toString(36), start = Date.now();
  let mr; try { mr = new MediaRecorder(stream, { ...(mime ? { mimeType: mime } : {}), videoBitsPerSecond: Number(cfg.bps) }); } catch (e) { lastErr = "Registrazione non avviabile: " + e.message; dbg("error", `MediaRecorder non creato: ${e.name}: ${e.message}`); publish(); return; }
  const rec = { mr, sid, start, seq: 0, bytes: 0, pending: 0, errs: 0, wr: [], mime: mr.mimeType || mime || "video/mp4", stopping: false };
  recording = rec; lastErr = ""; setWant(true); tagClip(sid);
  db.putSession({ id: sid, start, end: start, dur: 0, bytes: 0, chunks: 0, mime: rec.mime, res: cfg.res, bps: Number(cfg.bps), status: "in corso" }).catch(() => {});
  rec.hb = setInterval(() => db.putSession({ id: sid, start, end: Date.now(), dur: Date.now() - start, bytes: rec.bytes, chunks: rec.seq, mime: rec.mime, res: cfg.res, bps: Number(cfg.bps), status: "in corso" }).catch(() => {}), 10000);
  dbg("info", `REC avviato sessione ${sid}`, { mime: rec.mime, bps: Number(cfg.bps), res: cfg.res, archivio: storageMode });
  mr.onerror = (e) => dbg("error", `MediaRecorder errore: ${e.error?.name || ""} ${e.error?.message || e.message || ""}`);
  mr.onpause = () => dbg("warn", "MediaRecorder in pausa"); mr.onresume = () => dbg("info", "MediaRecorder ripreso");
  mr.ondataavailable = (e) => {
    if (!e.data.size) return; rec.lastData = Date.now(); const k = `${sid}:${String(++rec.seq).padStart(6, "0")}`, t = performance.now(); rec.bytes += e.data.size; rec.pending++;
    db.putChunk(k, e.data).then(() => rec.wr.push(performance.now() - t)).catch((x) => { rec.errs++; lastErr = "Scrittura su disco fallita: " + (x?.name || "errore"); dbg("error", `scrittura pezzo ${k} fallita: ${x?.name}: ${x?.message}`); }).finally(() => rec.pending--);
    { const i = spaceInfo(); if (i.known && i.avail < 30 * 1048576 && !rec.stopping) { lastErr = "Spazio esaurito: registrazione fermata in modo sicuro (il file è valido)"; dbg("error", "spazio esaurito: fermo la registrazione", { disponibileMB: Math.round(i.avail / 1048576), base: i.basis }); stopRec(); } }
  };
  rec.statTimer = setInterval(() => { const vt = stream && stream.getVideoTracks()[0]; dbg("info", `REC ${Math.round((Date.now() - start) / 1000)}s: ${rec.seq} pezzi, ${(rec.bytes / 1048576).toFixed(1)} MB, in scrittura ${rec.pending}, errori ${rec.errs}, buffer ${Math.round(bufBytes() / 1048576)} MB`, { videoTrack: vt ? { stato: vt.readyState, muto: vt.muted, ...vt.getSettings() } : "assente" }); }, 10000);
  const finalize = async () => {
    if (rec.done) return; rec.done = true;
    clearInterval(rec.statTimer); clearInterval(rec.hb); clearInterval(rec.stall); while (rec.pending > 0) await sleep(50);
    if (!rec.bytes && !rec.errs) { // registrazione troppo breve: il formato consegna i dati solo dopo un po' (niente clip vuote)
      try { await db.delSession(sid); } catch { /* ok */ } lastErr = "Registrazione troppo breve: nessun dato salvato"; dbg("warn", `REC ${sid} fermato senza dati: scartato`);
      if (recording === rec) recording = null; await loadSessions(); publish(); return;
    }
    const s = { id: sid, start, end: Date.now(), dur: Date.now() - start, bytes: rec.bytes, chunks: rec.seq, mime: rec.mime, res: cfg.res, bps: Number(cfg.bps), status: rec.errs ? "errore" : "pronta" };
    try { await db.putSession(s); } catch (e) { lastErr = "Registro non salvato: " + e.name; dbg("error", `registro sessione non salvato: ${e.name}: ${e.message}`); }
    dbg("info", `REC fermato sessione ${sid}`, { durata_s: Math.round(s.dur / 1000), pezzi: s.chunks, MB: +(s.bytes / 1048576).toFixed(1), errori: rec.errs, scrittura_media_ms: rec.wr.length ? Math.round(rec.wr.reduce((a, b) => a + b, 0) / rec.wr.length) : null });
    if (recording === rec) recording = null; await loadSessions(); publish();
  };
  rec.finalize = finalize; mr.onstop = finalize; rec.lastData = start;
  // se il registratore smette di consegnare dati (microfono interrotto, sistema che lo blocca) non resto in REC per sempre: fermo e salvo ciò che c'è
  rec.stall = setInterval(() => { if (rec.stopping || rec.done) return; const quiet = Date.now() - rec.lastData; if (quiet > 10000) { lastErr = "La registrazione si è bloccata (nessun dato da 10 s): fermata. Se c'erano cuffie o altro audio, ricollega e riprova"; dbg("error", `REC ${sid}: nessun dato da ${Math.round(quiet / 1000)} s: fermo la registrazione`, { pezzi: rec.seq, MB: +(rec.bytes / 1048576).toFixed(1), stato: mr.state }); stopRec(); } }, 2000);
  mr.start(1000); publish();
}
function stopRec(byUser) { if (byUser) setWant(false); if (!recording || recording.stopping) return; const rec = recording; rec.stopping = true; dbg("info", "richiesto stop registrazione"); try { rec.mr.stop(); } catch (e) { dbg("warn", `stop: ${e.message}`); }
  // se il registratore non conferma lo stop entro 4 s (succede se il sistema l'ha bloccato), chiudo io la registrazione
  setTimeout(() => { if (!rec.done) { dbg("error", `REC ${rec.sid}: lo stop non è stato confermato in 4 s: chiudo io la registrazione`, { stato: rec.mr.state, pezzi: rec.seq }); if (!lastErr) lastErr = "Il registratore non ha risposto allo stop: chiusa a mano"; rec.finalize && rec.finalize(); } }, 4000); publish(); }
