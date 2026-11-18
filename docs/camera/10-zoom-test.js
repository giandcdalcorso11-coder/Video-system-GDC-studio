"use strict";
/* ===== Test zoom digitale (sperimentale) ===== */
let zoomTesting = false;
async function zoomTest() {
  if (zoomTesting) return;
  if (recording || (tl && tl.stage)) { lastErr = "Ferma registrazione e time-lapse prima del test zoom"; publish(); return; }
  zoomTesting = true; const btn = $("zoomTest"), wasOpen = !!stream, T0 = performance.now(), results = [], Z = (m, x) => dbg("info", "ZOOM " + m, x), ZE = (m, x) => dbg("error", "ZOOM " + m, x);
  const DUR = window.__zoomDur || 6000, pct = (a, p) => { if (!a.length) return 0; const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(s.length * p))]; }, avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0), r1 = (n) => Math.round(n * 10) / 10;
  const lt = { n: 0, max: 0, sum: 0 }; let po = null, curPhase = "", abortRun = false;
  const tmo = (p, ms, lab) => Promise.race([p, new Promise((_, ko) => setTimeout(() => ko(new Error(`timeout ${ms} ms in "${lab}"`)), ms))]);
  try { po = new PerformanceObserver((l) => l.getEntries().forEach((e) => { lt.n++; lt.sum += e.duration; lt.max = Math.max(lt.max, e.duration); })); po.observe({ entryTypes: ["longtask"] }); } catch { Z("longtask non supportato da questo browser"); }
  btn.disabled = true; btn.textContent = "Test zoom in corso…"; lastErr = ""; publish();
  const getMedia = async (res) => {
    const [w, h] = RES[res], base = { video: { facingMode: cfg.facing, width: { ideal: w }, height: { ideal: h }, frameRate: { ideal: 30 } } }, t0 = performance.now();
    let st; try { st = await navigator.mediaDevices.getUserMedia({ ...base, audio: true }); } catch (e) { Z(`apertura ${res} con audio fallita: ${e.name}: ${e.message}`); st = await navigator.mediaDevices.getUserMedia({ ...base, audio: false }); }
    const vt = st.getVideoTracks()[0], at = st.getAudioTracks()[0]; Z(`aperta ${res} in ${Math.round(performance.now() - t0)} ms`, { video: vt.getSettings(), audio: at ? at.getSettings() : "assente" }); return st;
  };
  const run = async (name, st, z0, z1, withRtc, native, noAudio, direct) => {
    const res = { name, z0, z1, rtc: !!withRtc, nativo: !!native, senzaAudio: !!noAudio, diretto: !!direct }; curPhase = "avvio"; abortRun = false; const vt0 = st.getVideoTracks()[0]; let lastZ = 0;
    const v = document.createElement("video"); v.muted = true; v.playsInline = true; v.setAttribute("playsinline", ""); v.srcObject = new MediaStream(st.getVideoTracks()); curPhase = "play sorgente"; await tmo(v.play(), 4000, "play sorgente").catch((e) => Z(`play sorgente: ${e.name || ""} ${e.message}`));
    for (let i = 0; i < 60 && !v.videoWidth; i++) await sleep(50);
    const vw = v.videoWidth, vh = v.videoHeight; if (!vw) throw new Error("video sorgente senza dimensioni");
    const port = vh >= vw, ow = port ? 1080 : 1920, oh = port ? 1920 : 1080, cv = document.createElement("canvas"); cv.width = ow; cv.height = oh; const g = cv.getContext("2d");
    const cs = direct ? new MediaStream(st.getVideoTracks()) : cv.captureStream(30), at0 = st.getAudioTracks()[0], at = (at0 && !noAudio) ? at0.clone() : null; if (at) cs.addTrack(at); curPhase = "avvio registratore";
    const mime = ["video/mp4;codecs=avc1,mp4a.40.2", "video/mp4;codecs=avc1", "video/mp4"].find((x) => MediaRecorder.isTypeSupported(x));
    const mr = new MediaRecorder(cs, { ...(mime ? { mimeType: mime } : {}), videoBitsPerSecond: 20000000 }), chunks = []; mr.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); }; mr.onerror = (e) => ZE(`MediaRecorder: ${e.error?.name} ${e.error?.message}`);
    const stopped = new Promise((r) => (mr.onstop = r));
    let pc1 = null, pc2 = null, rtcInfo = null;
    if (withRtc) {
      try {
        pc1 = new RTCPeerConnection(); pc2 = new RTCPeerConnection(); pc1.onicecandidate = (e) => e.candidate && pc2.addIceCandidate(e.candidate).catch(() => {}); pc2.onicecandidate = (e) => e.candidate && pc1.addIceCandidate(e.candidate).catch(() => {});
        pc2.ontrack = () => {}; pc1.addTrack(cs.getVideoTracks()[0], cs); const o = await pc1.createOffer(); await pc1.setLocalDescription(o); await pc2.setRemoteDescription(o); const a = await pc2.createAnswer(); await pc2.setLocalDescription(a); await pc1.setRemoteDescription(a);
      } catch (e) { rtcInfo = { errore: `${e.name}: ${e.message}` }; ZE(`WebRTC locale: ${e.name}: ${e.message}`); }
    }
    const dr = [], iv = [], secs = []; let frames = 0, lastT = 0, lastDraw = 0, srcF = 0, secStart = 0, secN = 0, stop = false;
    if (v.requestVideoFrameCallback) { const cb = () => { srcF++; if (!stop) v.requestVideoFrameCallback(cb); }; v.requestVideoFrameCallback(cb); }
    const ltBefore = { ...lt }; curPhase = "ripresa"; mr.start(1000); const t0 = performance.now(); secStart = t0;
    await new Promise((resolve) => {
      const tick = (now) => {
        const el = performance.now() - t0; if (abortRun || el >= DUR) { stop = true; resolve(); return; }
        if (direct && native && now - lastZ >= 120) { lastZ = now; vt0.applyConstraints({ advanced: [{ zoom: z0 + (z1 - z0) * Math.min(1, el / DUR) }] }).catch(() => {}); }
        if (!direct && now - lastDraw >= 1000 / 30 - 4) {
          const z = z0 + (z1 - z0) * Math.min(1, el / DUR), zc = native ? 1 : z, sw = vw / zc, sh = vh / zc, a = performance.now();
          if (native && now - lastZ >= 120) { lastZ = now; vt0.applyConstraints({ advanced: [{ zoom: z }] }).catch(() => {}); }
          g.drawImage(v, (vw - sw) / 2, (vh - sh) / 2, sw, sh, 0, 0, ow, oh); dr.push(performance.now() - a); if (lastT) iv.push(now - lastT); lastT = now; lastDraw = now; frames++; secN++;
        }
        if (performance.now() - secStart >= 1000) { secs.push(secN); secN = 0; secStart = performance.now(); }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    const wall = (performance.now() - t0) / 1000; curPhase = "statistiche"; if (direct) frames = srcF;
    if (native) { try { res.zoomNativoFinale = vt0.getSettings().zoom; await vt0.applyConstraints({ advanced: [{ zoom: 1 }] }); } catch { /* ok */ } }
    if (pc1) { try { const s1 = await pc1.getStats(), s2 = await pc2.getStats(); rtcInfo = {}; s1.forEach((x) => { if (x.type === "outbound-rtp" && x.kind === "video") rtcInfo.invio = { frameCodificati: x.framesEncoded, larghezza: x.frameWidth, altezza: x.frameHeight, fps: x.framesPerSecond, limitazione: x.qualityLimitationReason, byte: x.bytesSent }; }); s2.forEach((x) => { if (x.type === "inbound-rtp" && x.kind === "video") rtcInfo.ricevuto = { frameDecodificati: x.framesDecoded, larghezza: x.frameWidth, altezza: x.frameHeight, fps: x.framesPerSecond, persi: x.packetsLost, byte: x.bytesReceived }; }); } catch (e) { rtcInfo = { errore: e.message }; } try { pc1.close(); pc2.close(); } catch { /* ok */ } }
    await sleep(250); try { mr.requestData(); } catch { /* ok */ } await sleep(150); curPhase = "stop registratore"; try { mr.stop(); await tmo(stopped, 6000, "stop registratore"); } catch (e) { ZE(`stop registratore: ${e.message}`); } if (at) at.stop(); curPhase = "lettura file";
    const q = v.getVideoPlaybackQuality ? v.getVideoPlaybackQuality() : null; v.pause(); v.srcObject = null;
    const blob = new Blob(chunks, { type: mr.mimeType || mime || "video/mp4" }), crop = { w: Math.round(vw / Math.max(z0, z1 === z0 ? z0 : (z0 + z1) / 2)), h: 0 }; crop.h = Math.round(crop.w * vh / vw);
    Object.assign(res, { sorgente: `${vw}x${vh}`, uscita: `${ow}x${oh}`, ritaglioRealeMedio: direct ? "nativo, registrazione diretta senza canvas" : native ? "nativo (nessun ritaglio)" : `${crop.w}x${crop.h}`, secondi: r1(wall), fotogrammiDisegnati: frames, fpsUscita: r1(frames / wall), fpsPerSecondo: secs.join("/"), fpsSorgente: v.requestVideoFrameCallback ? r1(srcF / wall) : "n/d", disegno_ms: { medio: r1(avg(dr)), p95: r1(pct(dr, 0.95)), max: r1(Math.max(0, ...dr)) }, intervalli_ms: { medio: r1(avg(iv)), p95: r1(pct(iv, 0.95)), max: r1(Math.max(0, ...iv)) }, scartatiDalPlayer: q ? { totali: q.totalVideoFrames, persi: q.droppedVideoFrames } : "n/d", longTask: { n: lt.n - ltBefore.n, max_ms: Math.round(lt.max) }, file: { mime: mr.mimeType, MB: r1(blob.size / 1048576), pezzi: chunks.length, Mbps: r1((blob.size * 8) / wall / 1e6) } });
    if (rtcInfo) res.webrtc = rtcInfo;
    if (blob.size) {
      const u = URL.createObjectURL(blob), p = document.createElement("video"); p.muted = true; p.playsInline = true; p.setAttribute("playsinline", ""); p.src = u;
      try {
        await new Promise((ok, ko) => { p.onloadedmetadata = ok; p.onerror = () => ko(new Error("file non riproducibile")); setTimeout(() => ko(new Error("timeout metadati")), 6000); });
        curPhase = "riproduzione file"; await tmo(p.play(), 4000, "riproduzione file").catch(() => {}); await sleep(1200);
        res.riproduzione = { durata_s: r1(p.duration), previstaS: r1(wall), dimensioni: `${p.videoWidth}x${p.videoHeight}`, tracceAudio: p.audioTracks ? p.audioTracks.length : "n/d", byteAudioDecodificati: p.webkitAudioDecodedByteCount ?? "n/d", byteVideoDecodificati: p.webkitVideoDecodedByteCount ?? "n/d" };
      } catch (e) { res.riproduzione = { errore: e.message }; }
      p.pause(); p.removeAttribute("src"); URL.revokeObjectURL(u);
    } else res.riproduzione = { errore: "file vuoto" };
    const pb = [], fps = res.fpsUscita;
    if (fps < 27) pb.push(`fps uscita bassi (${fps})`); if (res.intervalli_ms.p95 > 70) pb.push(`intervalli irregolari (p95 ${res.intervalli_ms.p95} ms)`); if (res.file.MB === 0) pb.push("file vuoto"); if (res.riproduzione && res.riproduzione.errore) pb.push("riproduzione: " + res.riproduzione.errore);
    if (res.riproduzione && res.riproduzione.durata_s && Math.abs(res.riproduzione.durata_s - res.secondi) > 1) pb.push(`durata file ${res.riproduzione.durata_s}s diversa da ${res.secondi}s`);
    if (at && res.riproduzione && res.riproduzione.tracceAudio === 0) pb.push("traccia audio assente nel file");
    res.esito = pb.length ? "PROBLEMA: " + pb.join("; ") : "OK"; (pb.length ? ZE : Z)(`RISULTATO ${name}`, res); results.push(res); return res;
  };
  try {
    Z("=== INIZIO TEST ZOOM DIGITALE ===", { pagina: PAGE_VERSION, ua: navigator.userAgent, core: navigator.hardwareConcurrency, ramGB: navigator.deviceMemory ?? "n/d", schermo: `${screen.width}x${screen.height}@${devicePixelRatio}`, visibilita: document.visibilityState, durataPerProva_s: DUR / 1000, supportati: navigator.mediaDevices.getSupportedConstraints ? navigator.mediaDevices.getSupportedConstraints() : "n/d", canvasCapture: !!HTMLCanvasElement.prototype.captureStream, frameCallback: !!HTMLVideoElement.prototype.requestVideoFrameCallback, mp4: ["video/mp4;codecs=avc1,mp4a.40.2", "video/mp4;codecs=avc1", "video/mp4"].map((m) => m + "=" + MediaRecorder.isTypeSupported(m)) });
    if (wasOpen) stopCam(); await sleep(400);
    const plan = [
      ["1080p", false, [["1080p DIRETTO con audio (1ª, flusso condiviso)", 1, 1, false, false, false, true], ["1080p DIRETTO con audio (2ª, stesso flusso)", 1, 1, false, false, false, true], ["1080p DIRETTO zoom nativo 1x→3x (3ª, stesso flusso)", 1, 3, false, true, false, true]]],
      ["4K", false, [["4K DIRETTO fisso 1x (senza canvas)", 1, 1, false, false, false, true], ["4K DIRETTO zoom nativo 1x→3x", 1, 3, false, true, false, true], ["4K DIRETTO zoom nativo 1x→3x + anteprima WebRTC", 1, 3, true, true, false, true]]],
    ], total = plan.reduce((a, p) => a + p[2].length, 0); let n = 0;
    for (const [res, perRun, runs] of plan) {
      let st = null;
      if (!perRun) { btn.textContent = `Test zoom: apro ${res}…`; try { st = await getMedia(res); } catch (e) { ZE(`impossibile aprire ${res}: ${e.name}: ${e.message}`); continue; } }
      for (const [name, z0, z1, rtc, nat, noAudio, dir] of runs) {
        n++; btn.textContent = `Test zoom ${n}/${total}: ${name}`;
        if (perRun) { try { st = await getMedia(res); } catch (e) { ZE(`impossibile aprire ${res}: ${e.name}: ${e.message}`); results.push({ name, esito: "ERRORE: camera non aperta" }); continue; } }
        try { await tmo(run(name, st, z0, z1, rtc, nat, noAudio, dir), DUR + 25000, "prova intera"); } catch (e) { abortRun = true; ZE(`prova "${name}" fallita nella fase "${curPhase}": ${e.name}: ${e.message}`); results.push({ name, esito: `ERRORE (fase ${curPhase}): ${e.message}` }); }
        if (perRun) { st.getTracks().forEach((t) => t.stop()); st = null; }
        await sleep(700);
      }
      if (st) { st.getTracks().forEach((t) => t.stop()); await sleep(600); }
    }
    const ok = results.filter((r) => r.esito === "OK").length;
    Z(`=== FINE TEST ZOOM: ${ok}/${results.length} prove OK in ${Math.round((performance.now() - T0) / 1000)} s ===`, { longTaskTotali: lt.n, longTaskMax_ms: Math.round(lt.max), sintesi: results.map((r) => `${r.name}: ${r.esito === "OK" ? "OK" : r.esito} · ${r.fpsUscita ?? "?"} fps · ${r.file ? r.file.Mbps + " Mbps" : ""}`) });
  } catch (e) { ZE(`test interrotto: ${e.name}: ${e.message}`); }
  finally {
    if (po) try { po.disconnect(); } catch { /* ok */ }
    zoomTesting = false; btn.disabled = false; btn.textContent = "Test zoom digitale";
    if (wasOpen) { try { await openCam(); } catch (e) { ZE(`riapertura camera dopo il test: ${e.name}`); } }
    for (let i = 0; i < 40 && dbgOut.length; i++) { flushDbg(); await sleep(350); }
    lastErr = ""; publish();
  }
}
