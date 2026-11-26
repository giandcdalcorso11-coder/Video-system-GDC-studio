"use strict";
/* ===== Modalità Pubblica (test): schermata d'ingresso della camera =====
   Senza un abbinamento spiega in tre passi come entrare; il resto (nome, permessi, accettazione dalla regia) è il percorso di sempre. */
const PubCam = {
  skip: false,
  sync() {
    const on = !!window.GDC_PUB && GDC_PUB.active(); let el = document.getElementById("pubHome");
    const need = on && !pairing && !this.skip;
    if (!need) { if (el) el.remove(); return; }
    GDC_PUB.ensureCss(); if (!el) { el = document.createElement("div"); el.id = "pubHome"; document.body.appendChild(el); }
    el.innerHTML = `<div class="wrap"><h1>Video System GDC Studio</h1><p class="sub">Questo telefono sarà una camera.</p>
      <ol><li>Sulla <b>regia</b> (iPad o computer) tocca <b>“Aggiungi camera”</b> e mostra il QR.</li><li>Con la fotocamera di questo telefono <b>inquadra il QR</b>: si apre questa pagina già collegata.</li><li>Dai un nome alla camera, consenti fotocamera e microfono e tocca <b>Avvia</b>.</li></ol>
      <button class="big" id="pubCode"><b>Ho un codice scritto</b><span>Se non riesci a inquadrare il QR, incolla il codice che inizia con gdc1.</span></button>
      <button class="big" id="pubRegiaLink"><b>Sono la regia</b><span>Voglio creare una sessione e comandare le camere.</span></button>
      <p class="note">Modalità di prova: vengono inviati dati tecnici sul funzionamento (modello, browser, rete, errori). Nessuna foto, video o audio.</p></div>`;
    el.querySelector("#pubCode").onclick = () => { this.skip = true; this.sync(); };
    el.querySelector("#pubRegiaLink").onclick = () => { dbg("info", "pubblica", "scelta: regia"); location.href = "dashboard.html"; };
  },
};
document.addEventListener("gdcmode", () => PubCam.sync());
PubCam.sync();
