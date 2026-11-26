"use strict";
/* ===== Modalità Pubblica (test): home, "Che cosa riprendi?" e creazione della sessione =====
   Senza un abbinamento (nessuna sessione) la modalità Pubblica mostra la home del cliente; con una sessione aperta la regia è quella di sempre,
   senza gli strumenti da sviluppatore (li nasconde la classe "pub"). */
const PubUI = {
  step: "home", sel: { preset: "generico", color: "blu", venue: "", name: "" },
  sync() {
    const on = !!window.GDC_PUB && GDC_PUB.active(); GDC_PUB && GDC_PUB.applyTheme(on && REAL ? Session.cur.color : "");
    let el = document.getElementById("pubHome");
    if (!on || REAL) { if (el) el.remove(); return; }
    GDC_PUB.ensureCss(); if (!el) { el = document.createElement("div"); el.id = "pubHome"; document.body.appendChild(el); this.step = "home"; }
    this.render(el);
  },
  render(el) {
    const e = GDC_PUB.esc;
    if (this.step === "home") {
      el.innerHTML = `<div class="wrap"><h1>Video System GDC Studio</h1><p class="sub">Riprendi con più telefoni e comanda tutto da un solo schermo. Niente da installare.</p>
        <button class="big" id="pubRegia"><b>Sono la regia</b><span>Creo una sessione, faccio entrare le camere, comando il REC e ricevo i file.</span></button>
        <button class="big" id="pubCamera"><b>Sono una camera</b><span>Uso questo telefono per riprendere: mi serve il QR che mostra la regia.</span></button>
        <p class="note">Modalità di prova: vengono inviati dati tecnici sul funzionamento (modello, browser, rete, errori). Nessuna foto, video o audio.</p></div>`;
      el.querySelector("#pubRegia").onclick = () => { this.step = "tipo"; this.render(el); };
      el.querySelector("#pubCamera").onclick = () => { dbg("info", "pubblica", "scelta: camera"); location.href = "camera.html"; };
    } else {
      const s = this.sel;
      el.innerHTML = `<div class="wrap"><button class="back" id="pubBack">← Indietro</button><h1>Che cosa riprendi?</h1><p class="sub">Scegli il tipo di ripresa: puoi cambiare tutto dopo.</p>
        ${GDC_PUB.PRESETS.map((p) => `<label class="opt"><input type="radio" name="pubPreset" value="${p.id}" ${s.preset === p.id ? "checked" : ""}><b>${e(p.name)}</b><small>${e(p.note)}</small></label>`).join("")}
        <label class="f" for="pubName">Nome della sessione</label><input type="text" id="pubName" maxlength="60" placeholder="Es. Partita di sabato" value="${e(s.name)}">
        <label class="f" for="pubVenue">Nome del locale o dell'evento (facoltativo)</label><input type="text" id="pubVenue" maxlength="60" value="${e(s.venue)}">
        <label class="f">Colore</label><div class="cols">${GDC_PUB.COLORS.map((c) => `<button class="col" data-col="${c.id}" aria-label="${e(c.name)}" aria-pressed="${s.color === c.id}" style="background:${c.hex}"></button>`).join("")}</div>
        <button class="go" id="pubGo">Crea la sessione e mostra il QR</button></div>`;
      el.querySelector("#pubBack").onclick = () => { this.step = "home"; this.render(el); };
      el.querySelectorAll("[name=pubPreset]").forEach((r) => (r.onchange = () => { s.preset = r.value; }));
      el.querySelector("#pubName").oninput = (ev) => { s.name = ev.target.value; }; el.querySelector("#pubVenue").oninput = (ev) => { s.venue = ev.target.value; };
      el.querySelectorAll("[data-col]").forEach((b) => (b.onclick = () => { s.color = b.dataset.col; GDC_PUB.applyTheme(s.color); el.querySelectorAll("[data-col]").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); }));
      el.querySelector("#pubGo").onclick = () => this.create();
    }
  },
  create() {
    const s = this.sel, clean = (v) => String(v || "").replace(/[<>&"]/g, "").trim().slice(0, 60), d = new Date();
    const name = clean(s.name) || `Sessione del ${d.getDate()}/${d.getMonth() + 1}`;
    GDC_RT.Pair.save({ u: GDC_PUB.CFG.u, k: GDC_PUB.CFG.k, c: GDC_RT.Pair.newChannel() });
    store.set("gdc.session", { name, start: Date.now(), activity: s.preset, venue: clean(s.venue), color: s.color });
    store.set(CAM_KEY, []); store.set("gdc.rejected", []); store.set("gdc.addOpenNext", true);
    dbg("info", "pubblica", `sessione creata: “${name}”`, { tipo: s.preset, colore: s.color, locale: clean(s.venue) });
    location.reload();
  },
};
document.addEventListener("gdcmode", () => PubUI.sync());
PubUI.sync();
