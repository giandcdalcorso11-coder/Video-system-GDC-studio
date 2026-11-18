"use strict";
/* ===== Trasporto =====
   Interfaccia: transport.send(camId, {cmd,...}) e transport.onState(cb(camId, stato)).
   Comandi: connect | disconnect | rec_start | rec_stop | move {pan,tilt} | home | charge {on}
   Il MockTransport simula le camere; sarà sostituito da una connessione reale (WebSocket). */
class MockTransport {
  constructor() { this.cb = () => {}; this.s = {}; }
  onState(cb) { this.cb = cb; }
  add(cam, connectAfter) {
    this.s[cam.id] = { online: false, rec: false, recStart: 0, battery: 78, charging: false, freeGb: cam.freeGb, totalGb: cam.totalGb,
      pan: 0, tilt: 0, rssi: -58, latency: 24, res: "1080p · 30 fps", orient: "Verticale 9:16", clips: [], n: 0 };
    if (connectAfter != null) setTimeout(() => this.send(cam.id, { cmd: "connect" }), connectAfter);
    this.push(cam.id);
  }
  remove(id) { delete this.s[id]; }
  start() { setInterval(() => this.tick(), 1000); }
  push(id) { if (this.s[id]) this.cb(id, this.s[id]); }
  tick() {
    for (const id in this.s) {
      const st = this.s[id]; if (!st.online) continue;
      if (st.rec) st.freeGb = Math.max(0, +(st.freeGb - 0.01).toFixed(3));
      st.battery = Math.min(100, Math.max(1, st.battery + (st.charging ? 0.15 : st.rec ? -0.12 : -0.04)));
      st.rssi = Math.max(-85, Math.min(-40, st.rssi + (Math.random() - 0.5) * 3));
      st.latency = Math.max(8, Math.round(st.latency + (Math.random() - 0.5) * 6));
      this.push(id);
    }
  }
  send(id, m) {
    const st = this.s[id], cam = camById(id); if (!st) return;
    const clamp = (v, l) => Math.max(-l, Math.min(l, v));
    switch (m.cmd) {
      case "connect": st.online = true; break;
      case "disconnect": if (st.rec) this.stopRec(st, cam); st.online = false; break;
      case "rec_start": if (st.online && !st.rec) { st.rec = true; st.recStart = Date.now(); } break;
      case "rec_stop": if (st.rec) this.stopRec(st, cam); break;
      case "move": if (st.online) { st.pan = clamp(st.pan + (m.pan || 0), PAN_LIMIT); st.tilt = clamp(st.tilt + (m.tilt || 0), TILT_LIMIT); } break;
      case "home": st.pan = 0; st.tilt = 0; break;
      case "charge": st.charging = !!m.on; break;
    }
    this.push(id);
  }
  stopRec(st, cam) {
    const ms = Date.now() - st.recStart; st.rec = false; st.n++;
    st.clips.unshift({ file: `${cam.name.toUpperCase().replace(/\s+/g, "_")}_${String(st.n).padStart(3, "0")}`, dur: ms, mb: Math.round(ms / 60000 * MB_PER_MIN) });
  }
}
let suggestMerge = null;
class RealtimeTransport {
  constructor(p) { this.p = p; this.cb = () => {}; this.s = {}; this.seen = {}; this.rt = null; this.id = store.get("gdc.dashId", null) || (() => { const v = "dash-" + Math.random().toString(36).slice(2, 8); store.set("gdc.dashId", v); return v; })(); }
  onState(cb) { this.cb = cb; }
  blank() { return { online: false, rec: false, recStart: 0, battery: null, charging: null, bufMB: null, maxBufMB: null, bps: 0, pan: 0, tilt: 0, rssi: null, latency: null, res: "—", orient: "—", clips: [], real: true, camReady: false, standby: false, err: "", storage: "", tl: null, tlStage: "" }; }
  add(cam) { this.s[cam.id] = this.blank(); this.push(cam.id); }
  remove(id) { delete this.s[id]; delete this.seen[id]; }
  push(id) { if (this.s[id]) this.cb(id, this.s[id]); }
  start() {
    this.rt = GDC_RT.connect({ pairing: this.p, role: "dashboard", id: this.id, meta: { name: "dashboard" }, mock: MOCK_RT, log: (l, m) => dbg(l, "rt", m) });
    this.rt.onStatus((s) => { setConn(s); if (/^connesso/.test(s)) this.rt.send("hello", { from: this.id }); });
    this.rt.on("state", (m) => this.onCamState(m)); this.rt.on("rtc", (m) => Preview.onSignal(m)); this.rt.on("xrtc", (m) => { if (m && m.to === this.id) GDC_XFER.signal(m); }); this.rt.on("xdone", (m) => Xfer.onDone(m));
    this.rt.on("ack", (m) => { if (m.cmd === "ping") { Clock.onAck(m); return; } dbg(m.ok ? "info" : "warn", "ack", `${m.cmd} da ${m.id}: ${m.ok ? "ok" : "NON RIUSCITO"}`, { rid: m.rid, detail: m.detail }); if (!m.ok) { const c = camById(m.id); log(m.id, `${c ? camTitle(c) : m.id}: comando "${m.cmd}" non riuscito${typeof m.detail === "string" ? " (" + m.detail + ")" : ""}`); } });
    this.rt.on("dbg", (m) => { const c = camById(m.id), src = "cam " + (c ? c.name : m.id); (m.lines || []).forEach((x) => adv.push({ t: x.t, l: x.l, s: src, m: x.m })); while (adv.length > ADVMAX) adv.shift(); scheduleAdv(); });
    setInterval(() => this.sweep(), 2000);
  }
  onCamState(m) {
    if (!m || !/^[A-Za-z0-9_-]{3,40}$/.test(String(m.id))) return; const now = Date.now(); this.seen[m.id] = now; let isNew = false;
    let cam = camById(m.id);
    if (REAL && !cam && !Join.ok.has(m.id)) { if (Join.rejected.has(m.id)) { Join.deny(m.id); return; } if (Join.approve) { Join.hold(m); return; } }
    if (REAL && cam) { Join.greet(m.id); Clock.maybe(m.id); if (now - (cam.seen || 0) > 60000) { cam.seen = now; saveCams(); } }
    if (!cam) {
      cam = { id: m.id, device: m.device || "Telefono", name: m.name || m.id, os: m.os || "—", totalGb: 0, freeGb: 0, fp: m.fp, num: REAL ? (() => { const k = Number((String(m.label || "").match(/^Camera (\d+)$/) || [])[1]); return k > 0 && !cameras.some((x) => x.num === k) ? k : nextNum(); })() : 0, seen: now }; cameras.push(cam); saveCams(); isNew = true;
      log(m.id, `${cam.device} · ${cam.name}: camera collegata`); dbg("info", "camere", `nuova camera ${m.id}`, { device: m.device, name: m.name, os: m.os, fp: m.fp });
      const twin = m.fp && cameras.find((c) => c.id !== m.id && c.fp && c.fp === m.fp && !(this.s[c.id] && this.s[c.id].online));
      if (twin) { suggestMerge = { oldId: twin.id, newId: m.id }; dbg("warn", "camere", `possibile stesso telefono: ${m.id} come ${twin.id} (stessa impronta ${m.fp}, l'altra è offline)`); }
    } else if (m.fp && cam.fp !== m.fp) { cam.fp = m.fp; saveCams(); }
    const st = this.s[m.id] || this.blank(), before = { online: st.online, rec: st.rec, camReady: st.camReady, standby: st.standby, err: st.err, res: st.res, storage: st.storage, tlStage: st.tlStage };
    Object.assign(st, { online: true, rec: !!m.rec, recSid: m.recSid || null, station: !!m.station, recStart: now - (m.recMs || 0), battery: m.battery ?? null, charging: m.charging ?? null, batAt: m.batAt || 0, zoom: m.zoom || null, pro: m.pro || null, space: m.space || null, bufMB: m.bufMB, maxBufMB: m.maxBufMB, bps: m.bps,
      res: `${m.res} · ${Math.round(m.bps / 1e6)} Mbps`, orient: m.vh ? `${m.vh >= m.vw ? "Verticale" : "Orizzontale"} ${m.vw}×${m.vh}` : "—", clips: m.clips || [], camReady: !!m.camReady, standby: !!m.standby, err: m.err || "", storage: m.storage || "", tl: m.tl || null, tlStage: m.tl ? m.tl.stage : "" });
    const ch = Object.keys(before).filter((k) => before[k] !== st[k]).map((k) => `${k}: ${before[k]} → ${st[k]}`);
    if (ch.length) dbg("info", "camera " + m.id, `cambiamenti: ${ch.join("; ")}`);
    this.rxN = this.rxN || {}; this.rxN[m.id] = (this.rxN[m.id] || 0) + 1;
    if (ch.length || this.rxN[m.id] % 15 === 1) dbg("trace", "rx", `stato ${m.id} cam=${m.camReady ? "on" : "off"} rec=${m.rec} ${m.recMs || 0}ms buf=${m.bufMB}MB archivio=${m.storage} standby=${m.standby} batt=${m.battery} dim=${m.vw}x${m.vh} err="${m.err || ""}" età=${now - (m.ts || now)}ms`);
    this.s[m.id] = st; this.push(m.id); if (REAL && isNew) { Join.greet(m.id); Clock.maybe(m.id); }
    if (st.err && st.err !== before.err) log(m.id, `${camTitle(camById(m.id))}: ${st.err}`);
    if ((isNew || suggestMerge) && curDetail == null && isNew) route();
    Preview.ensure(m.id); if (REAL) { Xfer.autoTick(m.id); Marks.learn(); }
  }
  sweep() { const now = Date.now(); for (const id in this.s) { const st = this.s[id]; if (st.online && now - (this.seen[id] || 0) > 8000) { st.online = false; st.rec = false; st.camReady = false; this.push(id); Preview.reset(id); dbg("warn", "camera " + id, `nessuno stato da ${now - (this.seen[id] || 0)} ms: la segno offline`); log(id, `${camTitle(camById(id))}: camera non raggiungibile`); } } }
  // ogni comando parte firmato con la chiave privata della regia (in ordine, uno dopo l'altro)
  sendCmd(p) { this.q = (this.q || Promise.resolve()).then(() => GDC_AUTH.signCmd(pairing, p)).then((sp) => this.rt.send("cmd", sp)).catch((e) => dbg("error", "tx", `comando ${p.cmd} non inviato: ${e.message}`)); }
  send(id, m) {
    if (!this.rt) { dbg("warn", "tx", `comando ${m.cmd} scartato: collegamento non pronto`); return; }
    if (!["rec_start", "rec_stop", "standby", "config", "rename", "preview_start", "preview_stop", "battery", "tl_start", "tl_stop", "zoom", "xfer_start", "xfer_test", "space_cfg", "join_result", "ping", "clock", "station_cfg", "pro"].includes(m.cmd)) { log(id, `Comando "${m.cmd}" non disponibile su una camera reale`); dbg("warn", "tx", `comando ${m.cmd} non supportato su camera reale`); return; }
    this.sendCmd({ ...m, to: id, from: this.id });
  }
}
const plainDesc = (d) => ({ type: d.type, sdp: d.sdp });
const Preview = {
  pcs: {}, active: {},
  want(id) { if (!REAL) return null; if (typeof Xfer !== "undefined" && Xfer.active().length && !Xfer.keepPrev) return null; if (curDetail) return curDetail === id ? "full" : null; return store.get("gdc.homePrev", true) ? "mini" : null; },
  start(id, mode) { if (!REAL || !transport.rt || this.active[id]) return; this.active[id] = mode || "full"; dbg("info", "anteprima", `richiedo l'anteprima ${this.active[id]} a ${id}`); transport.sendCmd({ to: id, from: transport.id, cmd: "preview_start", q: this.active[id], rid: rid() }); },
  stop(id) { if (!this.active[id] && !this.pcs[id]) return; dbg("info", "anteprima", `fermo l'anteprima di ${id}`); if (transport.rt) transport.sendCmd({ to: id, from: transport.id, cmd: "preview_stop", rid: rid() }); this.reset(id); },
  stopAll() { Object.keys({ ...this.active, ...this.pcs }).forEach((id) => this.stop(id)); },
  reset(id) { const e = this.pcs[id]; if (e) clearInterval(e.statT); this.active[id] = false; try { e && e.pc && e.pc.close(); } catch { /* ok */ } delete this.pcs[id]; this.detach(id); },
  ensure(id) {
    const w = this.want(id), st = state[id];
    if (!w) { if (this.active[id]) this.stop(id); return; }
    if (!st || !st.online || !st.camReady) return;
    if (this.active[id] === w) return; if (this.active[id]) this.stop(id); this.start(id, w);
  },
  ensureAll() { cameras.forEach((c) => this.ensure(c.id)); },
  detach(id) { const vid = $(`[data-vid="${id}"]`), can = $(`[data-prev="${id}"]`), tag = $(`[data-tag="${id}"]`); if (vid && vid.dataset.live) { vid.srcObject = null; vid.hidden = true; delete vid.dataset.live; if (can) can.hidden = false; if (tag) tag.textContent = REAL ? "ANTEPRIMA NON ATTIVA" : "SIMULATA"; } },
  attach(id, stream) {
    const vid = $(`[data-vid="${id}"]`), can = $(`[data-prev="${id}"]`), tag = $(`[data-tag="${id}"]`);
    dbg("info", "anteprima", `flusso video ricevuto da ${id}`, { tracce: stream.getTracks().map((t) => `${t.kind}:${t.readyState}`), elementoVideo: !!vid });
    if (!vid) return; vid.srcObject = stream; vid.dataset.live = "1"; vid.onloadedmetadata = () => dbg("info", "anteprima", `video ${id}: ${vid.videoWidth}x${vid.videoHeight}`);
    vid.play().catch((e) => dbg("warn", "anteprima", `play(): ${e.name}`)); vid.hidden = false; if (can) can.hidden = true; if (tag) tag.textContent = "LIVE";
  },
  async stats(id) {
    const e = this.pcs[id]; if (!e || !e.pc) return;
    try {
      const r = await e.pc.getStats(); let inb = null, pair = null; const c = {};
      r.forEach((x) => { if (x.type === "inbound-rtp" && x.kind === "video") inb = x; if (x.type === "candidate-pair" && (x.nominated || x.selected) && x.state === "succeeded") pair = x; if (x.type === "local-candidate" || x.type === "remote-candidate") c[x.id] = x.candidateType; });
      const o = { camera: id };
      if (inb) { const dt = e.prevT ? (inb.timestamp - e.prevT) / 1000 : 0; Object.assign(o, { larg: inb.frameWidth, alt: inb.frameHeight, fps: inb.framesPerSecond, decodificati: inb.framesDecoded, persi: inb.framesDropped, pacchettiPersi: inb.packetsLost, jitter_ms: inb.jitter != null ? Math.round(inb.jitter * 1000) : null, kbps: dt ? Math.round(((inb.bytesReceived - e.prevB) * 8) / dt / 1000) : null }); e.prevB = inb.bytesReceived; e.prevT = inb.timestamp; }
      if (pair) Object.assign(o, { coppia: `${c[pair.localCandidateId] || "?"}→${c[pair.remoteCandidateId] || "?"}`, rtt_ms: pair.currentRoundTripTime != null ? Math.round(pair.currentRoundTripTime * 1000) : null });
      dbg("info", "anteprima", "statistiche", o);
    } catch (x) { dbg("warn", "anteprima", `statistiche: ${x.message}`); }
  },
  async onSignal(m) {
    if (m.to !== transport.id) return; const e = (this.pcs[m.from] = this.pcs[m.from] || { pc: null, pending: [], statT: 0 });
    dbg("trace", "anteprima", `segnale ${m.kind} da ${m.from}`);
    try {
      if (m.kind === "offer") {
        clearInterval(e.statT); try { e.pc?.close(); } catch { /* ok */ }
        const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] }); e.pc = pc; e.prevT = 0;
        pc.onicecandidate = (ev) => ev.candidate && transport.rt.send("rtc", { to: m.from, from: transport.id, kind: "cand", data: ev.candidate.toJSON() });
        pc.onconnectionstatechange = () => { dbg("info", "anteprima", `WebRTC connessione ${m.from}: ${pc.connectionState}`); if (pc.connectionState === "connected") { clearInterval(e.statT); e.statT = setInterval(() => this.stats(m.from), 5000); setTimeout(() => this.stats(m.from), 2000); } };
        pc.oniceconnectionstatechange = () => dbg("info", "anteprima", `WebRTC ICE ${m.from}: ${pc.iceConnectionState}`); pc.onsignalingstatechange = () => dbg("info", "anteprima", `WebRTC signaling: ${pc.signalingState}`);
        pc.ontrack = (ev) => this.attach(m.from, ev.streams[0]);
        await pc.setRemoteDescription(m.data); for (const c of e.pending.splice(0)) await pc.addIceCandidate(c).catch(() => {});
        await pc.setLocalDescription(await pc.createAnswer()); transport.rt.send("rtc", { to: m.from, from: transport.id, kind: "answer", data: plainDesc(pc.localDescription) }); dbg("info", "anteprima", "risposta WebRTC inviata");
      } else if (m.kind === "cand") { if (e.pc && e.pc.remoteDescription) e.pc.addIceCandidate(m.data).catch((x) => dbg("warn", "anteprima", `candidato rifiutato: ${x.message}`)); else e.pending.push(m.data); }
    } catch (x) { dbg("error", "anteprima", `segnale ${m.kind}: ${x.name}: ${x.message}`); }
  },
};
const transport = REAL ? new RealtimeTransport(pairing) : new MockTransport();
const state = {};
const logs = []; // {t, id, msg}
function log(id, msg) { logs.unshift({ t: stamp(), id, msg }); if (logs.length > 200) logs.pop(); renderLogs(); dbg("info", "registro", msg); }
const logsText = (id) => [...logs].reverse().filter((l) => !id || l.id === id).map((l) => `${l.t} ${l.msg}`).join("\n");

function command(id, m) {
  const c = camById(id); if (!c) return; m = { ...m, rid: rid() }; dbg("info", "comando", `→ ${camTitle(c)} (${id})`, m);
  const say = { rec_start: "REC avviato", rec_stop: "REC fermato", connect: "connessa (simulazione)", disconnect: "disconnessa", charge: m.on ? "cavo di ricarica collegato (sim)" : "cavo di ricarica scollegato (sim)", standby: m.on ? "schermo nero attivato" : "schermo riattivato", config: "impostazioni inviate", tl_start: "time-lapse avviato", tl_stop: "time-lapse fermato: creo il video" }[m.cmd];
  if (say) log(id, `${camTitle(c)}: ${say}`);
  transport.send(id, m);
}
transport.onState((id, st) => { state[id] = st; refresh(); });
