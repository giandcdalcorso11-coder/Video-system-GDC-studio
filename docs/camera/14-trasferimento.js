"use strict";
/* ===== Trasferimento file verso la dashboard ===== */
let xferBusy = null;
const xferFail = (m, err) => { try { rt?.send("xdone", { id: ID, xid: m.xid, sid: m.sid || null, ok: false, error: err }); } catch { /* ok */ } throw new Error(err); };
function xferRun(m, { name, mime, size, source, sid, test }) {
  const handle = {}; xferBusy = { sid: sid || "prova", xid: m.xid, pct: 0, abort: () => handle.abort && handle.abort() }; publish();
  GDC_XFER.sendFile({ rt, from: ID, to: m.from, xid: m.xid, name, mime, size, source, handle, log: (l, t) => dbg(l, t),
    onProgress: (p) => { xferBusy.pct = size ? Math.min(100, Math.round(p.sent / size * 100)) : 0; } })
    .then(async (r) => {
      dbg("info", `trasferimento riuscito: ${name}`, { MB: +(r.bytes / 1048576).toFixed(1), Mbps: +r.mbps.toFixed(2), secondi: Math.round(r.ms / 1000) });
      rt.send("xdone", { id: ID, xid: m.xid, sid: sid || null, ok: true, bytes: r.bytes, mbps: r.mbps });
      if (!test) {
        const s = sessions.find((x) => x.id === sid);
        if (m.del) { await db.delSession(sid); dbg("info", `registrazione ${sid} eliminata dal telefono dopo la verifica`); await loadSessions(); }
        else if (s) { s.status = "inviata"; s.sentAt = Date.now(); await db.putSession(s); renderClips(); }
      }
    })
    .catch((e) => { lastErr = "Trasferimento: " + e.message; dbg("error", `trasferimento fallito: ${e.message}`); try { rt.send("xdone", { id: ID, xid: m.xid, sid: sid || null, ok: false, error: e.message }); } catch { /* ok */ } })
    .finally(() => { xferBusy = null; publish(); });
}
async function xferStart(m) {
  if (!rt || !m.xid || !m.from) throw new Error("richiesta di trasferimento incompleta");
  if (xferBusy && xferBusy.sid === m.sid) { dbg("info", "nuovo tentativo per la stessa registrazione: interrompo il precedente"); xferBusy.abort(); for (let i = 0; i < 80 && xferBusy; i++) await sleep(100); }
  if (xferBusy) xferFail(m, "un altro trasferimento è già in corso");
  const s = sessions.find((x) => x.id === m.sid); if (!s) xferFail(m, "registrazione non trovata sul telefono");
  if (recording && recording.sid === s.id) xferFail(m, "registrazione ancora in corso");
  const keys = await db.chunkKeys(s.id); if (!keys.length) xferFail(m, "nessun dato nella registrazione");
  const ext = /mp4/.test(s.mime || "") ? "mp4" : /webm/.test(s.mime || "") ? "webm" : "mp4";
  let i = 0, rest = null;
  const source = {
    next: async () => { if (rest) { const r = rest; rest = null; return r; } if (i >= keys.length) return null; const b = await db.getChunk(keys[i++]); return b ? await b.arrayBuffer() : null; },
    // ripresa: calcola il CRC32 dei primi `off` byte e si posiziona subito dopo
    skipTo: async (off) => { let crc = 0, left = off; i = 0; rest = null; while (left > 0) { if (i >= keys.length) throw new Error("ripresa oltre la fine del file"); const b = await db.getChunk(keys[i++]); const u8 = new Uint8Array(await b.arrayBuffer()); if (u8.length <= left) { crc = GDC_XFER.crc32(u8, crc); left -= u8.length; } else { crc = GDC_XFER.crc32(u8.subarray(0, left), crc); rest = u8.subarray(left); left = 0; } } return crc; },
  };
  dbg("info", `trasferimento di ${s.id} verso ${m.from}`, { pezzi: keys.length, MBstimati: Math.round((s.bytes || 0) / 1048576), eliminaDopo: !!m.del });
  xferRun(m, { name: clipFile(s, ext), mime: s.mime, size: s.bytes || 0, source, sid: s.id });
  return "trasferimento avviato";
}
async function xferTest(m) {
  if (!rt || !m.xid || !m.from) throw new Error("richiesta incompleta");
  if (xferBusy) xferFail(m, "un altro trasferimento è già in corso");
  const mb = Math.max(1, Math.min(200, Number(m.mb) || 30)), blk = new Uint8Array(1048576); for (let o = 0; o < blk.length; o += 65536) crypto.getRandomValues(blk.subarray(o, o + 65536));
  let n = 0; const tEnd = performance.now() + 8000, source = { next: async () => (n++ < mb && performance.now() < tEnd ? blk.slice().buffer : null) };
  dbg("info", `prova di velocità: fino a ${mb} MB o 8 secondi verso ${m.from}`);
  xferRun(m, { name: "prova-rete.bin", mime: "application/octet-stream", size: mb * 1048576, source, test: true });
  return "prova avviata";
}
