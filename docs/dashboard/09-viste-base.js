"use strict";
/* ===== Viste ===== */
const previewHtml = (id, cls) => `
  <div class="view ${cls}" data-cam="${id}">
    <canvas data-prev="${id}" width="360" height="640"></canvas>
    <video data-vid="${id}" muted playsinline hidden></video>
    <span class="tag" data-tag="${id}">${REAL ? "ANTEPRIMA NON ATTIVA" : "SIMULATA"}</span>
    <span class="recbadge"><i></i><span data-bind="badge" data-cam="${id}">00:00</span></span>
    <div class="off">Camera non connessa</div>
  </div>`;

const connPanel = () => REAL
  ? `<div class="kvs"><div class="kv"><small>Stato</small><span id="connTxt">${esc(connStatus)}</span></div><div class="kv"><small>Canale</small><span>…${esc(pairing.c.slice(-4))}</span></div></div>
     <div class="row" style="margin-top:10px"><button id="cpCam">Copia link camera</button><button id="cpDash">Copia link dashboard</button><button class="ghost" id="newCh">Nuovo canale</button><button class="ghost" id="unpair">Scollega</button></div>
     <label style="display:flex;gap:8px;align-items:center;margin-top:10px"><input type="checkbox" id="homePrev" ${store.get("gdc.homePrev", true) ? "checked" : ""} style="width:auto;min-height:0"> Anteprime live nella home</label><div class="muted" style="margin-top:6px">I link contengono il codice segreto: non condividerli. Il link della dashboard contiene anche la chiave della regia (firma i comandi): non darlo ai telefoni. Chiave: ${pairing.d ? "presente" : pairing.p ? "solo pubblica (questa regia non può comandare le camere protette)" : "in preparazione"}.</div>`
  : `<div class="muted">Modalità simulazione. Per collegare camere vere apri il link di abbinamento oppure incolla qui il codice (inizia con gdc1.).</div>
     <textarea id="pairTxt" rows="2" style="width:100%;margin-top:8px" placeholder="gdc1.…"></textarea><button id="pairBtn" style="margin-top:8px">Abbina</button>`;
