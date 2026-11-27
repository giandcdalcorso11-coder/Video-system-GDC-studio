"use strict";
/* ===== Fotocamera ===== */
/* diagnosi dell'audio: quando la traccia audio termina da sola scrivo tutto ciò che può spiegarlo (pagina in secondo piano, anteprime, cambi di dispositivo, sessione audio di iOS) */
const AudioDiag = {
  streamAt: 0, previewAt: 0, devChange: 0,
  as() { try { const a = navigator.audioSession; return a ? `tipo ${a.type}, stato ${a.state}` : "API audioSession assente"; } catch (e) { return "audioSession: " + e.message; } },
  async devs() { try { const d = await navigator.mediaDevices.enumerateDevices(); return d.filter((x) => x.kind === "audioinput" || x.kind === "audiooutput").map((x) => `${x.kind === "audioinput" ? "in" : "out"}:${x.label || "(senza nome)"}`); } catch (e) { return ["errore " + e.message]; } },
  sec(t) { return t ? Math.round((Date.now() - t) / 1000) : null; },
  async ended(t) {
    const info = { visibilita: document.visibilityState, nascostaDa_s: typeof PageWatch === "object" ? PageWatch.hiddenFor() : null, focus: document.hasFocus ? document.hasFocus() : null, inREC: !!recording, REC_s: recording ? Math.round((Date.now() - recording.start) / 1000) : 0, timelapse: !!(tl && tl.stage === "shooting"), anteprime: Object.keys(pcs).length, ultimaAnteprima_s: this.sec(this.previewAt), cameraAperta_s: this.sec(this.streamAt), traccia: { stato: t.readyState, muta: t.muted, attiva: t.enabled, etichetta: t.label }, audioSession: this.as(), ultimoCambioDispositivi_s: this.sec(this.devChange), batteria: bat && bat.level, ricarica: bat && bat.charging, schermoSpento: document.visibilityState === "hidden" };
    info.dispositivi = await this.devs();
    dbg("error", "DIAGNOSI AUDIO: la traccia audio è terminata da sola", info);
  } };
async function openCam() {
  if (CAM_DUP) throw new Error("camera aperta in un'altra scheda");
  if (stream) stream.getTracks().forEach((t) => t.stop());
  { const want = store.get("gdc.audioSess", ""); if (want && navigator.audioSession) { try { navigator.audioSession.type = want; dbg("info", `sessione audio impostata: ${AudioDiag.as()}`); } catch (e) { dbg("warn", `sessione audio non impostabile: ${e.message}`); } } }
  const [w, h] = RES[cfg.res] || RES["1080p"], base = { video: { facingMode: cfg.facing, width: { ideal: w }, height: { ideal: h }, frameRate: { ideal: 30 } } }, t0 = performance.now();
  dbg("info", `apro la camera: ${cfg.res} ${cfg.facing}`);
  try { stream = await navigator.mediaDevices.getUserMedia({ ...base, audio: true }); }
  catch (e) {
    dbg("warn", `camera+audio non disponibili: ${e.name}: ${e.message}`);
    try { stream = await navigator.mediaDevices.getUserMedia({ ...base, audio: false }); lastErr = "Microfono non disponibile: registro senza audio"; }
    catch (e2) { lastErr = "Camera non disponibile: " + e2.name; dbg("error", `camera non disponibile: ${e2.name}: ${e2.message}`); stream = null; publish(); throw e2; }
  }
  AudioDiag.streamAt = Date.now();
  stream.getTracks().forEach((t) => { t.onended = () => { dbg("error", `traccia ${t.kind} terminata (camera interrotta?)`); if (t.kind === "audio") AudioDiag.ended(t).catch(() => {}); if (t.kind === "video") { lastErr = "Camera interrotta dal sistema"; if (recording) { recording.stalled = true; stopRec(); } if (tl && tl.stage === "shooting") tlStop(); stream = null; $("camStop").disabled = true; publish(); }
    else if (t.kind === "audio") { dbg("warn", `microfono interrotto dal sistema${recording ? " durante la registrazione: la fermo e salvo ciò che c'è" : ""} (cuffie, chiamata o altra app che usa l'audio?)`); if (recording) { lastErr = "Il microfono si è interrotto: registrazione fermata. Riavvia la ripresa (riapro la camera da solo)"; recording.stalled = true; stopRec(); } publish(); } }; t.onmute = () => dbg("warn", `traccia ${t.kind} silenziata dal sistema`); t.onunmute = () => dbg("info", `traccia ${t.kind} riattivata`); });
  const v = $("vid"); v.srcObject = stream; await v.play().catch((e) => dbg("warn", `play anteprima locale: ${e.name}`));
  const vt = stream.getVideoTracks()[0], at = stream.getAudioTracks()[0];
  dbg("info", `camera aperta in ${Math.round(performance.now() - t0)} ms`, { video: vt && vt.getSettings(), audio: at ? at.getSettings() : "assente", etichetta: vt && vt.label });
  if (zoomWanted !== 1 && zoomInfo().native) { try { await vt.applyConstraints({ advanced: [{ zoom: zoomWanted }] }); dbg("info", `zoom ripristinato a ${zoomWanted}×`); } catch (e) { dbg("warn", `zoom non ripristinato: ${e.name}`); } }
  if (Object.keys(pro).length) setTimeout(() => reapplyPro().catch(() => {}), 600);
  lastErr = lastErr.startsWith("Camera") ? "" : lastErr; $("camStop").disabled = false; $("recBtn").disabled = false; publish();
  wakeOn();
  if (!capsLogged) { capsLogged = true; mediaProbe(vt, at).catch((e) => dbg("warn", `sonda media: ${e.name}: ${e.message}`)); }
}
let wl = null, capsLogged = false;
async function wakeOn() {
  if (!("wakeLock" in navigator)) { if (!wakeOn.noted) { wakeOn.noted = true; dbg("info", "wake lock schermo: non supportato da questo browser"); } return; }
  if (wl) return;
  try { wl = await navigator.wakeLock.request("screen"); dbg("info", "wake lock schermo: attivo (lo schermo non si spegne mentre la camera è aperta)"); wl.addEventListener("release", () => { wl = null; dbg("info", "wake lock schermo: rilasciato dal sistema"); }); }
  catch (e) { dbg("warn", `wake lock non ottenuto: ${e.name}: ${e.message}`); }
}
function wakeOff() { try { wl && wl.release(); } catch { /* ok */ } wl = null; }
let opening = false;
async function autoOpen(why) {
  if (CAM_DUP) return;
  if (!cfg.autoCam || stream || opening || recording || !pairing || welcomePending) return; opening = true; dbg("info", `avvio automatico della camera (${why})`);
  try { await openCam(); dbg("info", "avvio automatico riuscito"); }
  catch (e) { lastErr = e.name === "NotAllowedError" ? "Camera non avviata: tocca “Avvia camera” (serve il permesso o un tocco)" : lastErr; dbg("warn", `avvio automatico non riuscito: ${e.name}: ${e.message}`); publish(); }
  opening = false;
}
function stopCam() { dbg("info", "ferma camera"); wakeOff(); setWant(false); if (recording) stopRec(); if (tl && tl.stage === "shooting") tlStop(); stream?.getTracks().forEach((t) => t.stop()); stream = null; $("vid").srcObject = null; $("camStop").disabled = true; $("recBtn").disabled = true; closePreviews(); publish(); }

/* sveglia, chiamata o altra app: iOS silenzia la cattura e a volte NON la riattiva da solo quando l'interruzione finisce.
   Se la pagina è tornata visibile e una traccia resta silenziata per 4 s, riapro la camera e rimetto in piedi le anteprime verso la regia. */
const MuteWatch = { since: 0, lastReopen: 0, busy: false };
setInterval(async () => {
  try {
    const ts = stream ? stream.getTracks() : [], muted = ts.length && ts.some((t) => t.readyState === "live" && t.muted);
    if (!muted || document.hidden) { MuteWatch.since = 0; return; }
    if (!MuteWatch.since) { MuteWatch.since = Date.now(); return; }
    if (Date.now() - MuteWatch.since < 4000 || MuteWatch.busy || opening || recording || tl || CAM_DUP || Date.now() - MuteWatch.lastReopen < 15000) return;
    MuteWatch.busy = true; MuteWatch.lastReopen = Date.now(); opening = true;
    const prev = Object.keys(pcs).map((k) => [k, pcs[k].q]);
    dbg("warn", `camera ancora silenziata dopo ${Math.round((Date.now() - MuteWatch.since) / 1000)} s dal ritorno in primo piano: la riapro`, { anteprimeDaRiaprire: prev.length });
    try { await openCam(); dbg("info", "camera riaperta dopo il silenzio del sistema"); lastErr = lastErr.startsWith("La camera è silenziata") ? "" : lastErr; }
    catch (e) { dbg("error", `riapertura dopo il silenzio non riuscita: ${e.name}: ${e.message}`); }
    opening = false; MuteWatch.since = 0;
    for (const [k, q] of prev) { try { await startPreview(k, q); } catch (e) { dbg("warn", `anteprima per ${k} non riaperta: ${e.message}`); } }
    publish();
  } catch (e) { dbg("warn", `controllo silenzio: ${e.message}`); opening = false; } finally { MuteWatch.busy = false; }
}, 1000);
