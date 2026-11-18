"use strict";
/* ===== Stato verso la dashboard ===== */
const fmtT = (ms) => { const t = Math.max(0, Math.floor(ms / 1000)); return String(Math.floor(t / 60)).padStart(2, "0") + ":" + String(t % 60).padStart(2, "0"); };
let zoomWanted = 1;
/* Controlli avanzati: torcia, fuoco, bilanciamento del bianco, esposizione. Si mostrano solo quelli che il telefono dichiara di supportare. */
let pro = store.get("gdc.pro", {});
const PRO_KEYS = { torch: "b", focusMode: "s", focusDistance: "n", whiteBalanceMode: "s", colorTemperature: "n", exposureMode: "s", exposureCompensation: "n", iso: "n", exposureTime: "n" };
function proInfo() {
  const vt = stream && stream.getVideoTracks()[0]; if (!vt) return null; let c = {}, st = {};
  try { c = vt.getCapabilities ? vt.getCapabilities() : {}; st = vt.getSettings ? vt.getSettings() : {}; } catch { return null; }
  const num = (k) => c[k] && typeof c[k] === "object" && c[k].max != null ? { min: c[k].min, max: c[k].max, step: c[k].step || 0, cur: st[k] ?? null } : null, o = {};
  if (c.torch) o.torch = { cur: !!st.torch };
  if (Array.isArray(c.focusMode) || c.focusDistance) o.focus = { modes: Array.isArray(c.focusMode) ? c.focusMode : [], cur: st.focusMode || null, dist: num("focusDistance") };
  if (Array.isArray(c.whiteBalanceMode) || c.colorTemperature) o.wb = { modes: Array.isArray(c.whiteBalanceMode) ? c.whiteBalanceMode : [], cur: st.whiteBalanceMode || null, temp: num("colorTemperature") };
  if (Array.isArray(c.exposureMode) || c.exposureCompensation || c.iso || c.exposureTime) o.exp = { modes: Array.isArray(c.exposureMode) ? c.exposureMode : [], cur: st.exposureMode || null, comp: num("exposureCompensation"), iso: num("iso"), shutter: num("exposureTime") };
  return Object.keys(o).length ? o : null;
}
async function applyPro(set, reset) {
  const vt = stream && stream.getVideoTracks()[0]; if (!vt) return { errore: "camera spenta" }; const res = {};
  if (reset) { set = { focusMode: "continuous", whiteBalanceMode: "continuous", exposureMode: "continuous", exposureCompensation: 0, torch: false }; pro = {}; }
  for (const [k, v] of Object.entries(set || {})) {
    if (!(k in PRO_KEYS) || (PRO_KEYS[k] === "b" ? typeof v !== "boolean" : PRO_KEYS[k] === "n" ? typeof v !== "number" || !isFinite(v) : typeof v !== "string")) { res[k] = "valore non valido"; continue; }
    try { await vt.applyConstraints({ advanced: [{ [k]: v }] }); res[k] = "ok"; if (k !== "torch" && !reset) pro[k] = v; } catch (e) { res[k] = `${e.name}: ${e.message}`; dbg("warn", `controllo ${k}=${v} non applicato: ${e.name}: ${e.message}`); }
  }
  store.set("gdc.pro", pro); dbg("info", reset ? "controlli avanzati riportati in automatico" : "controlli avanzati applicati", { richiesti: set, esito: res }); publish(); return res;
}
async function reapplyPro() { const set = {}; for (const k of ["focusMode", "focusDistance", "whiteBalanceMode", "colorTemperature", "exposureMode", "exposureCompensation", "iso", "exposureTime"]) if (k in pro) set[k] = pro[k]; if (Object.keys(set).length) { const keep = pro; await applyPro(set); pro = keep; store.set("gdc.pro", pro); } }
function zoomInfo() {
  const vt = stream && stream.getVideoTracks()[0]; let c = null, cur = null;
  try { c = vt && vt.getCapabilities ? vt.getCapabilities().zoom : null; } catch { /* ok */ }
  if (!c) return { native: false };
  try { cur = vt.getSettings().zoom; } catch { /* ok */ }
  return { native: true, min: c.min, max: c.max, cur: cur ?? zoomWanted };
}
/* Lo zoom si avvicina al valore richiesto con un movimento morbido (in scala logaritmica, velocità massima limitata),
   invece di saltare ai valori che arrivano a scatti dalla dashboard. */
const ZOOM_MAX_RATE = 1.3, ZOOM_TAU = 260; // 1,3 = ln(zoom) al secondo (da 1× a 5× in circa 1,3 s); 260 ms = costante di tempo
let zoomTarget = null, zoomRunning = false;
async function zoomRun() {
  if (zoomRunning) return; zoomRunning = true;
  const t0 = performance.now(); let steps = 0, fails = 0, cur = 0;
  try {
    const vt0 = stream && stream.getVideoTracks()[0]; cur = Number(vt0 && vt0.getSettings().zoom) || zoomWanted || 1;
    let last = performance.now();
    while (zoomTarget != null && stream) {
      const vt = stream.getVideoTracks()[0], now = performance.now(), dt = Math.min(120, Math.max(1, now - last)); last = now;
      const diff = Math.log(zoomTarget / cur);
      let step = diff * (1 - Math.exp(-dt / ZOOM_TAU)); const lim = ZOOM_MAX_RATE * dt / 1000; step = Math.max(-lim, Math.min(lim, step));
      const done = Math.abs(diff) < 0.003; cur = done ? zoomTarget : cur * Math.exp(step);
      try { await vt.applyConstraints({ advanced: [{ zoom: cur }] }); steps++; } catch (e) { if (++fails > 3) { dbg("warn", `zoom: ${e.name}: ${e.message}`); break; } }
      if (done) { if (Math.abs(Math.log(zoomTarget / cur)) < 0.003) zoomTarget = null; break; }
      await sleep(12);
    }
  } finally {
    zoomRunning = false;
    dbg("info", `zoom arrivato a ${cur.toFixed(2)}× in ${Math.round(performance.now() - t0)} ms (${steps} passaggi)`);
    publish();
    if (zoomTarget != null && stream && Math.abs(Math.log(zoomTarget / cur)) >= 0.003) zoomRun();
  }
}
async function setZoom(z) {
  const vt = stream && stream.getVideoTracks()[0]; if (!vt) throw new Error("camera spenta");
  const i = zoomInfo(); if (!i.native) throw new Error("zoom non disponibile su questo dispositivo");
  z = Math.max(i.min, Math.min(i.max, Number(z))); if (!isFinite(z)) throw new Error("valore di zoom non valido");
  zoomWanted = z; zoomTarget = z; dbg("trace", `zoom richiesto ${z.toFixed(2)}×`); zoomRun(); return { ...i, target: z };
}
async function mediaProbe(vt, at) {
  const cap = (t) => { try { return t && t.getCapabilities ? t.getCapabilities() : "getCapabilities assente"; } catch (e) { return "errore " + e.message; } };
  let devs = []; try { devs = (await navigator.mediaDevices.enumerateDevices()).map((d) => `${d.kind}:${d.label || "(senza etichetta)"}`); } catch { /* ok */ }
  dbg("info", "SONDA camera: capacità della traccia video", { etichetta: vt && vt.label, capacita: cap(vt), impostazioni: vt && vt.getSettings() });
  dbg("info", "SONDA camera: capacità dell'audio", { capacita: cap(at), impostazioni: at && at.getSettings() });
  dbg("info", "SONDA camera: dispositivi multimediali", devs);
  dbg("info", "=== SONDA DISPOSITIVO COMPLETATA ===");
}
async function deviceProbe() {
  const n = navigator, ua = n.userAgentData, id = { ua: n.userAgent, piattaforma: n.platform, lingua: n.language, touch: n.maxTouchPoints, core: n.hardwareConcurrency, ramGB: n.deviceMemory ?? "n/d", schermo: `${screen.width}x${screen.height}@${devicePixelRatio}`, finestra: `${innerWidth}x${innerHeight}`, orientamento: screen.orientation && screen.orientation.type, standalone: n.standalone === true || matchMedia("(display-mode: standalone)").matches, online: n.onLine };
  if (ua) {
    id.uaMarchi = ua.brands && ua.brands.map((b) => `${b.brand} ${b.version}`).join(", "); id.uaMobile = ua.mobile; id.uaPiattaforma = ua.platform;
    try { const h = await ua.getHighEntropyValues(["model", "platformVersion", "fullVersionList", "architecture", "bitness"]); id.modello = h.model; id.versioneSistema = h.platformVersion; id.architettura = `${h.architecture}/${h.bitness}`; id.versioneBrowser = (h.fullVersionList || []).map((b) => `${b.brand} ${b.version}`).join(", "); }
    catch (e) { id.uaDettagli = "non disponibili: " + e.name; }
  }
  dbg("info", "SONDA 1/4 identità e schermo", id);
  const c = n.connection || n.mozConnection || n.webkitConnection;
  dbg("info", "SONDA 2/4 rete", c ? { tipo: c.type, effettiva: c.effectiveType, downlinkMbps: c.downlink, rttMs: c.rtt, risparmioDati: c.saveData } : "Network Information API assente");
  const api = { getBattery: "getBattery" in n, wakeLock: "wakeLock" in n, share: !!n.share, shareFile: !!(n.canShare && n.canShare({ files: [new File(["x"], "x.txt", { type: "text/plain" })] })), showDirectoryPicker: typeof window.showDirectoryPicker, showSaveFilePicker: typeof window.showSaveFilePicker, mediaRecorder: typeof MediaRecorder, canvasCaptureStream: !!HTMLCanvasElement.prototype.captureStream, requestVideoFrameCallback: !!HTMLVideoElement.prototype.requestVideoFrameCallback, webrtc: typeof RTCPeerConnection, indexedDB: !!window.indexedDB, serviceWorker: "serviceWorker" in n, vibrate: !!n.vibrate, bluetooth: !!n.bluetooth, permissionsApi: !!n.permissions, cryptoSubtle: !!(window.crypto && crypto.subtle) };
  dbg("info", "SONDA 3/4 funzioni del browser", api);
  const mimes = ["video/mp4;codecs=avc1,mp4a.40.2", "video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm;codecs=h264,opus", "video/webm"], rec = {};
  if (typeof MediaRecorder !== "undefined") mimes.forEach((m) => { rec[m] = MediaRecorder.isTypeSupported(m); });
  let rtcCodec = []; try { rtcCodec = [...new Set(RTCRtpSender.getCapabilities("video").codecs.map((x) => x.mimeType.replace("video/", "")))]; } catch { /* ok */ }
  let st = null, pers = null; try { st = await n.storage.estimate(); pers = n.storage.persisted ? await n.storage.persisted() : null; } catch { /* ok */ }
  dbg("info", "SONDA 4/4 registrazione e archivio", { formatiRegistratore: rec, codecWebRTC: rtcCodec, vincoliSupportati: n.mediaDevices && n.mediaDevices.getSupportedConstraints ? n.mediaDevices.getSupportedConstraints() : "n/d", quotaMB: st ? Math.round(st.quota / 1048576) : "n/d", usatoMB: st ? Math.round(st.usage / 1048576) : "n/d", persistente: pers });
}
async function batProbe() {
  const has = "getBattery" in navigator; dbg("info", `API batteria del browser (navigator.getBattery): ${has ? "presente" : "assente"}`, { versione: (navigator.userAgent.match(/Version\/[\d.]+/) || [""])[0], os: OS });
  if (!has) return;
  try { const b = await navigator.getBattery(), rd = () => setBat(Math.round(b.level * 100), b.charging, "browser"); rd(); b.onlevelchange = rd; b.onchargingchange = rd; dbg("info", "batteria letta dal browser", { livello: b.level, inCarica: b.charging }); }
  catch (e) { dbg("warn", `getBattery fallita: ${e.name}: ${e.message}`); }
}
function stateObj() {
  const v = $("vid");
  return { id: ID, fp: FP, name: cfg.name, device: cfg.device, os: OS, camReady: !!stream, rec: !!recording && !recording.stopping, recSid: recording ? recording.sid : null, station: !!cfg.station, localRec: !!cfg.localRec, recMs: recording ? Date.now() - recording.start : 0, res: cfg.res, bps: Number(cfg.bps),
    bufMB: Math.round(bufBytes() / 1048576), maxBufMB: Math.round(MAX_BUF / 1048576), space: spaceState(), standby, err: lastErr, battery: bat.level, charging: bat.charging, batAt: bat.at, zoom: zoomInfo(), pro: proInfo(), storage: storageMode, tl: tlState(),
    vw: v.videoWidth || 0, vh: v.videoHeight || 0, xfer: xferBusy ? { sid: xferBusy.sid, pct: xferBusy.pct || 0 } : null, label, clockOff, clips: sessions.slice(0, 8).map((s) => ({ id: s.id, file: clipFile(s, /webm/.test(s.mime || "") ? "webm" : "mp4"), dur: s.dur, mb: Math.round(s.bytes / 1048576), status: s.status, kind: s.kind || "video" })), ts: Date.now() };
}
function publish() { if (joinState === "no" && Date.now() - (publish.t || 0) < 5000) { renderStat(); return; } publish.t = Date.now(); try { rt?.send("state", stateObj()); } catch (e) { dbg("warn", `invio stato: ${e.message}`); } renderStat(); }
function renderStat() {
  const s = stateObj(), row = (a, b, adv) => `<tr${adv ? ' class="adv-only"' : ""}><td>${a}</td><td>${b}</td></tr>`;
  $("stat").innerHTML = row("Regia", joinText() + (label ? " · " + label : "")) + row("Protezione", pairing && pairing.p ? "comandi firmati dalla regia" : "nessuna (link senza chiave)", 1) + row("Camera", s.camReady ? `accesa ${s.vw}×${s.vh}` : "spenta") + row("Trasferimento file", xferBusy ? `in corso ${xferBusy.pct || 0}%` : "nessuno") + row("Registrazione", s.rec ? `<b class="err">IN REC ${fmtT(s.recMs)}</b>` : "ferma") + row("Spazio per registrare", spaceText()) + row("Spazio usato dal buffer", `${s.bufMB} MB su ${s.maxBufMB} MB`, 1) + row("Archivio", storageMode === "indexeddb" ? "su disco" : '<b class="err">solo in memoria (a rischio)</b>', storageMode === "indexeddb") + row("Batteria", s.battery == null ? "non disponibile" : `${Math.round(s.battery)}%${s.charging ? " (in carica)" : ""}`) + row("Time-lapse", s.tl ? `${s.tl.stage === "rendering" ? "creo il video " + Math.round(s.tl.progress * 100) + "%" : "in ripresa"} · ${s.tl.frames} immagini · ogni ${s.tl.intS} s` : "no", !s.tl) + row("Schermo nero", standby ? "attivo" : "no") + row("Collegamento", $("connTxt").textContent, 1) + row("ID camera", `…${ID.slice(-6)} (${idSrc.src})`, 1);
  $("msg").innerHTML = lastErr ? `<span class="err">${lastErr}</span>` : "";
  { const b = $("recLocal"); if (b) { b.hidden = !(cfg.localRec && stream); b.textContent = s.rec ? "■ STOP" : "● REC"; b.classList.toggle("on", !!s.rec); } }
  $("recBtn").textContent = s.rec ? "■ STOP (prova locale)" : "● REC (prova locale)";
  $("connPill").className = "pill " + (s.rec ? "rec" : /^connesso/.test($("connTxt").textContent) ? "ok" : "");
}
function renderClips() {
  const el = $("clips"); $("clipPanel").hidden = !sessions.length;
  el.innerHTML = sessions.map((s) => `<li><b>${clipFile(s)}</b><br><span class="muted">${new Date(s.start).toLocaleString("it-IT")} · ${fmtT(s.dur)} · ${(s.bytes / 1048576).toFixed(0)} MB · ${s.res} · ${s.status}</span><br>${s.kind === "timelapse" ? `<span class="muted">time-lapse · ${s.frames} immagini a ${s.fps} fps</span><br>` : ""}${s.status === "video non creato" ? `<button data-redo="${s.id}">Ricrea il video</button>` : `<button data-save="${s.id}">Salva in Foto / File</button>`}<button data-del="${s.id}">Elimina</button></li>`).join("");
  $("clipNote").textContent = sessions.length ? "Le registrazioni restano qui finché non vengono trasferite o eliminate. Safari può cancellare i dati dopo 7 giorni senza uso." : "";
}
$("clips").onclick = async (e) => {
  const sv = e.target.closest("[data-save]"), dl = e.target.closest("[data-del]"), rd = e.target.closest("[data-redo]");
  if (rd && !tl) {
    const s = sessions.find((x) => x.id === rd.dataset.redo); rd.disabled = true; rd.textContent = "Creo…"; dbg("info", `ricreo il video del time-lapse ${s.id}`);
    try { const base = s.src || s.id, keys = await db.frameKeys(base); if (!keys.length) throw new Error("immagini non più presenti"); await tlRender(base, keys, s.fps || 30, s.start, true); const ns = (await db.sessions()).find((x) => x.id === base + "v"); if (ns && ns.status === "pronta") await db.delSession(s.id); } catch (x) { lastErr = "Ricreazione fallita: " + x.name; dbg("error", `ricreazione fallita: ${x.name}: ${x.message}`); }
    await loadSessions(); publish(); return;
  }
  if (sv) {
    const s = sessions.find((x) => x.id === sv.dataset.save); sv.disabled = true; sv.textContent = "Preparo…"; dbg("info", `salvataggio di ${s.id} richiesto`);
    try { const blob = new Blob(await db.chunks(s.id), { type: s.mime }), f = new File([blob], clipFile(s, "mp4"), { type: s.mime }); dbg("info", `file pronto ${(blob.size / 1048576).toFixed(0)} MB`); if (navigator.canShare?.({ files: [f] })) await navigator.share({ files: [f] }); else { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = f.name; a.click(); } }
    catch (x) { if (x.name !== "AbortError") { lastErr = "Salvataggio: " + x.name; dbg("error", `salvataggio fallito: ${x.name}: ${x.message}`); renderStat(); } else dbg("info", "salvataggio annullato dall'utente"); }
    sv.disabled = false; sv.textContent = "Salva in Foto / File";
  }
  if (dl && confirm("Eliminare questa registrazione dal telefono?")) { dbg("info", `elimino ${dl.dataset.del}`); await db.delSession(dl.dataset.del); await loadSessions(); publish(); }
};
