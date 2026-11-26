"use strict";
/* ===== Modalità Pubblica (test): schermate della camera dal mockup =====
   Entra in una sessione (senza abbinamento) → Prepara questa camera → Ripresa. Usano le stesse funzioni di sempre (nome, avvio camera, REC dalla regia);
   l'anteprima è lo stesso riquadro della pagina, spostato nella schermata. */
const PubCam = {
  skip: false, screen: "", stageHome: null,
  el() { let el = document.getElementById("pubHome"); if (!el) { el = document.createElement("div"); el.id = "pubHome"; document.body.appendChild(el); } return el; },
  stageBack() { const st = document.getElementById("stage"); if (st && this.stageHome && st.parentNode !== this.stageHome.p) this.stageHome.p.insertBefore(st, this.stageHome.n); },
  sync() {
    const on = !!window.GDC_PUB && GDC_PUB.active(); if (on) GDC_PUB.ensureCss(); const el = document.getElementById("pubHome");
    const paired = on && pairing && !CAM_DUP;
    if (!on || CAM_DUP) { this.stageBack(); this.screen = ""; if (el) el.remove(); return; }
    if (!pairing) { if (this.skip) { if (el) el.remove(); return; } this.stageBack(); this.screen = ""; this.entra(this.el()); return; }
    if (paired) this.tick(true);
  },
  entra(el) {
    const arrow = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F3F4F6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`;
    el.innerHTML = `<div class="pb-top line">${GDC_PUB.LOGO}<span class="nm">Video System GDC Studio <span>· Camera</span></span></div>
      <div class="pb-main" style="max-width:640px"><div style="padding-top:28px"><span class="pb-step" style="color:#FFB84D">CAMERA</span><h2>Entra in una sessione</h2><p class="sub">Questo telefono diventa una camera che comandi dalla regia. Il telefono si collega da solo.</p></div>
      <ol class="pb-steps"><li><span>Sulla <b>regia</b> (iPad o computer) tocca <b>“Aggiungi camera”</b>: compare il QR.</span></li><li><span>Con la <b>fotocamera di questo telefono</b> inquadra il QR: si apre questa pagina già collegata.</span></li><li><span>Dai un nome alla camera, consenti fotocamera e microfono e tocca <b>Sono pronta</b>.</span></li></ol>
      <button class="pb-card" id="pubCode"><div class="tx"><span class="tt" style="font-size:20px">Non riesco a inquadrare il QR</span><span class="ds">Incolla qui il codice che inizia con gdc1.</span></div>${arrow}</button>
      <button class="pb-ghost" id="pubRegiaLink" style="margin-top:8px">Sono la regia: voglio creare una sessione</button>
      <p class="pb-note" style="margin-top:18px">Modalità di prova: vengono inviati dati tecnici sul funzionamento (modello, browser, rete, errori). Nessuna foto, video o audio.</p></div>`;
    el.querySelector("#pubCode").onclick = () => { this.skip = true; this.sync(); };
    el.querySelector("#pubRegiaLink").onclick = () => { dbg("info", "pubblica", "scelta: regia"); location.href = "dashboard.html"; };
  },
  tick(force) {
    const on = !!window.GDC_PUB && GDC_PUB.active(); if (!on || !pairing || CAM_DUP) return;
    const run = !!stream && !welcomePending, scr = run ? "run" : "setup";
    if (force || scr !== this.screen) { this.screen = scr; const el = this.el(); scr === "run" ? this.run(el) : this.setup(el); }
    if (scr === "run") this.live();
  },
  title() { return label || cfg.name || "Camera"; },
  setup(el) {
    this.stageBack(); const e = GDC_PUB.esc, ok = !!stream, wk = "wakeLock" in navigator;
    el.innerHTML = `<div class="pc"><span class="ps-chip" style="align-self:flex-start;display:inline-flex;align-items:center;gap:8px"><i style="width:8px;height:8px;border-radius:50%;background:#3DDC97;display:inline-block"></i>${sessName ? "Sessione: " + e(sessName) : "Collegata alla regia"}</span>
      <h1 class="pb-h">Prepara questa camera</h1>
      <div class="pc-prev"><span>${ok ? "Anteprima" : "L'anteprima compare quando la camera è pronta"}</span></div>
      <div><label class="f" for="pcName">Nome della camera</label><input type="text" id="pcName" maxlength="30" value="${e(cfg.name)}"><p class="pb-note" style="margin-top:8px">Compare sulla regia e nel nome dei file.</p></div>
      <div><span class="f" style="display:block;font-size:13px;color:#A9B0BB;margin-bottom:8px">Quale camera del telefono</span><div class="pc-seg"><button data-fc="environment" aria-pressed="${cfg.facing !== "user"}">Posteriore</button><button data-fc="user" aria-pressed="${cfg.facing === "user"}">Anteriore</button></div></div>
      <div class="pc-list"><div><span>Camera</span><b id="pcPCam">${ok ? "consentita" : "da consentire"}</b></div><div><span>Microfono</span><b id="pcPMic">${ok ? "consentito" : "da consentire"}</b></div><div><span>Schermo sempre acceso</span><b>${wk ? (wl ? "attivo" : "si attiva con la camera") : "non disponibile: tienilo acceso tu"}</b></div></div>
      <div class="pb-pro">Durante la ripresa tieni questa pagina aperta e in primo piano. Se esci dalla pagina, il dispositivo smette di registrare.</div>
      ${lastErr ? `<div class="pb-pro" style="background:#2A1513;border-color:#5A2A25;color:#FFB3AA">${e(lastErr)}</div>` : ""}
      <button class="pb-cta" id="pcGo" style="margin-top:auto">Sono pronta</button></div>`;
    el.querySelector("#pcName").onchange = (ev) => { cfg.name = ev.target.value.trim().slice(0, 30) || cfg.name; store.set("gdc.camCfg", cfg); try { rt && rt.setMeta({ name: cfg.name, device: cfg.device }); publish(); } catch { /* ok */ } };
    el.querySelectorAll("[data-fc]").forEach((b) => (b.onclick = async () => { cfg.facing = b.dataset.fc; store.set("gdc.camCfg", cfg); el.querySelectorAll("[data-fc]").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); if (stream && !recording) { try { await openCam(); } catch { /* ok */ } } }));
    el.querySelector("#pcGo").onclick = async () => {
      const n = el.querySelector("#pcName").value.trim(); if (n) { cfg.name = n.slice(0, 30); $("fName").value = cfg.name; $("wName").value = cfg.name; }
      if (welcomePending) $("wGo").click(); else $("camBtn").click();
      for (let i = 0; i < 40 && !stream; i++) await sleep(250); this.tick(true);
    };
  },
  run(el) {
    const st = document.getElementById("stage"); if (st && !this.stageHome) this.stageHome = { p: st.parentNode, n: st.nextSibling };
    el.innerHTML = `<div class="pc pc-run"><div class="pc-top"><b class="pb-h" id="pcTitle">${GDC_PUB.esc(this.title())}</b><span class="ps-pill"><i id="pcDot"></i><span id="pcConn">Collegata alla regia</span></span></div>
      <div class="pc-stage" id="pcStage"></div>
      <div class="pc-tiles"><div><span>Batteria</span><b id="pcBat">n/d</b></div><div><span>Spazio libero</span><b id="pcSp">—</b></div><div><span>Qualità</span><b id="pcRes">${GDC_PUB.esc(cfg.res)}</b></div></div>
      <div class="pc-btns"><button id="pcBlack">Schermo nero</button><button class="out" id="pcExit">Esci</button></div></div>`;
    if (st) { el.querySelector("#pcStage").appendChild(st); }
    el.querySelector("#pcBlack").onclick = () => $("blackBtn").click();
    el.querySelector("#pcExit").onclick = async () => { if (recording && !confirm("C'è una registrazione in corso: se esci, si ferma e la clip resta sul telefono. Esco?")) return; if (recording) { stopRec(); for (let i = 0; i < 20 && recording; i++) await sleep(250); } try { stopCam(); } catch { /* ok */ } leaveSession("Hai lasciato la sessione. Per rientrare inquadra di nuovo il QR della regia."); };
  },
  live() {
    const g = (id) => document.getElementById(id); if (!g("pcConn")) return;
    const conn = rt && /^connesso/.test(rt.status), t = this.title(); if (g("pcTitle") && g("pcTitle").textContent !== t) g("pcTitle").textContent = t;
    g("pcConn").textContent = conn ? "Collegata alla regia" : "In attesa della regia"; g("pcDot").style.background = conn ? "#3DDC97" : "#FFB84D";
    g("pcBat").textContent = bat.level != null ? Math.round(bat.level) + "%" : "n/d";
    try { const i = spaceInfo(); g("pcSp").textContent = i.known ? (i.avail >= 1e9 ? (i.avail / 1e9).toFixed(1) + " GB" : Math.round(i.avail / 1048576) + " MB") : "—"; } catch { g("pcSp").textContent = "—"; }
    g("pcRes").textContent = cfg.res;
  },
};
document.addEventListener("gdcmode", () => PubCam.sync());
setInterval(() => PubCam.tick(false), 600);
PubCam.sync();
