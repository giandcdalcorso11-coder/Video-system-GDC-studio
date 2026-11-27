"use strict";
/* ===== Modalità Pubblica (test): home, "Che cosa riprendi?", nuova sessione, barra della sessione =====
   Grafica dal mockup (tema scuro, Space Grotesk + Inter). Senza un abbinamento (nessuna sessione) la modalità Pubblica mostra la home del cliente;
   con una sessione aperta la regia è quella di sempre, senza gli strumenti da sviluppatore (li nasconde la classe "pub"). */
const PubUI = {
  step: "home", sel: { preset: "generico", color: "verde", venue: "", name: "", hours: 12, approve: true },
  note: "",
  top(nome, back) { const P = GDC_PUB; return `<div class="pb-top${back ? " line" : ""}">${P.LOGO}<span class="nm">Video System GDC Studio${nome ? ` <span>· ${nome}</span>` : ""}</span>${back ? `<button class="pb-back" id="pubBack">${back}</button>` : `<button class="pb-back" id="pubExit">Esci dalla prova</button>`}</div>`; },
  arrow: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F3F4F6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`,
  sync() {
    const on = !!window.GDC_PUB && GDC_PUB.active();
    if (window.GDC_PUB) { GDC_PUB.applyTheme(on && this.live() ? Session.cur.color : (on ? this.sel.color : "")); if (on) GDC_PUB.ensureCss(); }
    if (on && this.live() && Session.cur.until && Date.now() > Session.cur.until) { // sessione scaduta: si torna alla home
      store.set("gdc.pubNote", "La sessione è scaduta. Creane una nuova: i file già registrati restano sui telefoni."); store.set("gdc.session", null); localStorage.setItem("gdc.pubHome", "1"); try { GDC_RT.Pair.clear(); } catch { /* ok */ } dbg("info", "pubblica", "sessione scaduta"); location.reload(); return;
    }
    { const h = document.querySelector("header h1 a, h1 a"); if (h) h.textContent = on ? "Video System GDC Studio" : "GDC Multicam"; document.title = on ? "Video System GDC Studio" : "GDC Multicam"; }
    { const now = on && this.live(); if (this.lastSess !== undefined && this.lastSess !== now && typeof route === "function") { this.lastSess = now; setTimeout(() => route(), 0); } this.lastSess = now; }
    let el = document.getElementById("pubHome");
    if (!on || this.live()) { if (el) el.remove(); this.bar(on && this.live()); return; }
    this.bar(false); if (!el) { el = document.createElement("div"); el.id = "pubHome"; document.body.appendChild(el); this.step = "home"; this.note = store.get("gdc.pubNote", "") || ""; store.set("gdc.pubNote", ""); }
    this.render(el);
  },
  filesOpen: false,
  bar(show) { // nella regia in Pubblica il selettore delle modalità passa sotto la vista (serve a noi per tornare in Avanzata)
    const host = document.getElementById("modeHost"), v = document.getElementById("view"); if (!host || !v || !v.parentNode) return;
    if (show) { if (host.previousElementSibling !== v) v.parentNode.insertBefore(host, v.nextSibling); } else if (host.nextElementSibling !== v) v.parentNode.insertBefore(host, v);
  },
  render(el) {
    const e = GDC_PUB.esc, s = this.sel, P = GDC_PUB;
    if (this.step === "home") {
      el.innerHTML = `${this.top("")}<div class="pb-main"><div class="pb-hero"><div><h1>Più telefoni,<br>una sola ripresa.</h1><p class="lead">Usa i telefoni che hai già come camere e comanda tutto da un iPad o dal computer. Senza installare niente.</p></div>
        <div class="pb-cards">${this.note ? `<div class="pb-pro">${e(this.note)}</div>` : ""}
        <button class="pb-card" id="pubRegia"><div class="tx"><span class="tg" style="color:#3DDC97">REGIA</span><span class="tt">Comando le camere</span><span class="ds">Da iPad, computer o telefono: crei la sessione e comandi REC, zoom e file.</span></div>${this.arrow}</button>
        <button class="pb-card" id="pubCamera"><div class="tx"><span class="tg" style="color:#FFB84D">CAMERA</span><span class="tt">Questo telefono riprende</span><span class="ds">Scansioni il QR della regia e il telefono è pronto a registrare.</span></div>${this.arrow}</button>
        <span class="pb-note">Senza account. I video restano sui tuoi dispositivi.<br>Modalità di prova: vengono inviati dati tecnici sul funzionamento (modello, browser, rete, errori). Nessuna foto, video o audio.</span></div></div></div>`;
      el.querySelector("#pubExit").onclick = () => GDC_DEV.setMode("base");
      el.querySelector("#pubRegia").onclick = () => { this.step = "tipo"; this.render(el); el.scrollTop = 0; };
      el.querySelector("#pubCamera").onclick = () => { dbg("info", "pubblica", "scelta: camera"); location.href = "camera.html"; };
    } else if (this.step === "tipo") {
      const nm = s.venue || "Il tuo locale", hex = (P.COLORS.find((c) => c.id === s.color) || {}).hex;
      el.innerHTML = `${this.top("Regia", "Indietro")}<div class="pb-main"><div class="pb-cols"><div><span class="pb-step">PASSO 1 DI 2 · FACOLTATIVO</span><h2>Che cosa riprendi?</h2><p class="sub">Scegli un tipo di attività: imposta da solo diciture e impostazioni di partenza. Puoi cambiare tutto dopo.</p>
        <div class="pb-types">${P.PRESETS.map((p) => `<button class="pb-type" data-pre="${p.id}" aria-pressed="${s.preset === p.id}"><b>${e(p.name)}</b><span>${e(p.note)}</span></button>`).join("")}</div>
        <div class="pb-row"><div style="flex:1;min-width:220px"><label class="f" for="pubVenue">Nome del locale o del progetto (facoltativo)</label><input type="text" id="pubVenue" maxlength="60" value="${e(s.venue)}" placeholder="Es. Padel Club Lido"></div><div><span class="f" style="display:block;font-size:13px;color:#A9B0BB;margin-bottom:8px">Colore</span><div class="pb-cols-c">${P.COLORS.map((c) => `<button class="col" data-col="${c.id}" aria-label="${e(c.name)}" aria-pressed="${s.color === c.id}" style="background:${c.hex}"></button>`).join("")}</div></div></div></div>
        <div><div class="pb-prev"><span class="lb">ANTEPRIMA</span><div style="display:flex;align-items:center;gap:10px"><span id="pubPrevDot" style="width:12px;height:12px;border-radius:50%;background:${hex}"></span><b class="pb-h" id="pubPrevName" style="font-size:17px">${e(nm)}</b></div><div class="pb-fake"><i></i></div><div class="pb-btnrow"><div id="pubPrevRec" style="background:${hex};color:#0E1013;border-color:${hex}">● REC</div><div>Dettagli</div></div></div>
        <p class="pb-note" style="margin:12px 0 0">Nome e colore arrivano anche ai telefoni delle camere. Il logo verrà dopo.</p>
        <div class="pb-pro" style="margin-top:14px">Con il piano Pro i tuoi preset e la tua personalizzazione restano salvati: non li rifai ogni volta.</div></div></div>
        <div style="max-width:560px;margin-top:8px"><button class="pb-cta" id="pubNext">Continua</button><button class="pb-ghost" id="pubSkip">Salta: parti subito</button></div></div>`;
      el.querySelector("#pubBack").onclick = () => { this.step = "home"; this.render(el); };
      el.querySelectorAll("[data-pre]").forEach((b) => (b.onclick = () => { s.preset = b.dataset.pre; el.querySelectorAll("[data-pre]").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); }));
      el.querySelector("#pubVenue").oninput = (ev) => { s.venue = ev.target.value; el.querySelector("#pubPrevName").textContent = s.venue || "Il tuo locale"; };
      el.querySelectorAll("[data-col]").forEach((b) => (b.onclick = () => { s.color = b.dataset.col; const h = (P.COLORS.find((c) => c.id === s.color) || {}).hex; el.querySelectorAll("[data-col]").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); el.querySelector("#pubPrevDot").style.background = h; const r = el.querySelector("#pubPrevRec"); r.style.background = h; r.style.borderColor = h; P.applyTheme(s.color); }));
      el.querySelector("#pubNext").onclick = () => { this.step = "nuova"; this.render(el); el.scrollTop = 0; };
      el.querySelector("#pubSkip").onclick = () => { this.create(); };
    } else {
      el.innerHTML = `${this.top("Regia", "Indietro")}<div class="pb-main"><div style="padding-top:24px;max-width:560px"><span class="pb-step">PASSO 2 DI 2</span><h2>Nuova sessione</h2><p class="sub">Ogni telefono che entra diventa una camera che puoi comandare da qui.</p></div>
        <div class="pb-form"><div><label class="f" for="pubName">Nome della sessione</label><input type="text" id="pubName" maxlength="60" value="${e(s.name)}" placeholder="Es. Set di domenica"></div>
        <div><span class="f" style="display:block;font-size:13px;color:#A9B0BB;margin-bottom:8px">Per quanto resta valida</span><div class="pb-seg">${P.HOURS.map((h) => `<button data-h="${h}" aria-pressed="${s.hours === h}">${h} ore</button>`).join("")}</div></div>
        <button class="pb-sw" id="pubAppr" aria-pressed="${s.approve}"><span><b>Approvo ogni camera che entra</b><span class="d">Chi ha il QR non entra finché non tocchi Accetta.</span></span><span class="k"></span></button>
        <div><button class="pb-cta" id="pubGo" style="margin-top:0">Crea la sessione e mostra il QR</button></div></div></div>`;
      el.querySelector("#pubBack").onclick = () => { this.step = "tipo"; this.render(el); };
      el.querySelector("#pubName").oninput = (ev) => { s.name = ev.target.value; };
      el.querySelectorAll("[data-h]").forEach((b) => (b.onclick = () => { s.hours = Number(b.dataset.h); el.querySelectorAll("[data-h]").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); }));
      el.querySelector("#pubAppr").onclick = (ev) => { s.approve = !s.approve; ev.currentTarget.setAttribute("aria-pressed", String(s.approve)); };
      el.querySelector("#pubGo").onclick = () => this.create();
    }
  },
  create() {
    const s = this.sel, clean = (v) => String(v || "").replace(/[<>&"]/g, "").trim().slice(0, 60), d = new Date(), now = Date.now();
    const name = clean(s.name) || (clean(s.venue) ? "" : `Sessione del ${d.getDate()}/${d.getMonth() + 1}`);
    GDC_RT.Pair.save({ u: GDC_PUB.CFG.u, k: GDC_PUB.CFG.k, c: GDC_RT.Pair.newChannel() });
    store.set("gdc.session", { name, start: now, until: now + s.hours * 3600000, activity: s.preset, venue: clean(s.venue), color: s.color, pub: true });
    store.set("gdc.approve", !!s.approve); store.set("gdc.qrOpen", true); store.set(CAM_KEY, []); store.set("gdc.rejected", []); store.set("gdc.addOpenNext", true);
    dbg("info", "pubblica", `sessione creata: “${name}”`, { tipo: s.preset, colore: s.color, locale: clean(s.venue), ore: s.hours, approvazione: !!s.approve });
    location.reload();
  },
};

/* ===== Regia con la sessione aperta (mockup "Sessione"): intestazione, schede camera, QR, riga dei file ===== */
Object.assign(PubUI, {
  live() { return REAL && !!(Session.cur && Session.cur.pub); },
  sessionOn() { return !!window.GDC_PUB && GDC_PUB.active() && this.live(); },
  head() {
    const s = Session.cur, e = GDC_PUB.esc, tp = (GDC_PUB.PRESETS.find((p) => p.id === s.activity) || {}).name;
    return `<div class="ps-r1">${GDC_PUB.LOGO}<b class="pb-h">${e(s.venue || s.name || "Sessione")}</b>${s.venue && s.name ? `<span class="ps-chip">${e(s.name)}</span>` : ""}${tp ? `<span class="ps-chip">${e(tp)}</span>` : ""}<span class="grow"></span><span class="ps-until" id="pubUntil"></span><button class="ps-ghost" id="pubNewSess">Nuova sessione</button><button class="ps-ghost" id="pubLeave">Esci dalla sessione</button><span class="ps-pill"><i id="pubDot"></i><span id="pubCnt">0 camere collegate</span></span><span class="ps-timer" id="pubTimer">00:00</span></div>`;
  },
  card(c) {
    const id = c.id;
    return `<article class="card click pcard" data-cam="${id}" data-bind="card" data-go="${id}">
      <div class="card-h"><b data-bind="pubName" data-cam="${id}"></b><span class="ps-st" data-bind="pubSt" data-cam="${id}"></span></div>
      <div class="card-b">${previewHtml(id, "mini")}</div>
      <div class="ps-meta"><span data-bind="pubDev" data-cam="${id}"></span><span data-bind="pubBat" data-cam="${id}"></span></div>
      <div class="ps-zoom"><div><span>Zoom</span><b data-bind="pubZv" data-cam="${id}">—</b></div><input type="range" class="ps-zs" data-bind="pubZs" data-cam="${id}" data-pz="${id}" min="1" max="5" step="0.1" value="1" aria-label="Zoom"></div>
      <div class="card-f"><button class="ps-rec" data-bind="pubRec" data-cam="${id}" data-act="rec_start">● REC</button><button class="ghost ps-det" data-go="${id}">Dettagli</button></div>
    </article>`;
  },
  home() {
    const bar = Views.bar().replace('</div><div id="vwChips"', '<button id="pubStop" class="ps-b" disabled>■ STOP tutte</button><button id="pubRec" class="ps-b rec" disabled>● REC tutte</button></div><div id="vwChips"');
    return `${mergeBanner()}${staleBanner()}${Views.modal()}
      <div class="ps"><div class="ps-head">${this.head()}${bar}</div>
      <section class="panel" id="preflight" hidden></section><section class="panel" id="xferLive" hidden></section>
      <section class="grid" id="homeGrid">${cameras.map((c) => this.card(c)).join("")}
        <button class="add" id="addDev">+ Aggiungi dispositivo<small class="muted" style="display:block;font-weight:400">QR o codice · la camera chiede di entrare e tu confermi</small></button></section>
      <div id="pubFilesBar"><span class="st"></span><button id="pubFilesBtn">Impostazioni dei file</button></div>
      <section class="panel" id="xferGlobal" style="margin-top:12px"></section></div>`;
  },
  qrPanel() {
    const e = GDC_PUB.esc, s = Session.cur, left = s.until ? Math.max(0, s.until - Date.now()) : 0, h = Math.floor(left / 3600000), m = Math.floor((left % 3600000) / 60000);
    return `<section class="panel ps-qr" id="addPhone"><div class="ps-qrbox"><div id="qrBox"><div id="qrImg" class="ps-qrimg"></div></div>
      <div class="ps-qrtx"><b class="pb-h" style="font-size:20px">Il telefono inquadra il QR</b><p class="muted">Apri la <b>fotocamera</b> del telefono, inquadra il QR e tocca il link che compare. La pagina si apre già collegata a questa regia. Funziona con iPhone e Android.</p>
      ${s.until ? `<div class="ps-chip" style="align-self:flex-start">Valida ancora ${h ? h + " h " : ""}${m} min</div>` : ""}
      <div class="ps-wait"><i></i> IN ATTESA di nuove camere</div>
      <button class="ps-ghost" id="qrCopy" style="align-self:flex-start">Copia il link</button>
      <div class="muted" style="font-size:13px">${Join.approve ? "Ogni camera nuova compare qui con Accetta e Rifiuta." : "Chi apre il link entra subito, senza chiedere."}</div></div></div></section>`;
  },
  files() {
    const f = document.getElementById("pubFilesBar"); if (!f) return; const xg = document.getElementById("xferGlobal"), e = GDC_PUB.esc;
    if (xg) xg.classList.toggle("open", this.filesOpen);
    const dest = typeof Dest !== "undefined" ? (Dest.mode === "folder" && Dest.handle ? `Cartella: <b>${e(Dest.handle.name)}</b>` : Dest.mode === "folder" ? "Cartella: <b>da scegliere</b>" : "File: <b>su questo dispositivo</b>") : "";
    const auto = typeof Xfer !== "undefined" && Xfer.auto && !Xfer.hold ? "attivo" : "spento";
    f.querySelector(".st").innerHTML = `${dest} · Trasferimento automatico: <b>${auto}</b> · Segna un momento: tasto <b>M</b>`;
    f.querySelector("button").textContent = this.filesOpen ? "Chiudi impostazioni" : "Impostazioni dei file";
  },
  tick() {
    if (!this.sessionOn()) return; const on = cameras.filter((c) => state[c.id] && state[c.id].online).length, cnt = document.getElementById("pubCnt");
    if (cnt) { cnt.textContent = `${on} ${on === 1 ? "camera collegata" : "camere collegate"}`; const d = document.getElementById("pubDot"); if (d) d.style.background = on ? "#3DDC97" : "#2C313A"; }
    const t = document.getElementById("pubTimer"), g = document.getElementById("globalTimer"); if (t && g) t.textContent = g.textContent;
    const r = document.getElementById("pubRec"), sa = document.getElementById("pubStop"); if (r) r.disabled = $("#recAll").disabled; if (sa) sa.disabled = $("#stopAll").disabled;
    const u = document.getElementById("pubUntil"), s = Session.cur; if (u) { const left = s.until ? Math.max(0, s.until - Date.now()) : 0; u.textContent = s.until ? `Valida ancora ${Math.floor(left / 3600000) ? Math.floor(left / 3600000) + " h " : ""}${Math.floor((left % 3600000) / 60000)} min` : ""; }
    this.files();
  },
});
Object.assign(BIND, {
  pubName: (st, c, el) => { el.textContent = labelOf(c.id) || c.name || "Camera"; },
  pubSt: (st, c, el) => { const rec = !!st.rec, tl = !!(st.tl && st.tl.stage); el.className = "ps-st " + (!st.online ? "off" : rec || tl ? "rec" : "ok"); el.innerHTML = `<i></i>${!st.online ? "Offline" : rec ? "REC " + fmtTime(Date.now() - st.recStart) : tl ? "Time-lapse" : "Pronta"}`; },
  pubDev: (st, c, el) => { el.textContent = [c.name, c.device].filter(Boolean).join(" · ") || "Telefono"; },
  pubBat: (st, c, el) => { const b = st.online && st.battery != null ? `Batt. ${Math.round(st.battery)}%${st.charging ? " ⚡" : ""}` : ""; const sp = !st.online ? "" : st.space && st.space.known ? `~${st.space.minLeft} min` : st.freeGb != null ? Math.round(st.freeGb) + " GB" : ""; el.textContent = [b, sp].filter(Boolean).join(" · "); },
  pubZv: (st, c, el) => { const z = st.zoom; el.textContent = st.online && st.camReady && z && z.cur != null ? Number(z.cur).toFixed(1).replace(".", ",") + "×" : "—"; },
  pubZs: (st, c, el) => { const z = st.zoom, ok = !!(st.online && st.camReady && z && z.native); el.disabled = !ok; if (ok) { el.min = z.min; el.max = z.max; if (!zDrag && document.activeElement !== el && z.cur != null) el.value = z.cur; } },
  pubRec: (st, c, el) => { const busy = Mode.busy(st) || !!st.tl; el.dataset.act = busy ? "rec_stop" : "rec_start"; el.className = "ps-rec" + (busy ? " on" : ""); el.textContent = busy ? "■ STOP" : "● REC"; el.disabled = !st.online || (st.tl && !Mode.busy(st) && false); },
});
document.addEventListener("click", (e) => {
  if (!PubUI.sessionOn()) return;
  if (e.target.closest("#pubRec")) { $("#recAll").click(); return; }
  if (e.target.closest("#pubStop")) { $("#stopAll").click(); return; }
  if (e.target.closest("#pubFilesBtn")) { location.hash = "#/file"; return; }
  if (e.target.closest("#pubLeave")) {
    if (!confirm("Esci dalla sessione? Le camere collegate si scollegano. Le clip già registrate restano sui telefoni.")) return;
    dbg("info", "pubblica", "uscita dalla sessione: torno alla home della modalità Pubblica");
    store.set("gdc.pubNote", ""); store.set("gdc.session", null); localStorage.setItem("gdc.pubHome", "1"); try { GDC_RT.Pair.clear(); } catch { /* ok */ } location.reload(); return;
  }
  if (e.target.closest("#pubNewSess")) { const x = document.getElementById("sessNewHome"); if (x) x.click(); else { const n = prompt("Nuova sessione. Il QR cambia: i telefoni collegati ora dovranno rientrare con il nuovo QR (le clip restano sui telefoni).\n\nScrivi il nome della nuova sessione, oppure lascia vuoto:", ""); if (n !== null) Session.begin(n); } }
});
document.addEventListener("input", (e) => { const z = e.target.closest && e.target.closest("[data-pz]"); if (!z || !PubUI.sessionOn()) return; zDrag = true; const id = z.dataset.pz; z.previousElementSibling && 0; const v = z.parentNode.querySelector("[data-bind=pubZv]"); if (v) v.textContent = Number(z.value).toFixed(1).replace(".", ",") + "×"; if (!z._t) z._t = setTimeout(() => { z._t = 0; command(id, { cmd: "zoom", z: Number(z.value) }); }, 100); });
document.addEventListener("change", (e) => { const z = e.target.closest && e.target.closest("[data-pz]"); if (z) { zDrag = false; command(z.dataset.pz, { cmd: "zoom", z: Number(z.value) }); } });
document.addEventListener("click", (e) => { if (e.target.closest && e.target.closest(".ps-zs")) e.stopPropagation(); }, true);
setInterval(() => PubUI.tick(), 500);

/* ===== Schermata "File" (mockup): dove salvare le riprese e stato delle clip ===== */
Object.assign(PubUI, {
  fileRows() {
    const seen = new Set(), rows = [];
    [...Xfer.jobs.values()].filter((j) => !j.test).sort((a, b) => b.at - a.at).forEach((j) => { const k = j.camId + "|" + (j.sid || j.id); if (seen.has(k)) return; seen.add(k); rows.push({ camId: j.camId, sid: j.sid, name: j.fname || j.name, job: j, bytes: j.size || 0 }); });
    cameras.forEach((c) => ((state[c.id] && state[c.id].clips) || []).forEach((k) => { if (!k.id || seen.has(c.id + "|" + k.id)) return; seen.add(c.id + "|" + k.id); rows.push({ camId: c.id, sid: k.id, name: k.file, clip: k, bytes: (k.mb || 0) * 1048576 }); }));
    return rows;
  },
  rowHtml(r) {
    const e = GDC_PUB.esc, j = r.job, cam = camById(r.camId), who = cam ? labelOf(cam.id) || cam.name : "";
    let right = "", sub = "", bar = "";
    if (j && j.state === "ok") { right = `<span class="ok">✓ Arrivato e verificato</span>`; sub = j.where === "memoria" && !j.saved ? "In memoria: tocca Salva" : j.where === "memoria" ? "Salvato" : "Salvato nella cartella"; if (j.where === "memoria" && !j.saved) right += ` <button class="ps-ghost" data-xf="save" data-xid="${j.id}">Salva</button>`; }
    else if (j && (j.state === "in corso" || j.state === "attesa" || j.state === "interrotto")) { const pct = j.size ? Math.min(100, Math.round(j.got / j.size * 100)) : 0, left = j.speed > 0 && j.size > j.got ? Math.round((j.size - j.got) / j.speed) : 0; right = j.state === "attesa" ? "In attesa" : `${pct}%`; sub = j.state === "interrotto" ? e(j.note || "interrotto") : j.state === "attesa" ? "Parte appena c'è posto" : `${j.speed ? (j.speed * 8 / 1e6).toFixed(1) + " Mbps" : ""}${left ? " · circa " + (left >= 60 ? Math.round(left / 60) + " min" : left + " s") : ""}`; bar = `<div class="pf-bar"><i style="width:${pct}%"></i></div>`; }
    else if (j && j.state === "errore") { right = `<span class="bad">${e(j.error || "non riuscito")}</span> <button class="ps-ghost" data-xf="resume" data-xid="${j.id}">Riprendi</button>`; }
    else { right = r.clip && r.clip.status === "pronta" ? `<button class="ps-ghost" data-xf="go" data-sid="${e(r.sid)}">Trasferisci</button>` : e((r.clip && r.clip.status) || ""); sub = r.clip && r.clip.status === "pronta" ? "Sul telefono" : ""; }
    return `<div class="pf-row" data-cam="${e(r.camId)}"><div class="pf-n"><b>${e(r.name)}</b><span>${e(who)}${sub ? " · " + sub : ""}</span>${bar}</div><div class="pf-r"><span>${r.bytes ? fmtMB(r.bytes) : ""}</span><div>${right}</div></div></div>`;
  },
  fileClips() {
    const rows = this.fileRows(), tot = rows.reduce((a, r) => a + r.bytes, 0), busy = Xfer.active().length, ready = rows.filter((r) => !r.job && r.clip && r.clip.status === "pronta").length;
    return `<div class="pf-h"><h2 class="pb-h">Riprese</h2><span class="m">${rows.length} ${rows.length === 1 ? "clip" : "clip"}${tot ? " · " + fmtMB(tot) : ""}</span><span class="grow"></span><button class="pf-all" data-xf="allcams" ${ready && !Xfer.queueRun ? "" : "disabled"}>Trasferisci tutte${ready ? " (" + ready + ")" : ""}</button></div>
      ${rows.length ? rows.map((r) => this.rowHtml(r)).join("") : `<div class="pf-empty">Nessuna ripresa ancora. Le clip compaiono qui appena fermi la registrazione.</div>`}
      ${busy ? `<div class="pb-pro">Trasferimento in corso: non chiudere questa pagina e lascia le camere aperte.</div>` : ""}`;
  },
  fileTop() {
    const e = GDC_PUB.esc, s = Session.cur, dh = Dest.health;
    return `<div class="pf-h2"><h2 class="pb-h">Dove salvare le riprese</h2></div>
      <div class="pf-opts">${FS ? `<label class="pf-opt${Dest.mode === "folder" ? " on" : ""}"><input type="radio" name="pfd" data-xm="folder" ${Dest.mode === "folder" ? "checked" : ""}><div><b>Cartella di questo computer</b><span>${Dest.handle ? e(Dest.handle.name) : "Nessuna cartella scelta"}</span></div>${Dest.mode === "folder" ? `<button class="ps-ghost" data-xf="pick" type="button">${Dest.handle ? "Cambia cartella" : "Scegli cartella"}</button>` : ""}</label>` : ""}
        <label class="pf-opt${Dest.mode === "device" ? " on" : ""}"><input type="radio" name="pfd" data-xm="device" ${Dest.mode === "device" ? "checked" : ""}><div><b>Questo dispositivo</b><span>Su iPad: il file arriva in memoria, poi tocchi Salva e scegli File o Foto.</span></div></label></div>
      ${Dest.mode === "folder" && Dest.handle && dh ? `<div class="pf-health ${dh.ok ? "ok" : "bad"}">${dh.ok ? "✓ raggiungibile e scrivibile" : e(dh.msg)}${dh.ok ? "" : ' <button class="ps-ghost" data-xf="chk">Verifica cartella</button>'}</div>` : ""}
      <label class="pf-sw"><input type="checkbox" data-xf="del" ${Xfer.delAfter ? "checked" : ""}><span>Elimina dal telefono solo dopo che il file è arrivato e verificato</span></label>
      <label class="pf-sw"><input type="checkbox" data-xf="auto" ${Xfer.auto && !Xfer.hold ? "checked" : ""} ${Dest.mode === "folder" && Dest.handle && !Xfer.hold ? "" : "disabled"}><span>Trasferisci da solo ogni clip appena fermo la registrazione</span></label>
      <label class="pf-sw"><input type="checkbox" data-xf="hold" ${Xfer.hold ? "checked" : ""}><span>Tieni i file sui telefoni: non trasferire durante la sessione<small>Utile con una rete debole o con l'iPad come regia.</small></span></label>`;
  },
  showFile() {
    Preview.stopAll(); const e = GDC_PUB.esc, s = Session.cur;
    $("#view").innerHTML = `<div class="ps pf"><div class="ps-head"><div class="ps-r1"><a class="pf-back" href="#/">‹ Camere</a>${GDC_PUB.LOGO}<b class="pb-h">${e(s.venue || s.name || "Sessione")}</b><span class="ps-chip">File</span><span class="grow"></span></div></div>
      <div id="pfTop">${this.fileTop()}</div><div id="pfClips" class="pf-clips">${this.fileClips()}</div></div>`;
    this._sigT = this.fileSigTop(); this._sigC = this.fileSigClips(); curDetail = null;
  },
  fileSigTop() { return JSON.stringify([Dest.mode, Dest.handle && Dest.handle.name, Dest.health && Dest.health.ok, Dest.health && Dest.health.msg, Xfer.delAfter, Xfer.auto, Xfer.hold, FS]); },
  fileSigClips() { return JSON.stringify([this.fileRows().map((r) => [r.camId, r.sid, r.name, r.job && [r.job.state, Math.round((r.job.got || 0) / 65536), r.job.saved, r.job.error, r.job.note], r.clip && r.clip.status]), Xfer.queueRun, Xfer.active().length]); },
  fileTick() {
    if (location.hash !== "#/file" || !this.sessionOn()) return; const t = document.getElementById("pfTop"), c = document.getElementById("pfClips"); if (!t || !c) return;
    const st = this.fileSigTop(), sc = this.fileSigClips();
    if (st !== this._sigT && !t.contains(document.activeElement)) { this._sigT = st; t.innerHTML = this.fileTop(); }
    if (sc !== this._sigC) { this._sigC = sc; c.innerHTML = this.fileClips(); }
  },
});
setInterval(() => PubUI.fileTick(), 500);
document.addEventListener("gdcmode", () => PubUI.sync());
PubUI.sync(); if (PubUI.sessionOn()) route(); // la prima vista era già stata disegnata prima del caricamento di questo file
