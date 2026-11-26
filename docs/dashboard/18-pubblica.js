"use strict";
/* ===== Modalità Pubblica (test): home, "Che cosa riprendi?", nuova sessione, barra della sessione =====
   Grafica dal mockup (tema scuro, Space Grotesk + Inter). Senza un abbinamento (nessuna sessione) la modalità Pubblica mostra la home del cliente;
   con una sessione aperta la regia è quella di sempre, senza gli strumenti da sviluppatore (li nasconde la classe "pub"). */
const PubUI = {
  step: "home", sel: { preset: "generico", color: "verde", venue: "", name: "", hours: 12, approve: true },
  note: "",
  top(nome, back) { const P = GDC_PUB; return `<div class="pb-top${back ? " line" : ""}">${P.LOGO}<span class="nm">Video System GDC Studio${nome ? ` <span>· ${nome}</span>` : ""}</span>${back ? `<button class="pb-back" id="pubBack">${back}</button>` : ""}</div>`; },
  arrow: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F3F4F6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`,
  sync() {
    const on = !!window.GDC_PUB && GDC_PUB.active();
    if (window.GDC_PUB) { GDC_PUB.applyTheme(on && REAL ? Session.cur.color : (on ? this.sel.color : "")); if (on) GDC_PUB.ensureCss(); }
    if (on && REAL && Session.cur.until && Date.now() > Session.cur.until) { // sessione scaduta: si torna alla home
      store.set("gdc.pubNote", "La sessione è scaduta. Creane una nuova: i file già registrati restano sui telefoni."); store.set("gdc.session", null); try { GDC_RT.Pair.clear(); } catch { /* ok */ } dbg("info", "pubblica", "sessione scaduta"); location.reload(); return;
    }
    { const h = document.querySelector("header h1 a, h1 a"); if (h) h.textContent = on ? "Video System GDC Studio" : "GDC Multicam"; document.title = on ? "Video System GDC Studio" : "GDC Multicam"; }
    let el = document.getElementById("pubHome");
    if (!on || REAL) { if (el) el.remove(); this.bar(on && REAL); return; }
    this.bar(false); if (!el) { el = document.createElement("div"); el.id = "pubHome"; document.body.appendChild(el); this.step = "home"; this.note = store.get("gdc.pubNote", "") || ""; store.set("gdc.pubNote", ""); }
    this.render(el);
  },
  filesOpen: false,
  files() { // riga con cartella, trasferimento automatico e scorciatoia, sotto la griglia (solo nella pagina principale)
    const f = document.getElementById("pubFilesBar"); if (!f) return; const xg = document.getElementById("xferGlobal"), e = GDC_PUB.esc;
    f.hidden = !xg; if (!xg) return; xg.classList.toggle("open", this.filesOpen);
    const dest = typeof Dest !== "undefined" ? (Dest.mode === "folder" && Dest.handle ? `Cartella: <b>${e(Dest.handle.name)}</b>` : Dest.mode === "folder" ? "Cartella: <b>da scegliere</b>" : "File: <b>su questo dispositivo</b>") : "";
    const auto = typeof Xfer !== "undefined" && Xfer.auto && !Xfer.hold ? "attivo" : "spento";
    f.querySelector(".st").innerHTML = `${dest} · Trasferimento automatico: <b>${auto}</b> · Segna un momento: tasto <b>M</b>`;
    f.querySelector("button").textContent = this.filesOpen ? "Chiudi impostazioni" : "Impostazioni dei file";
  },
  bar(show) {
    let b = document.getElementById("pubSessBar"), fb = document.getElementById("pubFilesBar");
    if (!show) { if (b) b.remove(); if (fb) fb.remove(); clearInterval(this._t); clearInterval(this._f); return; }
    if (!fb) { fb = document.createElement("div"); fb.id = "pubFilesBar"; fb.innerHTML = `<span class="st"></span><button id="pubFilesBtn">Impostazioni dei file</button>`; const v = document.getElementById("view"); if (v && v.parentNode) v.parentNode.insertBefore(fb, v.nextSibling); fb.querySelector("button").onclick = () => { this.filesOpen = !this.filesOpen; this.files(); }; }
    clearInterval(this._f); this._f = setInterval(() => this.files(), 1500); this.files();
    if (!b) { b = document.createElement("div"); b.id = "pubSessBar"; const v = document.getElementById("view"); if (v && v.parentNode) v.parentNode.insertBefore(b, v); else return; }
    const paint = () => { const s = Session.cur, e = GDC_PUB.esc, left = s.until ? Math.max(0, s.until - Date.now()) : 0, h = Math.floor(left / 3600000), m = Math.floor((left % 3600000) / 60000), tp = (GDC_PUB.PRESETS.find((p) => p.id === s.activity) || {}).name;
      b.innerHTML = `<span class="dot"></span><b>${e(s.venue || s.name || "Sessione")}</b>${s.venue && s.name ? `<span class="m">${e(s.name)}</span>` : ""}${tp ? `<span class="m">· ${e(tp)}</span>` : ""}${s.until ? `<span class="m" style="margin-left:auto">Valida ancora ${h ? h + " h " : ""}${m} min</span>` : `<span style="margin-left:auto"></span>`}<button class="nb" id="pubNewSess">Nuova sessione</button>`;
      const nb = b.querySelector("#pubNewSess"); if (nb) nb.onclick = () => { const x = document.getElementById("sessNewHome"); if (x) x.click(); else location.hash = "#/"; }; };
    paint(); clearInterval(this._t); this._t = setInterval(paint, 30000);
  },
  render(el) {
    const e = GDC_PUB.esc, s = this.sel, P = GDC_PUB;
    if (this.step === "home") {
      el.innerHTML = `${this.top("")}<div class="pb-main"><div class="pb-hero"><div><h1>Più telefoni,<br>una sola ripresa.</h1><p class="lead">Usa i telefoni che hai già come camere e comanda tutto da un iPad o dal computer. Senza installare niente.</p></div>
        <div class="pb-cards">${this.note ? `<div class="pb-pro">${e(this.note)}</div>` : ""}
        <button class="pb-card" id="pubRegia"><div class="tx"><span class="tg" style="color:#3DDC97">REGIA</span><span class="tt">Comando le camere</span><span class="ds">Da iPad, computer o telefono: crei la sessione e comandi REC, zoom e file.</span></div>${this.arrow}</button>
        <button class="pb-card" id="pubCamera"><div class="tx"><span class="tg" style="color:#FFB84D">CAMERA</span><span class="tt">Questo telefono riprende</span><span class="ds">Scansioni il QR della regia e il telefono è pronto a registrare.</span></div>${this.arrow}</button>
        <span class="pb-note">Senza account. I video restano sui tuoi dispositivi.<br>Modalità di prova: vengono inviati dati tecnici sul funzionamento (modello, browser, rete, errori). Nessuna foto, video o audio.</span></div></div></div>`;
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
    store.set("gdc.session", { name, start: now, until: now + s.hours * 3600000, activity: s.preset, venue: clean(s.venue), color: s.color });
    store.set("gdc.approve", !!s.approve); store.set("gdc.qrOpen", true); store.set(CAM_KEY, []); store.set("gdc.rejected", []); store.set("gdc.addOpenNext", true);
    dbg("info", "pubblica", `sessione creata: “${name}”`, { tipo: s.preset, colore: s.color, locale: clean(s.venue), ore: s.hours, approvazione: !!s.approve });
    location.reload();
  },
};
document.addEventListener("gdcmode", () => PubUI.sync());
PubUI.sync();
