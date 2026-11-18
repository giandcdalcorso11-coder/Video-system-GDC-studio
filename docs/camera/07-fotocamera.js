"use strict";
/* ===== Fotocamera ===== */
async function openCam() {
  if (stream) stream.getTracks().forEach((t) => t.stop());
  const [w, h] = RES[cfg.res] || RES["1080p"], base = { video: { facingMode: cfg.facing, width: { ideal: w }, height: { ideal: h }, frameRate: { ideal: 30 } } }, t0 = performance.now();
  dbg("info", `apro la camera: ${cfg.res} ${cfg.facing}`);
  try { stream = await navigator.mediaDevices.getUserMedia({ ...base, audio: true }); }
  catch (e) {
    dbg("warn", `camera+audio non disponibili: ${e.name}: ${e.message}`);
    try { stream = await navigator.mediaDevices.getUserMedia({ ...base, audio: false }); lastErr = "Microfono non disponibile: registro senza audio"; }
    catch (e2) { lastErr = "Camera non disponibile: " + e2.name; dbg("error", `camera non disponibile: ${e2.name}: ${e2.message}`); stream = null; publish(); throw e2; }
  }
  stream.getTracks().forEach((t) => { t.onended = () => { dbg("error", `traccia ${t.kind} terminata (camera interrotta?)`); if (t.kind === "video") { lastErr = "Camera interrotta dal sistema"; if (recording) stopRec(); if (tl && tl.stage === "shooting") tlStop(); stream = null; $("camStop").disabled = true; publish(); } }; t.onmute = () => dbg("warn", `traccia ${t.kind} silenziata dal sistema`); t.onunmute = () => dbg("info", `traccia ${t.kind} riattivata`); });
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
  if (!cfg.autoCam || stream || opening || recording || !pairing || welcomePending) return; opening = true; dbg("info", `avvio automatico della camera (${why})`);
  try { await openCam(); dbg("info", "avvio automatico riuscito"); }
  catch (e) { lastErr = e.name === "NotAllowedError" ? "Camera non avviata: tocca “Avvia camera” (serve il permesso o un tocco)" : lastErr; dbg("warn", `avvio automatico non riuscito: ${e.name}: ${e.message}`); publish(); }
  opening = false;
}
function stopCam() { dbg("info", "ferma camera"); wakeOff(); setWant(false); if (recording) stopRec(); if (tl && tl.stage === "shooting") tlStop(); stream?.getTracks().forEach((t) => t.stop()); stream = null; $("vid").srcObject = null; $("camStop").disabled = true; $("recBtn").disabled = true; closePreviews(); publish(); }
