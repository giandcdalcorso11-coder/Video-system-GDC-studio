/* Modalità Base / Avanzata + invio facoltativo dei log a Supabase (tabella gdc_dev_logs, sola scrittura).
   Base: solo i comandi utili a tutti. Avanzata: impostazioni complete, test e registri (la usiamo noi per lo sviluppo).
   L'invio dei log parte solo se è attiva la modalità Avanzata E l'interruttore "Invia i log a Claude". */
(function () {
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage non disponibile */ } },
  };
  const hide = (s) => String(s)
    .replace(/gdc1\.[A-Za-z0-9_~-]{10,}/g, "gdc1.…")
    .replace(/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, "jwt…")
    .replace(/sb_(publishable|secret)_[A-Za-z0-9_-]+/g, "chiave…");
  const pad = (n) => String(n).padStart(2, "0");
  const d0 = new Date();
  const SESS = `${String(d0.getFullYear()).slice(2)}${pad(d0.getMonth() + 1)}${pad(d0.getDate())}-${pad(d0.getHours())}${pad(d0.getMinutes())}-${Math.random().toString(36).slice(2, 6)}`;

  let cfg = null, mode = store.get("gdc.mode", "base") === "adv" ? "adv" : "base", sending = store.get("gdc.devsend", false) === true;
  const queue = []; let timer = 0, sent = 0, failed = 0, lastErr = "", backoff = 0, busy = false, started = false;
  const QMAX = 3000;

  function css() {
    if (document.getElementById("gdcDevCss")) return;
    const s = document.createElement("style"); s.id = "gdcDevCss";
    s.textContent = `body:not(.adv) .adv-only{display:none !important}
#gdcMode{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin:6px 0}
#gdcMode .seg{display:inline-flex;gap:3px;background:var(--panel-2,#222);padding:3px;border-radius:10px;border:1px solid var(--line,#444)}
#gdcMode .seg button{border:0;background:transparent;min-height:32px;padding:5px 12px;border-radius:8px;color:var(--muted,#999);font-weight:600;margin:0;font:inherit}
#gdcMode .seg button[aria-pressed="true"]{background:var(--panel,#111);color:var(--text,#eee);box-shadow:0 1px 2px rgba(0,0,0,.2)}
#gdcMode label{display:none;align-items:center;gap:6px;margin:0;font-size:12px;color:var(--muted,#999)}
body.adv #gdcMode label{display:inline-flex}
#gdcMode input{width:auto;min-height:0;margin:0}
#gdcMode .st{font-size:12px;color:var(--muted,#999)}`;
    document.head.appendChild(s);
  }

  function apply() {
    document.body.classList.toggle("adv", mode === "adv");
    document.querySelectorAll("#gdcMode [data-mode]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === mode)));
    const cb = document.getElementById("gdcSend"); if (cb) cb.checked = sending;
    status();
  }
  function status() {
    const el = document.getElementById("gdcSendSt"); if (!el) return;
    if (mode !== "adv") { el.textContent = ""; return; }
    if (!cfg || !cfg.url) { el.textContent = sending ? "invio non disponibile (nessun abbinamento)" : ""; return; }
    el.textContent = sending ? `log inviati: ${sent}${queue.length ? " · in coda " + queue.length : ""}${failed ? " · errori " + failed : ""}${lastErr ? " (" + lastErr + ")" : ""}` : "";
  }

  function mount(host) {
    css();
    const box = document.createElement("div"); box.id = "gdcMode";
    box.innerHTML = `<span class="seg" role="group" aria-label="Modalità"><button data-mode="base" aria-pressed="false">Base</button><button data-mode="adv" aria-pressed="false">Avanzata</button></span>
<label><input type="checkbox" id="gdcSend"> Invia i log a Claude</label><span class="st" id="gdcSendSt"></span>`;
    host.appendChild(box);
    box.addEventListener("click", (e) => { const b = e.target.closest("[data-mode]"); if (b) setMode(b.dataset.mode); });
    box.querySelector("#gdcSend").addEventListener("change", (e) => setSending(e.target.checked));
    apply();
  }

  function setMode(m) {
    mode = m === "adv" ? "adv" : "base"; store.set("gdc.mode", mode); apply();
    if (cfg && cfg.log) cfg.log("info", `modalità: ${mode === "adv" ? "avanzata" : "base"}`);
    schedule();
  }
  function setSending(on) {
    sending = !!on; store.set("gdc.devsend", sending);
    if (cfg && cfg.log) cfg.log("info", `invio log a Claude: ${sending ? "attivo" : "spento"} (sessione ${SESS})`);
    if (sending && cfg && cfg.backlog) { try { cfg.backlog().forEach((x) => enqueue(x.t, x.l, x.m)); } catch { /* ok */ } }
    apply(); schedule();
  }

  function enqueue(t, lv, msg) {
    queue.push({ sess: SESS, role: cfg.role, dev: String(cfg.dev()).slice(0, 60), ver: cfg.ver, t_ms: Math.round(t), lv: String(lv).slice(0, 10), msg: hide(msg).slice(0, 4000) });
    if (queue.length > QMAX) queue.splice(0, queue.length - QMAX);
  }
  function push(t, lv, msg) {
    if (!cfg || mode !== "adv" || !sending || !cfg.url) return;
    enqueue(t, lv, msg); schedule();
  }
  function schedule() { if (!timer && queue.length && mode === "adv" && sending) timer = setTimeout(() => { timer = 0; flush(); }, 3000 + backoff); }

  async function flush(final) {
    if (busy || !cfg || !cfg.url || !queue.length || mode !== "adv" || !sending) return;
    busy = true; const batch = queue.splice(0, 100);
    try {
      const r = await fetch(cfg.url.replace(/\/$/, "") + "/rest/v1/gdc_dev_logs", {
        method: "POST", keepalive: !!final && JSON.stringify(batch).length < 60000,
        headers: { apikey: cfg.key, Authorization: "Bearer " + cfg.key, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify(batch),
      });
      if (!r.ok) throw new Error("HTTP " + r.status);
      sent += batch.length; backoff = 0; lastErr = "";
    } catch (e) {
      failed++; lastErr = String(e.message || e).slice(0, 40); backoff = Math.min(30000, (backoff || 2000) * 2);
      queue.unshift(...batch); if (queue.length > QMAX) queue.splice(0, queue.length - QMAX);
    } finally { busy = false; status(); schedule(); }
  }

  /* cfg: { role, dev: () => id, ver, pairing, log(level,msg), backlog(): [{t,l,m}], host: elemento dove mettere l'interruttore } */
  function init(c) {
    if (started) return; started = true;
    cfg = { role: c.role, dev: c.dev, ver: c.ver, log: c.log, backlog: c.backlog, url: c.pairing ? c.pairing.u : "", key: c.pairing ? c.pairing.k : "" };
    const go = () => { if (c.host) mount(c.host); else apply(); };
    if (document.body) go(); else document.addEventListener("DOMContentLoaded", go);
    if (sending && mode === "adv" && cfg.backlog) { try { cfg.backlog().forEach((x) => enqueue(x.t, x.l, x.m)); } catch { /* ok */ } schedule(); }
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flush(true); });
    addEventListener("pagehide", () => flush(true));
    setInterval(status, 2000);
  }

  window.GDC_DEV = { init, push, setMode, get mode() { return mode; }, get sending() { return sending; }, session: SESS, flush: () => flush(false) };
})();
