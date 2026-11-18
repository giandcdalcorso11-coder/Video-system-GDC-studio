/* Collegamento tra camera e dashboard.
   - Reale: canale segreto di Supabase Realtime (solo messaggi di servizio, mai video o file).
   - Simulazione locale: aggiungi ?mock=1 all'indirizzo (stesso browser, schede diverse).
   Il link di abbinamento ha la forma  pagina#gdc1.<codice>[~<id camera>]  (l'id fissa l'identità della camera). */
(function () {
  const b64u = {
    enc: (s) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""),
    dec: (s) => decodeURIComponent(escape(atob(s.replace(/-/g, "+").replace(/_/g, "/")))),
  };
  const KEY = "gdc.pair";
  const Pair = {
    // p = chiave pubblica della regia (nei link delle camere), d = chiave privata (solo nel link della dashboard)
    encode: (p, conChiavePrivata) => "gdc1." + b64u.enc(JSON.stringify({ u: p.u, k: p.k, c: p.c, ...(p.p ? { p: p.p } : {}), ...(conChiavePrivata && p.d ? { d: p.d } : {}) })),
    decode(str) {
      try {
        const m = String(str).trim().match(/gdc1\.([A-Za-z0-9_-]+)(?:~([A-Za-z0-9_-]{3,40}))?/); if (!m) return null;
        const p = JSON.parse(b64u.dec(m[1])); if (!(p && p.u && p.k && p.c)) return null;
        if (!/^[A-Za-z0-9_-]{86}$/.test(String(p.p || ""))) delete p.p; if (!/^[A-Za-z0-9_-]{43}$/.test(String(p.d || "")) || !p.p) delete p.d;
        if (m[2]) p.linkId = m[2]; return p;
      } catch { return null; }
    },
    load() { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } },
    save(p) { try { localStorage.setItem(KEY, JSON.stringify({ u: p.u, k: p.k, c: p.c, ...(p.p ? { p: p.p } : {}), ...(p.d ? { d: p.d } : {}) })); } catch { /* storage non disponibile */ } },
    clear() { try { localStorage.removeItem(KEY); } catch { /* ok */ } },
    fromHash() { const p = Pair.decode(location.hash.slice(1)); if (p) { Pair.save(p); history.replaceState(null, "", location.pathname + location.search); } return p; },
    link(page, p, id) { return new URL(page, location.href).href.split("#")[0].split("?")[0] + "#" + Pair.encode(p, /^dashboard/.test(page)) + (id ? "~" + id : ""); },
    newChannel() { const a = new Uint8Array(16); crypto.getRandomValues(a); return [...a].map((x) => x.toString(16).padStart(2, "0")).join(""); },
  };

  // ripulisce un messaggio ricevuto: niente caratteri di markup, testi e liste limitati, chiavi semplici
  const clean = (v, d = 0) => {
    if (v == null || typeof v === "boolean") return v; if (typeof v === "string") return v.replace(/[<>&"\u0000-\u001f]/g, "").slice(0, 400);
    if (typeof v === "number") return Number.isFinite(v) ? v : null; if (d > 5) return null;
    if (Array.isArray(v)) return v.slice(0, 40).map((x) => clean(x, d + 1));
    if (typeof v === "object") { const o = {}; let n = 0; for (const k of Object.keys(v)) { if (n++ >= 60) break; if (/^[A-Za-z0-9_]{1,40}$/.test(k)) o[k] = clean(v[k], d + 1); } return o; }
    return null;
  };
  function connect({ pairing, role, id, meta, mock, log }) {
    const L = (lv, m) => { try { log && log(lv, m); } catch { /* ok */ } };
    const handlers = {}, peerCbs = [], statusCbs = []; let peers = [], status = "connessione…", lastSig = "", prevKeys = new Set();
    const emit = (ev, payload) => (handlers[ev] || []).forEach((fn) => { try { fn(payload); } catch (e) { L("error", `gestore "${ev}": ${e.message}`); } });
    const size = (p) => { try { return JSON.stringify(p).length; } catch { return -1; } };
    const noisy = (ev) => ev === "dbg", cnt = { tx: 0, rx: 0 }; // i messaggi "state" si registrano 1 volta su 15
    const skipState = (ev, k) => ev === "state" && cnt[k]++ % 15 !== 0;
    // Chi conosce il link può scrivere sul canale: i messaggi che finiscono nelle pagine (stato, comandi, risposte) vengono ripuliti
    // (niente caratteri di markup, testi e liste limitati, chiavi semplici); i messaggi di collegamento diretto (rtc, xrtc) e i log non si toccano.
    const SAFE_EV = new Set(["state", "ack", "cmd", "xdone", "battery", "hello"]);
    const onRx = (ev, payload) => {
      if (!noisy(ev) && !skipState(ev, "rx")) L("trace", `rx ${ev} ${size(payload)}B`);
      if (SAFE_EV.has(ev)) { if (size(payload) > 40000) { L("warn", `messaggio ${ev} troppo grande (${size(payload)}B): ignorato`); return; } payload = clean(payload); }
      emit(ev, payload);
    };
    const setStatus = (s) => { if (s !== status) L("info", `stato collegamento: ${s}`); status = s; statusCbs.forEach((f) => f(s)); };
    const setPeers = (list) => {
      const sig = JSON.stringify(list); if (sig === lastSig) return; lastSig = sig; peers = list;
      const keys = new Set(list.map((p) => p.id)); keys.forEach((k) => { if (!prevKeys.has(k)) L("info", `presenza: entra ${k} ${JSON.stringify(list.find((p) => p.id === k))}`); }); prevKeys.forEach((k) => { if (!keys.has(k)) L("info", `presenza: esce ${k}`); }); prevKeys = keys;
      L("info", `presenti: ${list.length} (${list.map((p) => p.role + ":" + p.id).join(", ")})`); peerCbs.forEach((f) => f(peers));
    };
    const rt = {
      id, role, send() {}, setMeta() {}, close() {},
      on(ev, fn) { (handlers[ev] = handlers[ev] || []).push(fn); },
      onPeers(fn) { peerCbs.push(fn); fn(peers); },
      onStatus(fn) { statusCbs.push(fn); fn(status); },
      get peers() { return peers; }, get status() { return status; }, get mock() { return !!mock; },
    };
    L("info", `connessione ${mock ? "simulata" : "Supabase"} come ${role} id=${id} canale=…${String(pairing.c).slice(-4)} host=${mock ? "-" : String(pairing.u).replace(/^https?:\/\//, "")}`);
    if (mock) {
      const bc = new BroadcastChannel("gdc-mock-" + pairing.c), seen = new Map();
      const hello = () => bc.postMessage({ t: "hello", id, meta: { role, id, ...meta } });
      bc.onmessage = (e) => { const d = e.data; if (d.t === "ev") onRx(d.event, d.payload); else if (d.t === "hello") seen.set(d.id, { at: Date.now(), meta: d.meta }); };
      setInterval(() => { hello(); const now = Date.now(); for (const [k, v] of seen) if (now - v.at > 4000) seen.delete(k); setPeers([...seen.values()].map((v) => v.meta)); }, 1000);
      hello(); setStatus("connesso (simulazione locale)");
      rt.send = (event, payload) => { if (!noisy(event) && !skipState(event, "tx")) L("trace", `tx ${event} ${size(payload)}B`); bc.postMessage({ t: "ev", event, payload }); };
      rt.setMeta = (m) => { meta = { ...meta, ...m }; hello(); };
      return rt;
    }
    if (!window.supabase) { setStatus("errore: libreria Supabase non caricata"); return rt; }
    const sb = window.supabase.createClient(pairing.u, pairing.k, { realtime: { params: { eventsPerSecond: 20 } } });
    const ch = sb.channel("gdc-" + pairing.c, { config: { broadcast: { self: false }, presence: { key: id } } });
    ch.on("broadcast", { event: "*" }, (m) => onRx(m.event, m.payload));
    ch.on("presence", { event: "sync" }, () => { const st = ch.presenceState(); setPeers(Object.values(st).map((v) => v[0])); });
    ch.subscribe(async (s, err) => {
      L("info", `subscribe: ${s}${err ? " " + (err.message || err) : ""}`);
      if (s === "SUBSCRIBED") { setStatus("connesso"); try { await ch.track({ role, id, ...meta }); L("info", "presenza registrata"); } catch (e) { L("warn", `presenza non registrata: ${e.message}`); } }
      else if (s === "CHANNEL_ERROR" || s === "TIMED_OUT") setStatus("errore: " + s);
      else if (s === "CLOSED") setStatus("chiuso");
    });
    rt.send = (event, payload) => { if (!noisy(event) && !skipState(event, "tx")) L("trace", `tx ${event} ${size(payload)}B`); return ch.send({ type: "broadcast", event, payload }).then((r) => { if (r && r !== "ok") L("warn", `invio ${event}: ${r}`); return r; }).catch((e) => L("error", `invio ${event} fallito: ${e.message}`)); };
    rt.setMeta = (m) => { meta = { ...meta, ...m }; ch.track({ role, id, ...meta }).catch(() => {}); };
    rt.close = () => sb.removeChannel(ch);
    return rt;
  }
  window.GDC_RT = { Pair, connect, clean };
})();
