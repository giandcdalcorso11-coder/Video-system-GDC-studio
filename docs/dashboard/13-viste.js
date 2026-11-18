"use strict";
const mergeBanner = () => {
  const x = suggestMerge; if (!x || !camById(x.oldId) || !camById(x.newId)) return "";
  const o = esc(camTitle(camById(x.oldId))), n = esc(camTitle(camById(x.newId)));
  return `<section class="panel" style="margin-bottom:16px;border-color:var(--warn)"><b>Stesso telefono?</b><div class="muted" style="margin:4px 0 8px">“${n}” (nuova, online) sembra lo stesso telefono di “${o}” (offline): stesso modello e impostazioni.</div><button id="mergeYes" class="primary">Unisci e tieni il nome “${o}”</button><button id="mergeNo" class="ghost">Sono due telefoni diversi</button></section>`;
};
function mergeCams() {
  const x = suggestMerge, o = x && camById(x.oldId), n = x && camById(x.newId); suggestMerge = null; if (!o || !n) return;
  dbg("info", "camere", `unisco ${x.oldId} in ${x.newId}: tengo il nome "${camTitle(o)}"`);
  n.device = o.device; n.name = o.name; transport.remove(o.id); delete state[o.id]; cameras = cameras.filter((c) => c.id !== o.id); saveCams();
  transport.send(n.id, { cmd: "rename", name: n.name, device: n.device }); log(n.id, `${camTitle(n)}: unita alla camera precedente`); route();
}
function showHome() {
  Preview.stopAll();
  $("#view").innerHTML = `
    ${mergeBanner()}
    ${staleBanner()}
    ${Join.panel()}
    ${Marks.panel()}
    <section class="panel" id="preflight" hidden></section>
    <section class="tiles" id="sum" aria-label="Riepilogo">
      <div class="tile"><small>Camere online</small><b id="sOnline">—</b></div>
      <div class="tile"><small>In registrazione</small><b id="sRec">0</b></div>
      <div class="tile"><small>Batteria minima</small><b id="sBat">—</b></div>
      <div class="tile"><small>Spazio minimo</small><b id="sFree">—</b></div>
    </section>
    <section class="grid" id="homeGrid">
      ${cameras.map((c) => `
      <article class="card click" data-cam="${c.id}" data-bind="card" data-go="${c.id}">
        <div class="card-h"><b data-bind="title" data-cam="${c.id}"></b><span class="pill" data-bind="pill" data-cam="${c.id}"></span></div>
        <div class="card-b">
          ${previewHtml(c.id, "mini")}
          <div class="info">
            <div class="kv"><small>Batteria</small>
              <div class="bat"><div class="bar" data-bind="batBar" data-cam="${c.id}"><i></i></div><b data-bind="batTxt" data-cam="${c.id}"></b></div>
              <div class="warn" data-bind="batWarn" data-cam="${c.id}"></div></div>
            <div class="kv"><small>Memoria camera</small><span data-bind="free" data-cam="${c.id}"></span></div>
            <div class="kv"><small>Registrazione</small><span data-bind="timer" data-cam="${c.id}"></span></div>
          </div>
        </div>
        <div class="card-f">
          <button class="primary" data-bind="recBtn" data-cam="${c.id}" data-act="rec_start">● REC</button>
          <button data-bind="stopBtn" data-cam="${c.id}" data-act="rec_stop">■ STOP</button>
          <button class="ghost" data-go="${c.id}">Dettagli</button>
        </div>
      </article>`).join("")}
      ${REAL ? `<div class="muted" style="padding:14px">${cameras.length ? "" : "Nessuna camera collegata. Sul telefono apri il link di abbinamento (pagina camera) e tocca “Avvia camera”."}</div>` : `<button class="add" id="addCam">+ Aggiungi camera (simulata)</button>`}
    </section>
    <section class="panel adv-only" style="margin-top:16px"><h2>Collegamento</h2>${connPanel()}</section>
    ${logPanel("")}`;
  curDetail = null; setConn(connStatus); renderPreflight(); Join.draw();
  $("#view").onclick = async (e) => {
    if (e.target.id === "homePrev") { store.set("gdc.homePrev", e.target.checked); dbg("info", "ui", `anteprime nella home: ${e.target.checked ? "attive" : "spente"}`); Preview.stopAll(); Preview.ensureAll(); return; }
    if (e.target.closest("#mergeYes")) { mergeCams(); return; }
    if (e.target.closest("#mergeNo")) { dbg("info", "camere", "unione rifiutata dall'utente"); suggestMerge = null; showHome(); return; }
    if (e.target.closest("#cpCam") || e.target.closest("#cpDash")) { const link = GDC_RT.Pair.link(e.target.closest("#cpCam") ? "camera.html" : "dashboard.html", pairing); try { await navigator.clipboard.writeText(link); e.target.textContent = "Copiato ✓"; } catch { prompt("Copia questo link", link); } return; }
    if (e.target.closest("#newCh")) { if (confirm("Creo un nuovo canale: i link già inviati ai telefoni smetteranno di funzionare. Continuare?")) { GDC_RT.Pair.save({ u: pairing.u, k: pairing.k, c: GDC_RT.Pair.newChannel() }); /* le chiavi della regia si rifanno al riavvio */ location.reload(); } return; }
    if (e.target.closest("#unpair")) { if (confirm("Scollego questa dashboard dal canale?")) { GDC_RT.Pair.clear(); location.reload(); } return; }
    if (e.target.closest("#pairBtn")) { const p = GDC_RT.Pair.decode($("#pairTxt").value); if (!p) { alert("Codice non valido"); return; } GDC_RT.Pair.save(p); location.reload(); return; }
    const act = e.target.closest("[data-act]");
    if (act) { command(act.dataset.cam, { cmd: act.dataset.act }); return; }
    const go = e.target.closest("[data-go]");
    if (go) location.hash = "#/cam/" + go.dataset.go;
    if (e.target.closest("#addCam")) addCamera();
  };
  applyLogTab(); refresh(); Preview.ensureAll();
}

function showDetail(id) {
  Preview.stopAll();
  const c = camById(id);
  $("#view").innerHTML = `
    <a class="back" href="#/">‹ Tutte le camere</a>
    <div class="row" style="justify-content:space-between;margin-bottom:12px">
      <h1 style="font-size:20px" data-bind="title" data-cam="${id}"></h1><span class="pill" data-bind="pill" data-cam="${id}"></span>
    </div>
    <div class="detail">
      <div>
        <div class="panel" data-bind="card" data-cam="${id}">
          ${previewHtml(id, "big")}
          <div class="ctl">
            <div class="btns">
              <button class="primary" data-bind="recBtn" data-cam="${id}" data-act="rec_start">● REC</button>
              <button data-bind="stopBtn" data-cam="${id}" data-act="rec_stop">■ STOP</button>
              ${REAL ? `<button class="ghost" data-bind="standbyBtn" data-cam="${id}" data-act="standby">Schermo nero</button>` : `<button class="ghost" data-cam="${id}" data-act="webcam">Usa webcam di questo PC (test)</button>`}
            </div>
            <div class="adv-only">
              <div class="pad" role="group" aria-label="Movimento (segnaposto)">
                <span></span><button data-m="0,${STEP}" aria-label="Su">▲</button><span></span>
                <button data-m="-${STEP},0" aria-label="Sinistra">◀</button><button class="home" data-act="home">⌂</button><button data-m="${STEP},0" aria-label="Destra">▶</button>
                <span></span><button data-m="0,-${STEP}" aria-label="Giù">▼</button><span></span>
              </div>
              <div class="muted" style="text-align:center;margin-top:4px">movimenti: segnaposto</div>
            </div>
          </div>
        </div>
      </div>
      <div>
        <div class="panel"><h2>Stato</h2>
          <div class="kvs">
            <div class="kv"><small>Registrazione in corso</small><span data-bind="timer" data-cam="${id}"></span></div>
            <div class="kv"><small>Connessione</small><span data-bind="conn" data-cam="${id}"></span></div>
            <div class="kv adv-only"><small>Pan / Tilt</small><span data-bind="pos" data-cam="${id}"></span></div>
            <div class="kv adv-only"><small>Schermo del telefono</small><span data-bind="screen" data-cam="${id}"></span></div>
          </div></div>
        <div class="panel"><h2>Batteria</h2>
          <div class="bat"><div class="bar" data-bind="batBar" data-cam="${id}"><i></i></div><b data-bind="batTxt" data-cam="${id}"></b></div>
          <div class="row" style="margin-top:8px;justify-content:space-between"><span class="muted" data-bind="batState" data-cam="${id}"></span><span class="warn" data-bind="batWarn" data-cam="${id}"></span>
            <button class="ghost" data-bind="chargeBtn" data-cam="${id}" data-act="charge"></button></div></div>
        <div class="panel"><h2>Spazio</h2>
          <div class="kv"><span data-bind="freeLong" data-cam="${id}"></span></div>
          <div class="muted" data-bind="freeEst" data-cam="${id}" style="font-weight:600;margin-top:4px"></div>
          ${REAL ? `<div data-bind="stationUi" data-cam="${id}"><label class="f" style="display:flex;gap:8px;align-items:flex-start;margin:12px 0 4px"><input type="checkbox" id="stationChk" style="width:auto;min-height:0;margin-top:3px"><span>Postazione fissa: se la camera si blocca o la pagina si chiude, riprende da sola a registrare</span></label><div class="muted" style="margin:0 0 4px 26px;font-size:13px">Vale solo se hai avviato la registrazione da qui. Si ferma con STOP. Il recupero dei file dopo un blocco è sempre attivo.</div></div>
          <div data-bind="autoFreeUi" data-cam="${id}"><label class="f" style="display:flex;gap:8px;align-items:flex-start;margin:12px 0 4px"><input type="checkbox" id="autoFree" style="width:auto;min-height:0;margin-top:3px"><span>Se lo spazio sta finendo, elimina le clip più vecchie già trasferite e verificate</span></label>
            <div class="muted">Predefinito: spenta. In quel caso la camera si ferma in modo sicuro e avvisa. Le clip non ancora trasferite non vengono mai eliminate.</div></div>
          <div class="muted adv-only" data-bind="spaceNote" data-cam="${id}" style="margin-top:6px"></div>` : ""}</div>
        <div class="panel"><h2>Ripresa</h2>
          <div class="kvs">
            <div class="kv"><small>Qualità</small><span data-bind="res" data-cam="${id}"></span></div>
            <div class="kv adv-only"><small>Orientamento</small><span data-bind="orient" data-cam="${id}"></span></div>
          </div>${REAL ? `<div class="row" style="margin-top:8px"><select id="cfgRes"><option>720p</option><option selected>1080p</option><option>4K</option></select><select id="cfgBps"><option value="8000000">8 Mbps</option><option value="20000000" selected>20 Mbps</option><option value="40000000">40 Mbps</option></select><button class="ghost" id="cfgApply">Applica al telefono</button></div><div class="muted" style="margin-top:6px">Il bitrate è un tetto: con scene ferme il file può pesare meno.</div>` : `<div class="muted" style="margin-top:6px">Modalità simulazione: impostazioni non modificabili.</div>`}</div>
        ${REAL ? `<div class="panel" data-bind="xferUi" data-cam="${id}"></div>` : ""}
        ${REAL ? `<div class="panel adv-only" data-bind="proUi" data-cam="${id}"></div>` : ""}
        ${REAL ? `<div class="panel" data-bind="zoomUi" data-cam="${id}"><h2>Zoom</h2>
          <div class="row" style="gap:10px;align-items:center"><input type="range" id="zSlider" min="1" max="3" step="0.1" value="1" style="flex:1" disabled><b id="zVal" style="min-width:52px;text-align:right">—</b></div>
          <div class="row" style="margin-top:8px">${[0.5, 1, 2, 3, 5].map((z) => `<button class="ghost zb" data-z="${z}" disabled>${z}×</button>`).join("")}</div>
          <div class="muted" id="zNote" style="margin-top:6px"></div></div>` : ""}
        ${REAL ? `<div class="panel"><h2>Time-lapse</h2>
          <div class="row" style="gap:8px;align-items:flex-end">
            <label class="f" style="flex:1;min-width:150px">Modalità<select id="tlMode"><option value="auto">Automatica (come iPhone)</option><option value="man">Manuale</option></select></label>
            <label class="f" id="tlIntW" style="flex:1;min-width:150px" hidden>Immagini<select id="tlInt"><option value="0.5">2 al secondo</option><option value="1">1 al secondo</option><option value="2">1 ogni 2 s</option><option value="5" selected>1 ogni 5 s</option><option value="10">1 ogni 10 s</option><option value="30">1 ogni 30 s</option><option value="60">1 ogni 60 s</option></select></label>
            <label class="f" style="flex:1;min-width:110px">Video a<select id="tlFps"><option value="24">24 fps</option><option value="30" selected>30 fps</option></select></label>
            <label class="f" style="flex:1;min-width:110px">Qualità JPEG<select id="tlQ"><option value="0.8">Normale</option><option value="0.92" selected>Alta</option></select></label>
          </div>
          <div class="row"><button class="primary" data-bind="tlStartBtn" data-cam="${id}" data-act="tl_start">● Avvia time-lapse</button><button data-bind="tlStopBtn" data-cam="${id}" data-act="tl_stop">■ Ferma e crea il video</button></div>
          <div class="muted" id="tlHelp" style="margin-top:6px"></div>
          <div style="margin-top:8px" data-bind="tlStat" data-cam="${id}"></div>
          <div class="muted" style="margin-top:6px">Usa la qualità della camera impostata in “Ripresa”. Il video si crea sul telefono quando fermi il time-lapse (ci mette circa quanto dura il video).</div></div>` : ""}
        <div class="panel"><h2>Impostazioni camera</h2>
          <label class="f">Dispositivo<input type="text" id="fDev" value="${esc(c.device)}" maxlength="40"></label>
          <label class="f">Nome camera<input type="text" id="fName" value="${esc(c.name)}" maxlength="30"></label>
          <div class="muted adv-only">Sistema: ${esc(c.os)}</div><div class="muted adv-only" data-bind="clockNote" data-cam="${id}"></div>
          <div class="row" style="margin-top:10px">
            <button class="ghost adv-only" data-bind="connBtn" data-cam="${id}" data-act="toggleConn"></button>
            ${REAL ? `<button class="ghost adv-only" id="cpThis">Copia link di questa camera</button>` : ""}<button class="ghost" id="rmCam">Rimuovi camera</button>
          </div></div>
        <div class="panel"><h2>Clip della sessione</h2><ol class="list" data-bind="clips" data-cam="${id}"></ol></div>
        ${logPanel(id)}
      </div>
    </div>`;
  const v = $("#view");
  v.onclick = async (e) => {
    const m = e.target.closest("[data-m]");
    if (m) { const [pan, tilt] = m.dataset.m.split(",").map(Number); command(id, { cmd: "move", pan, tilt }); return; }
    const a = e.target.closest("[data-act]"); if (!a) return;
    const act = a.dataset.act;
    if (act === "toggleConn") command(id, { cmd: state[id].online ? "disconnect" : "connect" });
    else if (act === "charge") command(id, { cmd: "charge", on: !state[id].charging });
    else if (act === "webcam") toggleWebcam(id, a);
    else if (act === "standby") command(id, { cmd: "standby", on: !state[id].standby });
    else if (act === "tl_start") command(id, { cmd: "tl_start", mode: $("#tlMode").value, int: Number($("#tlInt").value), fps: Number($("#tlFps").value), q: Number($("#tlQ").value) });
    else if (act === "tl_stop") command(id, { cmd: "tl_stop" });
    else command(id, { cmd: act });
  };
  const rename = () => {
    c.device = $("#fDev").value.trim() || c.device; c.name = $("#fName").value.trim() || c.name;
    saveCams(); refresh(); if (REAL) transport.send(id, { cmd: "rename", name: c.name, device: c.device });
  };
  if (REAL) { const tlSync = () => { const auto = $("#tlMode").value === "auto"; $("#tlIntW").hidden = auto; $("#tlHelp").textContent = auto ? "Come l'iPhone: 2 immagini al secondo, poi l'intervallo raddoppia a 10, 20, 40 minuti scartando un'immagine su due. Il video dura circa 20-40 s a 30 fps." : "Intervallo fisso scelto da te."; }; $("#tlMode").onchange = tlSync; tlSync(); }
  if (REAL) $("#cpThis").onclick = (e) => copyText(GDC_RT.Pair.link("camera.html", pairing, id), e.currentTarget);
  if (REAL) { const sc = $("#stationChk"); if (sc) sc.onchange = () => command(id, { cmd: "station_cfg", on: sc.checked }); }
  if (REAL) { const af = $("#autoFree"); if (af) af.onchange = () => command(id, { cmd: "space_cfg", autoFree: af.checked }); }
  if (REAL) { let zT = 0; const zs = $("#zSlider"); const sendZ = () => command(id, { cmd: "zoom", z: Number(zs.value) });
    zs.oninput = () => { zDrag = true; $("#zVal").textContent = Number(zs.value).toFixed(1) + "×"; if (!zT) zT = setTimeout(() => { zT = 0; sendZ(); }, 100); };
    zs.onchange = () => { zDrag = false; sendZ(); };
    $$(".zb").forEach((b) => { b.onclick = () => command(id, { cmd: "zoom", z: Number(b.dataset.z) }); }); }
  if (REAL) $("#cfgApply").onclick = () => command(id, { cmd: "config", res: $("#cfgRes").value, bps: Number($("#cfgBps").value) });
  curDetail = id;
  $("#fDev").onchange = rename; $("#fName").onchange = rename;
  $("#rmCam").onclick = () => {
    if (!confirm(`Rimuovere ${camTitle(c)} dalla dashboard?`)) return;
    transport.remove(id); delete state[id]; cameras = cameras.filter((x) => x.id !== id); saveCams(); location.hash = "#/";
  };
  applyLogTab(); refresh(); Preview.ensureAll();
}

async function toggleWebcam(id, btn) {
  const vid = $(`[data-vid="${id}"]`), can = $(`[data-prev="${id}"]`), tag = $(`[data-tag="${id}"]`);
  if (vid.srcObject) {
    vid.srcObject.getTracks().forEach((t) => t.stop()); vid.srcObject = null; vid.hidden = true; can.hidden = false;
    tag.textContent = "SIMULATA"; btn.textContent = "Usa webcam di questo PC (test)"; return;
  }
  try {
    vid.srcObject = await navigator.mediaDevices.getUserMedia({ video: true });
    await vid.play(); vid.hidden = false; can.hidden = true; tag.textContent = "WEBCAM PC (TEST)"; btn.textContent = "Torna all'anteprima simulata";
  } catch (e) { log(id, "Webcam non disponibile (" + (e.name || "errore") + ")"); }
}

function addCamera() {
  const n = cameras.length + 1; let id = "cam" + n; while (camById(id)) id += "x";
  const cam = { id, device: "Nuovo telefono", name: "cam" + n, os: "—", totalGb: 64, freeGb: 20 };
  cameras.push(cam); saveCams(); transport.add(cam, 500); log(id, `${camTitle(cam)}: aggiunta (simulazione)`); showHome();
}
