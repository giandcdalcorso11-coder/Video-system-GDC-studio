/* Trasferimento file camera → dashboard, in diretta (WebRTC data channel), a blocchi, con controllo di integrità (dimensione + CRC32).
   La segnalazione passa dal canale Supabase (evento "xrtc"); i dati del file non passano mai da Supabase.
   Se la connessione cade, la dashboard può riprendere da dove era arrivata: ricevente e mittente si accordano sul punto di ripresa
   e confrontano il CRC32 di quanto già ricevuto prima di continuare.
   Camera: GDC_XFER.sendFile({...}). Dashboard: GDC_XFER.receiveFile({...}) con una destinazione (cartella del PC o memoria). */
(function () {
  const ICE = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };
  const PIECE = 60000, HIGH = 1048576, LOW = 262144; // coda piccola: i byte "inviati" sono quasi quelli arrivati, anche su reti lente
  const T = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = (u8, prev) => { let c = (prev ^ 0xFFFFFFFF) >>> 0; for (let i = 0; i < u8.length; i++) c = T[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  const plain = (d) => ({ type: d.type, sdp: d.sdp });
  const handlers = new Map(), early = new Map(); // early: segnali arrivati prima che il gestore esista
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function signal(m) {
    if (!m || !m.xid) return;
    const h = handlers.get(m.xid);
    if (h) h(m); else { const q = early.get(m.xid) || []; q.push(m); early.set(m.xid, q); if (early.size > 20) early.delete(early.keys().next().value); }
  }
  function register(xid, fn) { handlers.set(xid, fn); const q = early.get(xid); if (q) { early.delete(xid); q.forEach(fn); } }

  async function pathInfo(pc) {
    try {
      const st = await pc.getStats(), byId = {}; st.forEach((s) => (byId[s.id] = s));
      let pair = null; st.forEach((s) => { if (s.type === "transport" && s.selectedCandidatePairId) pair = byId[s.selectedCandidatePairId]; });
      if (!pair) st.forEach((s) => { if (s.type === "candidate-pair" && (s.selected || (s.nominated && s.state === "succeeded"))) pair = s; });
      if (!pair) return "percorso non rilevabile";
      const l = byId[pair.localCandidateId] || {}, r = byId[pair.remoteCandidateId] || {};
      return `${l.candidateType || "?"}/${r.candidateType || "?"} ${l.protocol || ""}${l.candidateType === "relay" || r.candidateType === "relay" ? " (passa da un relay)" : l.candidateType === "host" && r.candidateType === "host" ? " (rete locale diretta)" : ""}`.trim();
    } catch (e) { return "percorso non rilevabile: " + e.message; }
  }

  /* ---------- Camera: invia un file ----------
     source: { next(): Promise<ArrayBuffer|Uint8Array|null>, skipTo?(offset): Promise<crc32 dei primi `offset` byte> }
     handle (facoltativo): oggetto in cui viene messo abort() per interrompere l'invio dall'esterno. */
  async function sendFile(o) {
    const { rt, from, to, xid, name, mime, size, source, log = () => {}, onProgress = () => {}, handle = {} } = o;
    const pc = new RTCPeerConnection(ICE), pend = [], outq = []; let dc = null, offerSent = false, lastAct = Date.now(), fin = null, watch = 0, goRes = null, dead = null, wake = null;
    const done = new Promise((res, rej) => { fin = { res, rej }; });
    { const r = fin.rej; fin.rej = (e) => { if (!dead) dead = e; r(e); if (wake) wake(); }; } // ogni interruzione sveglia e ferma il ciclo di invio
    const goP = new Promise((res) => (goRes = res));
    const L = (l, m) => log(l, `xfer ${xid}: ${m}`);
    handle.abort = () => fin.rej(new Error("sostituito o interrotto"));
    const cleanup = () => { clearInterval(watch); handlers.delete(xid); early.delete(xid); try { dc && dc.close(); } catch { /* ok */ } try { pc.close(); } catch { /* ok */ } };
    register(xid, async (m) => {
      try {
        if (m.to !== from) return; lastAct = Date.now();
        if (m.kind === "answer") { await pc.setRemoteDescription(m.data); for (const c of pend.splice(0)) await pc.addIceCandidate(c).catch(() => {}); }
        else if (m.kind === "cand") { if (pc.remoteDescription) pc.addIceCandidate(m.data).catch((x) => L("warn", `candidato rifiutato: ${x.message}`)); else pend.push(m.data); }
        else if (m.kind === "cancel") fin.rej(new Error("annullato dalla dashboard"));
      } catch (e) { fin.rej(e); }
    });
    pc.onicecandidate = (e) => { if (!e.candidate) return; const msg = { to, from, xid, kind: "cand", data: e.candidate.toJSON() }; if (offerSent) rt.send("xrtc", msg); else outq.push(msg); };
    pc.onconnectionstatechange = () => { L("info", `connessione ${pc.connectionState}`); if (pc.connectionState === "failed" || pc.connectionState === "closed") fin.rej(new Error("connessione " + pc.connectionState)); };
    dc = pc.createDataChannel("file", { ordered: true }); dc.binaryType = "arraybuffer";
    dc.onmessage = (e) => {
      lastAct = Date.now();
      try { const m = JSON.parse(e.data); if (m.t === "go") goRes(m); else if (m.t === "ok") fin.res(m); else if (m.t === "err") fin.rej(new Error("la dashboard ha rifiutato il file: " + m.reason)); } catch { /* ok */ }
    };
    dc.onclose = () => fin.rej(new Error("canale chiuso"));
    const waitLow = () => new Promise((r) => { const t = setTimeout(r, 4000); wake = () => { clearTimeout(t); r(); }; dc.bufferedAmountLowThreshold = LOW; dc.onbufferedamountlow = () => { clearTimeout(t); r(); }; });
    const t0 = performance.now(), start = new Promise((res) => (dc.onopen = res));
    watch = setInterval(() => { if (Date.now() - lastAct > 25000) fin.rej(new Error("nessuna risposta per 25 secondi (rete?)")); }, 2000);
    try {
      await pc.setLocalDescription(await pc.createOffer());
      rt.send("xrtc", { to, from, xid, kind: "offer", data: plain(pc.localDescription), name, size }); offerSent = true; outq.splice(0).forEach((m) => rt.send("xrtc", m)); L("info", "offerta inviata");
      await Promise.race([start, done]); L("info", `canale aperto dopo ${Math.round(performance.now() - t0)} ms`);
      pathInfo(pc).then((p) => L("info", `percorso: ${p}`));
      dc.send(JSON.stringify({ t: "hdr", name, size, mime })); lastAct = Date.now();
      const go = await Promise.race([goP, done]); // il ricevente dice da quale byte ripartire
      let sent = 0, crc = 0;
      if (go.offset > 0) {
        if (!source.skipTo) throw new Error("ripresa non supportata da questa sorgente");
        const c = await source.skipTo(go.offset);
        if (c !== (go.crc >>> 0)) { dc.send(JSON.stringify({ t: "err", reason: "controllo di ripresa non coincide (CRC)" })); throw new Error("ripresa non possibile: il controllo CRC non coincide"); }
        sent = go.offset; crc = c; L("info", `ripresa dal byte ${sent} (controllo CRC ok)`);
      }
      const from0 = sent; let lastP = 0, lastLog = 0; const t1 = performance.now();
      for (;;) {
        if (dead) throw dead;
        const ab = await source.next(); if (!ab) break; const u8 = ab instanceof Uint8Array ? ab : new Uint8Array(ab);
        for (let off = 0; off < u8.length; off += PIECE) {
          const piece = u8.subarray(off, Math.min(u8.length, off + PIECE)); crc = crc32(piece, crc);
          if (dc.bufferedAmount > HIGH) await waitLow();
          if (dead) throw dead;
          if (dc.readyState !== "open") throw new Error("canale chiuso durante l'invio");
          dc.send(piece); sent += piece.length;
        }
        lastAct = Date.now(); const now = performance.now(), arrived = sent - dc.bufferedAmount;
        if (now - lastP > 250) { lastP = now; onProgress({ sent: arrived, size, speed: (arrived - from0) / ((now - t1) / 1000) }); }
        if (now - lastLog > 5000) { lastLog = now; L("info", `avanzamento: ${(arrived / 1048576).toFixed(1)} MB consegnati in ${Math.round((now - t1) / 1000)} s (${((arrived - from0) * 8 / (now - t1) / 1000).toFixed(2)} Mbps), in coda ${Math.round(dc.bufferedAmount / 1024)} KB`); }
        await sleep(0);
      }
      while (dc.bufferedAmount > 0 && dc.readyState === "open") { await waitLow(); if (dead) throw dead; lastAct = Date.now(); }
      dc.send(JSON.stringify({ t: "end", size: sent, crc })); L("info", `dati inviati: ${sent} byte, CRC32 ${crc.toString(16)}`); onProgress({ sent, size, speed: (sent - from0) / ((performance.now() - t1) / 1000) });
      const reply = await done, ms = performance.now() - t1;
      L("info", `verificato dalla dashboard: ${reply.size} byte in ${Math.round(ms)} ms (${((sent - from0) * 8 / ms / 1000).toFixed(2)} Mbps)`);
      return { ok: true, bytes: sent, crc, ms, mbps: (sent - from0) * 8 / ms / 1000 };
    } finally { cleanup(); }
  }

  /* ---------- Destinazioni (dashboard) ---------- */
  // il nome del file arriva dalla camera: si tolgono i caratteri che nessun sistema accetta e i punti iniziali
  const safeName = (n) => String(n || "file").replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_").replace(/^\.+/, "_").slice(0, 150) || "file";
  function memorySink() {
    return async ({ name: n0, mime }) => {
      const name = safeName(n0), parts = []; let cur = [], cl = 0;
      return { name,
        async write(ab) { cur.push(ab); cl += ab.byteLength; if (cl >= 8 * 1048576) { parts.push(new Blob(cur)); cur = []; cl = 0; } },
        async finish() { if (cur.length) parts.push(new Blob(cur)); return { where: "memoria", name, blob: new Blob(parts, { type: mime || "video/mp4" }) }; },
        async abort() { parts.length = 0; cur = []; } };
    };
  }
  function nullSink() { return async ({ name }) => ({ name, async write() {}, async finish() { return { where: "nessuna", name }; }, async abort() {} }); }
  function folderSink(dir) {
    return async ({ name: n0 }) => {
      const name = safeName(n0); let fname = name, n = 1;
      for (;;) { try { await dir.getFileHandle(fname); n++; fname = name.replace(/(\.[^.]*)?$/, `_${n}$1`); } catch (e) { if (e.name === "NotFoundError") break; throw e; } }
      const fh = await dir.getFileHandle(fname, { create: true }), w = await fh.createWritable(); let buf = [], bl = 0;
      const flush = async () => { if (!bl) return; const b = new Blob(buf); buf = []; bl = 0; await w.write(b); };
      return { name: fname,
        async write(ab) { buf.push(ab); bl += ab.byteLength; if (bl >= 2 * 1048576) await flush(); },
        async finish() { await flush(); await w.close(); return { where: "cartella", name: fname }; },
        async abort() { try { await w.abort(); } catch { /* ok */ } try { await dir.removeEntry(fname); } catch { /* ok */ } } };
    };
  }

  /* ---------- Dashboard: riceve un file ----------
     o.state: oggetto che resta tra un tentativo e l'altro ({ sink, got, crc }): permette la ripresa dopo un'interruzione.
     La destinazione parziale viene annullata solo se o.cancelled, se il controllo finale fallisce (errore fatale) o a richiesta del chiamante. */
  function receiveFile(o) {
    const { rt, from, to, xid, makeSink: mk0, log = () => {}, onProgress = () => {}, onInfo = () => {} } = o, st = (o.state = o.state || { sink: null, got: 0, crc: 0 });
    const pc = new RTCPeerConnection(ICE), pend = []; let hdr = null, t1 = 0, from0 = st.got, lastP = 0, lastLog = 0, chain = Promise.resolve(), lastAct = Date.now(), watch = 0, settled = false, dcRef = null;
    const L = (l, m) => log(l, `xfer ${xid}: ${m}`);
    const sk = (p) => Promise.resolve(p).catch((e) => { if (e && typeof e === "object") e.sink = true; throw e; }); // errori della destinazione (cartella/disco), distinti da quelli di rete
    const makeSink = (a) => sk(mk0(a));
    let fin; const done = new Promise((res, rej) => { fin = { res, rej }; });
    const cleanup = () => { clearInterval(watch); handlers.delete(xid); early.delete(xid); try { dcRef && dcRef.close(); } catch { /* ok */ } try { pc.close(); } catch { /* ok */ } };
    const fail = async (e) => { if (settled) return; settled = true; if (o.cancelled || e.fatal) { try { st.sink && await st.sink.abort(); } catch { /* ok */ } st.sink = null; st.got = 0; st.crc = 0; } fin.rej(e); };
    o.cancel = () => { o.cancelled = true; try { rt.send("xrtc", { to, from, xid, kind: "cancel" }); } catch { /* ok */ } return fail(new Error("annullato")); };
    o.stop = (msg) => fail(new Error(msg)); // interrompe il tentativo ma conserva quanto già ricevuto (per riprendere)
    o.drop = () => { try { pc.close(); } catch { /* ok */ } }; // solo per le prove: simula una caduta della connessione
    register(xid, async (m) => {
      try {
        if (m.to !== from) return; lastAct = Date.now();
        if (m.kind === "offer") { onInfo({ name: m.name, size: m.size }); await pc.setRemoteDescription(m.data); for (const c of pend.splice(0)) await pc.addIceCandidate(c).catch(() => {}); await pc.setLocalDescription(await pc.createAnswer()); rt.send("xrtc", { to, from, xid, kind: "answer", data: plain(pc.localDescription) }); L("info", "risposta inviata"); }
        else if (m.kind === "cand") { if (pc.remoteDescription) pc.addIceCandidate(m.data).catch((x) => L("warn", `candidato rifiutato: ${x.message}`)); else pend.push(m.data); }
      } catch (e) { fail(e); }
    });
    pc.onicecandidate = (e) => { if (e.candidate) rt.send("xrtc", { to, from, xid, kind: "cand", data: e.candidate.toJSON() }); };
    pc.onconnectionstatechange = () => { L("info", `connessione ${pc.connectionState}`); if (pc.connectionState === "failed" || pc.connectionState === "closed") fail(new Error("connessione " + (pc.connectionState === "failed" ? "fallita (rete?)" : "chiusa"))); if (pc.connectionState === "connected") pathInfo(pc).then((p) => { L("info", `percorso: ${p}`); onInfo({ path: p }); }); };
    pc.ondatachannel = (ev) => {
      const dc = (dcRef = ev.channel); dc.binaryType = "arraybuffer"; L("info", "canale dati aperto");
      dc.onclose = () => { if (!settled) fail(new Error("canale chiuso prima della fine")); };
      dc.onmessage = (e) => {
        lastAct = Date.now();
        chain = chain.then(async () => {
          if (settled) return;
          if (typeof e.data === "string") {
            const m = JSON.parse(e.data);
            if (m.t === "hdr") {
              hdr = m; if (!st.sink) st.sink = await makeSink({ name: m.name, size: m.size, mime: m.mime });
              t1 = performance.now(); from0 = st.got; dc.send(JSON.stringify({ t: "go", offset: st.got, crc: st.crc }));
              L("info", st.got ? `riprendo ${m.name} dal byte ${st.got}` : `ricevo ${m.name} (${m.size} byte stimati)`); onInfo({ name: st.sink.name, size: m.size });
            } else if (m.t === "end") {
              if (!hdr || st.got !== m.size || st.crc !== m.crc) { const why = `dimensione o CRC non coincidono (ricevuti ${st.got}/${m.size} byte, CRC ${st.crc.toString(16)}/${(m.crc >>> 0).toString(16)})`; dc.send(JSON.stringify({ t: "err", reason: why })); const x = new Error(why); x.fatal = true; throw x; }
              const res = await sk(st.sink.finish()); st.sink = null; settled = true; dc.send(JSON.stringify({ t: "ok", size: st.got, crc: st.crc })); const ms = performance.now() - t1, bytes = st.got;
              L("info", `file completo e verificato: ${bytes} byte (${((bytes - from0) * 8 / ms / 1000).toFixed(2)} Mbps in questo tentativo)`);
              fin.res({ ...res, bytes, crc: st.crc, ms, mbps: (bytes - from0) * 8 / ms / 1000 });
            } else if (m.t === "err") { const x = new Error("la camera ha rifiutato la ripresa: " + m.reason); x.fatal = true; throw x; }
          } else {
            const u8 = new Uint8Array(e.data); st.crc = crc32(u8, st.crc); st.got += u8.length; await sk(st.sink.write(e.data));
            const now = performance.now(); if (now - lastP > 250) { lastP = now; onProgress({ got: st.got, size: hdr.size, speed: (st.got - from0) / ((now - t1) / 1000) }); }
            if (now - lastLog > 5000) { lastLog = now; L("info", `avanzamento: ${(st.got / 1048576).toFixed(1)} MB ricevuti, ${Math.round((now - t1) / 1000)} s (${((st.got - from0) * 8 / (now - t1) / 1000).toFixed(2)} Mbps)`); }
          }
        }).catch((x) => fail(x));
      };
    };
    watch = setInterval(() => { if (Date.now() - lastAct > 30000) fail(new Error("nessun dato per 30 secondi (rete?)")); }, 2000);
    return done.finally(cleanup);
  }

  window.GDC_XFER = { signal, sendFile, receiveFile, memorySink, folderSink, nullSink, crc32 };
})();
