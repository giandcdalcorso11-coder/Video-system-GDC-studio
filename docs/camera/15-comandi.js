"use strict";
/* ===== Comandi dalla dashboard ===== */
// Con un link di camera che contiene la chiave pubblica della regia, si eseguono solo comandi firmati, non ripetuti e recenti
const cmdSeen = store.get("gdc.cmdSeen", {}); let denyAt = 0;
async function cmdGate(m) {
  if (!m || (m.to !== ID && m.to !== "*")) return;
  if (pairing && pairing.p) {
    const rest = { ...m }; delete rest.sig; let why = "";
    if (typeof m.sig !== "string" || !m.sid || typeof m.n !== "number" || typeof m.ts !== "number") why = "senza firma";
    else if (!(await GDC_AUTH.verify(pairing.p, rest, m.sig))) why = "firma non valida";
    else if (Math.abs(Date.now() - m.ts) > 600000) why = "troppo vecchio (o orologio del telefono sfasato di oltre 10 minuti)";
    else { const seen = cmdSeen[m.sid] || (cmdSeen[m.sid] = []); if (seen.includes(m.n) || (seen.length >= 64 && m.n < Math.min(...seen))) why = "già ricevuto"; else { seen.push(m.n); if (seen.length > 64) seen.shift(); const ks = Object.keys(cmdSeen); while (ks.length > 20) delete cmdSeen[ks.shift()]; store.set("gdc.cmdSeen", cmdSeen); } }
    if (why) {
      dbg("warn", `comando ${String(m.cmd).slice(0, 30)} rifiutato: ${why}`);
      if (Date.now() - denyAt > 10000) { denyAt = Date.now(); try { rt.send("ack", { id: ID, cmd: String(m.cmd).slice(0, 30), rid: m.rid || null, ok: false, detail: "non autorizzato: " + why, ts: Date.now() }); } catch { /* ok */ } }
      return;
    }
  }
  return onCmd(m);
}
async function onCmd(m) {
  if (m.to !== ID && m.to !== "*") return;
  dbg("info", `comando ricevuto: ${m.cmd}`, m);
  let ok = true, detail = null;
  try {
    switch (m.cmd) {
      case "join_result": if (m.label && m.label !== label) { label = String(m.label).slice(0, 30); store.set("gdc.label", label); dbg("info", `la regia ha assegnato il nome: ${label}`); renderClips(); } joinState = m.ok ? "ok" : "no"; dbg(m.ok ? "info" : "warn", m.ok ? "la regia ha accettato questa camera" : "la regia NON ha accettato questa camera: invio dello stato sospeso"); if (m.ok) publish(); else renderStat(); detail = { join: joinState }; break;
      case "ping": detail = { t0: m.t0 }; break;
      case "clock": clockOff = Number(m.off) || 0; store.set("gdc.clockOff", clockOff); dbg("info", `orologio: questo telefono è ${clockOff > 0 ? "avanti" : "indietro"} di ${Math.abs(clockOff)} ms rispetto alla regia (precisione ±${Math.round((Number(m.rtt) || 0) / 2)} ms): i nomi dei file lo correggono`); renderClips(); publish(); detail = { off: clockOff }; break;
      case "rec_start": await startRec(); ok = !!recording; detail = ok ? "registrazione avviata" : lastErr || "non avviata"; break;
      case "rec_stop": setWant(false); stopRec(true); detail = "stop richiesto"; break;
      case "standby": setStandby(!!m.on); detail = { standby }; break;
      case "config": if (!recording) { if (m.res && RES[m.res]) cfg.res = m.res; if (m.bps) cfg.bps = Number(m.bps); store.set("gdc.camCfg", cfg); syncForm(); if (stream) { try { await openCam(); } catch { ok = false; } } publish(); detail = { res: cfg.res, bps: cfg.bps }; } else { lastErr = "Impostazioni non applicate: registrazione in corso"; ok = false; detail = lastErr; publish(); } break;
      case "rename": if (m.name) cfg.name = m.name; if (m.device) cfg.device = m.device; store.set("gdc.camCfg", cfg); syncForm(); rt?.setMeta({ name: cfg.name, device: cfg.device }); publish(); detail = { name: cfg.name, device: cfg.device }; break;
      case "tl_start": ok = await tlStart(m); detail = ok ? "time-lapse avviato" : lastErr || "non avviato"; break;
      case "tl_stop": tlStop(); detail = "stop richiesto"; break;
      case "preview_start": await startPreview(m.from, m.q); detail = "offerta inviata"; break;
      case "preview_stop": try { clearInterval(pcs[m.from]?.statT); pcs[m.from]?.pc.close(); } catch { /* ok */ } delete pcs[m.from]; detail = "chiusa"; break;
      case "zoom": detail = await setZoom(m.z); break;
      case "pro": detail = await applyPro(m.set, !!m.reset); ok = !Object.values(detail).some((x) => x !== "ok") || !!m.reset; break;
      case "station_cfg": cfg.station = !!m.on; store.set("gdc.camCfg", cfg); dbg("info", `postazione fissa ${cfg.station ? "attivata" : "spenta"}`); publish(); detail = { station: cfg.station }; break;
      case "space_cfg": cfg.autoFree = !!m.autoFree; store.set("gdc.camCfg", cfg); dbg("info", `spazio: liberazione automatica delle clip verificate ${cfg.autoFree ? "attivata" : "spenta"}`); spaceTick(); publish(); detail = { autoFree: cfg.autoFree }; break;
      case "xfer_start": detail = await xferStart(m); break;
      case "xfer_test": detail = await xferTest(m); break;
      case "battery": ok = setBat(m.level, m.charging, "dashboard"); detail = ok ? bat : "valore non valido"; break;
      default: ok = false; detail = "comando sconosciuto"; break;
    }
  } catch (e) { ok = false; detail = `${e.name}: ${e.message}`; dbg("error", `comando ${m.cmd} fallito: ${detail}`); }
  rt?.send("ack", { id: ID, cmd: m.cmd, rid: m.rid || null, ok, detail, ts: Date.now() });
}
