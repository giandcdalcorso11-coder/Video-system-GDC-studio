/* Collegamento tra camera e dashboard.
   - Reale: canale segreto di Supabase Realtime (solo messaggi di servizio, mai video o file).
   - Simulazione locale: aggiungi ?mock=1 all'indirizzo (stesso browser, schede diverse). */
(function () {
  const b64u = {
    enc: (s) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""),
    dec: (s) => decodeURIComponent(escape(atob(s.replace(/-/g, "+").replace(/_/g, "/")))),
  };
  const KEY = "gdc.pair";
  const Pair = {
    encode: (p) => "gdc1." + b64u.enc(JSON.stringify(p)),
    decode(str) {
      try { const m = String(str).trim().match(/gdc1\.([A-Za-z0-9_-]+)/); if (!m) return null; const p = JSON.parse(b64u.dec(m[1])); return p && p.u && p.k && p.c ? p : null; } catch { return null; }
    },
    load() { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } },
    save(p) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* storage non disponibile */ } },
    clear() { try { localStorage.removeItem(KEY); } catch { /* ok */ } },
    fromHash() { const p = Pair.decode(location.hash.slice(1)); if (p) { Pair.save(p); history.replaceState(null, "", location.pathname + location.search); } return p; },
    link(page, p) { return new URL(page, location.href).href.split("#")[0].split("?")[0] + "#" + Pair.encode(p); },
    newChannel() { const a = new Uint8Array(16); crypto.getRandomValues(a); return [...a].map((x) => x.toString(16).padStart(2, "0")).join(""); },
  };

  function connect({ pairing, role, id, meta, mock }) {
    const handlers = {}, peerCbs = [], statusCbs = []; let peers = [], status = "connessione…", lastSig = "";
    const emit = (ev, payload) => (handlers[ev] || []).forEach((fn) => { try { fn(payload); } catch (e) { console.error(e); } });
    const setStatus = (s) => { status = s; statusCbs.forEach((f) => f(s)); };
    const setPeers = (list) => { const sig = JSON.stringify(list); if (sig === lastSig) return; lastSig = sig; peers = list; peerCbs.forEach((f) => f(peers)); };
    const rt = {
      id, role, send() {}, setMeta() {}, close() {},
      on(ev, fn) { (handlers[ev] = handlers[ev] || []).push(fn); },
      onPeers(fn) { peerCbs.push(fn); fn(peers); },
      onStatus(fn) { statusCbs.push(fn); fn(status); },
      get peers() { return peers; }, get status() { return status; }, get mock() { return !!mock; },
    };
    if (mock) {
      const bc = new BroadcastChannel("gdc-mock-" + pairing.c), seen = new Map();
      const hello = () => bc.postMessage({ t: "hello", id, meta: { role, id, ...meta } });
      bc.onmessage = (e) => { const d = e.data; if (d.t === "ev") emit(d.event, d.payload); else if (d.t === "hello") seen.set(d.id, { at: Date.now(), meta: d.meta }); };
      setInterval(() => { hello(); const now = Date.now(); for (const [k, v] of seen) if (now - v.at > 4000) seen.delete(k); setPeers([...seen.values()].map((v) => v.meta)); }, 1000);
      hello(); setStatus("connesso (simulazione locale)");
      rt.send = (event, payload) => bc.postMessage({ t: "ev", event, payload });
      rt.setMeta = (m) => { meta = { ...meta, ...m }; hello(); };
      return rt;
    }
    if (!window.supabase) { setStatus("errore: libreria Supabase non caricata"); return rt; }
    const sb = window.supabase.createClient(pairing.u, pairing.k, { realtime: { params: { eventsPerSecond: 20 } } });
    const ch = sb.channel("gdc-" + pairing.c, { config: { broadcast: { self: false }, presence: { key: id } } });
    ch.on("broadcast", { event: "*" }, (m) => emit(m.event, m.payload));
    ch.on("presence", { event: "sync" }, () => { const st = ch.presenceState(); setPeers(Object.values(st).map((v) => v[0])); });
    ch.subscribe(async (s) => {
      if (s === "SUBSCRIBED") { setStatus("connesso"); try { await ch.track({ role, id, ...meta }); } catch { /* presenza non disponibile */ } }
      else if (s === "CHANNEL_ERROR" || s === "TIMED_OUT") setStatus("errore: " + s);
      else if (s === "CLOSED") setStatus("chiuso");
    });
    rt.send = (event, payload) => ch.send({ type: "broadcast", event, payload });
    rt.setMeta = (m) => { meta = { ...meta, ...m }; ch.track({ role, id, ...meta }).catch(() => {}); };
    rt.close = () => sb.removeChannel(ch);
    return rt;
  }
  window.GDC_RT = { Pair, connect };
})();
