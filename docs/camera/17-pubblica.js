"use strict";
/* ===== Modalità Pubblica (test): schermata d'ingresso della camera (grafica dal mockup "Entra in una sessione") =====
   Senza un abbinamento spiega come entrare; il resto (nome, permessi, accettazione dalla regia) è il percorso di sempre, con il tema scuro. */
const PubCam = {
  skip: false,
  sync() {
    const on = !!window.GDC_PUB && GDC_PUB.active(); if (on) GDC_PUB.ensureCss(); let el = document.getElementById("pubHome");
    const need = on && !pairing && !this.skip;
    if (!need) { if (el) el.remove(); return; }
    if (!el) { el = document.createElement("div"); el.id = "pubHome"; document.body.appendChild(el); }
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
};
document.addEventListener("gdcmode", () => PubCam.sync());
PubCam.sync();
