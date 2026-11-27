"use strict";
/* ===== Anteprima WebRTC verso la dashboard ===== */
const pcs = {};
const plain = (d) => ({ type: d.type, sdp: d.sdp });
function closePreviews() { for (const k in pcs) { try { clearInterval(pcs[k].statT); pcs[k].pc.close(); } catch { /* ok */ } delete pcs[k]; } }
async function rtcStats(pc, tag) {
  try {
    const r = await pc.getStats(), out = { tag }; let pair = null; const cands = {};
    r.forEach((x) => { if (x.type === "outbound-rtp" && x.kind === "video") Object.assign(out, { inviati: x.framesEncoded, larg: x.frameWidth, alt: x.frameHeight, fps: x.framesPerSecond, bytes: x.bytesSent, limite: x.qualityLimitationReason }); if (x.type === "candidate-pair" && (x.nominated || x.selected) && x.state === "succeeded") pair = x; if (x.type === "local-candidate" || x.type === "remote-candidate") cands[x.id] = x.candidateType; });
    if (pair) Object.assign(out, { coppia: `${cands[pair.localCandidateId] || "?"}→${cands[pair.remoteCandidateId] || "?"}`, rtt_ms: pair.currentRoundTripTime != null ? Math.round(pair.currentRoundTripTime * 1000) : null });
    dbg("info", "WebRTC statistiche", out);
  } catch (e) { dbg("warn", `statistiche WebRTC: ${e.message}`); }
}
async function applyPreviewParams(pc, q) {
  const mini = q === "mini";
  for (const sender of pc.getSenders()) {
    if (!sender.track || sender.track.kind !== "video") continue;
    const scale = Math.max(1, (sender.track.getSettings().height || 1920) / (mini ? 360 : 720));
    for (const withFps of mini ? [true, false] : [false]) {
      try { const p = sender.getParameters(); if (!p.encodings || !p.encodings.length) p.encodings = [{}]; p.encodings[0].maxBitrate = mini ? 500000 : 1500000; p.encodings[0].scaleResolutionDownBy = scale; if (withFps) p.encodings[0].maxFramerate = 15; await sender.setParameters(p); dbg("info", "parametri invio anteprima applicati", { qualita: q, maxBitrate: p.encodings[0].maxBitrate, scala: +scale.toFixed(2), maxFramerate: withFps ? 15 : "non impostato" }); break; }
      catch (e) { dbg("warn", `setParameters (${q}${withFps ? " con fps" : ""}): ${e.name}: ${e.message}`); }
    }
  }
}
async function startPreview(dashId, q) {
  if (!stream || !rt) { lastErr = "Anteprima: avvia prima la camera"; dbg("warn", "preview_start senza camera"); publish(); return; }
  try { clearInterval(pcs[dashId]?.statT); pcs[dashId]?.pc.close(); } catch { /* ok */ }
  const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] }); pcs[dashId] = { pc, pending: [], statT: 0, q }; AudioDiag.previewAt = Date.now(); dbg("info", `anteprima ${q || "full"} verso ${dashId}: creo la connessione WebRTC`);
  pc.onconnectionstatechange = () => { dbg("info", `WebRTC connessione: ${pc.connectionState}`); if (pc.connectionState === "connected") { const e = pcs[dashId]; if (e) { clearInterval(e.statT); e.statT = setInterval(() => rtcStats(pc, "10s"), 10000); setTimeout(() => rtcStats(pc, "avvio"), 2500); } } };
  pc.oniceconnectionstatechange = () => dbg("info", `WebRTC ICE: ${pc.iceConnectionState}`); pc.onsignalingstatechange = () => dbg("info", `WebRTC signaling: ${pc.signalingState}`); pc.onicegatheringstatechange = () => dbg("info", `WebRTC raccolta ICE: ${pc.iceGatheringState}`);
  stream.getVideoTracks().forEach((t) => pc.addTrack(t, stream));
  let nc = 0; pc.onicecandidate = (e) => { if (e.candidate) { nc++; rt.send("rtc", { to: dashId, from: ID, kind: "cand", data: e.candidate.toJSON() }); } else dbg("info", `candidati ICE inviati: ${nc}`); };
  await pc.setLocalDescription(await pc.createOffer()); await applyPreviewParams(pc, q);
  rt.send("rtc", { to: dashId, from: ID, kind: "offer", data: plain(pc.localDescription) }); dbg("info", "offerta WebRTC inviata");
}
async function onRtc(m) {
  if (m.to !== ID) return; const e = pcs[m.from]; if (!e) { dbg("warn", `segnale rtc ${m.kind} senza connessione attiva`); return; }
  try {
    if (m.kind === "answer") { await e.pc.setRemoteDescription(m.data); dbg("info", "risposta WebRTC ricevuta"); for (const c of e.pending.splice(0)) await e.pc.addIceCandidate(c).catch(() => {}); }
    else if (m.kind === "cand") { if (e.pc.remoteDescription) e.pc.addIceCandidate(m.data).catch((x) => dbg("warn", `candidato ICE rifiutato: ${x.message}`)); else e.pending.push(m.data); }
  } catch (x) { dbg("error", `segnale rtc ${m.kind}: ${x.name}: ${x.message}`); }
}
