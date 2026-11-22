"use strict";
/* ===== Interfaccia ===== */
function syncForm() { $("fAuto").checked = !!cfg.autoCam; $("fDev").value = cfg.device; $("fName").value = cfg.name; $("fRes").value = cfg.res; $("fBps").value = String(cfg.bps); }
$("fDev").onchange = $("fName").onchange = () => { cfg.device = $("fDev").value.trim() || cfg.device; cfg.name = $("fName").value.trim() || cfg.name; store.set("gdc.camCfg", cfg); rt?.setMeta({ name: cfg.name, device: cfg.device }); publish(); };
$("fRes").onchange = $("fBps").onchange = async () => { if (recording) { syncForm(); return; } cfg.res = $("fRes").value; cfg.bps = Number($("fBps").value); store.set("gdc.camCfg", cfg); if (stream) { try { await openCam(); } catch { /* ok */ } } publish(); };
$("camBtn").onclick = async () => { cfg.autoCam = true; store.set("gdc.camCfg", cfg); syncForm(); try { await openCam(); } catch { /* errore già mostrato */ } };
$("camStop").onclick = () => { cfg.autoCam = false; store.set("gdc.camCfg", cfg); syncForm(); dbg("info", "camera fermata a mano: avvio automatico disattivato"); stopCam(); };
$("fAuto").onchange = () => { cfg.autoCam = $("fAuto").checked; store.set("gdc.camCfg", cfg); dbg("info", `avvio automatico ${cfg.autoCam ? "attivato" : "disattivato"}`); if (cfg.autoCam) autoOpen("opzione attivata"); };
$("recLocal").onclick = () => (recording ? stopRec(true) : startRec());
$("recBtn").onclick = () => (recording ? stopRec(true) : startRec());
$("blackBtn").onclick = () => setStandby(true);
$("blackout").onclick = () => { const n = Date.now(); if (n - lastTapT < 400) setStandby(false); lastTapT = n; };
const batReq = (extra) => ({ url: pairing.u.replace(/\/$/, "") + "/realtime/v1/api/broadcast", body: JSON.stringify({ messages: [{ topic: "gdc-" + pairing.c, event: "battery", payload: { id: ID, ...extra }, private: false }] }) });
$("batInfo").onclick = () => {
  if (!pairing) return; const r = (x) => batReq(x).body, L = "LIVELLO";
  copyText(`DATI PER COMANDI — camera ${cfg.name} (${ID})\n\nURL:\n${batReq({}).url}\n\nMetodo: POST\nIntestazioni:\napikey: ${pairing.k}\nAuthorization: Bearer ${pairing.k}\nContent-Type: application/json\n\nTESTO A (solo livello: soglie e apertura Safari):\n${r({ level: L }).replace('"' + L + '"', "LIVELLO")}\n\nTESTO B (caricabatterie collegato):\n${r({ level: L, charging: true }).replace('"' + L + '"', "LIVELLO")}\n\nTESTO C (caricabatterie scollegato):\n${r({ level: L, charging: false }).replace('"' + L + '"', "LIVELLO")}\n\nIn ogni testo sostituisci la parola LIVELLO con la variabile "Livello batteria" (senza virgolette).\n`, $("batInfo"));
};
$("batTest").onclick = async () => {
  if (!pairing) return; const q = batReq({ level: bat.level ?? 0, test: true }); dbg("info", `prova invio batteria come Comandi (${q.url})`);
  try { const res = await fetch(q.url, { method: "POST", headers: { apikey: pairing.k, Authorization: "Bearer " + pairing.k, "Content-Type": "application/json" }, body: q.body }); const tx = await res.text().catch(() => ""); dbg(res.ok ? "info" : "error", `prova invio batteria: HTTP ${res.status} ${tx.slice(0, 200)}`); $("batTest").textContent = res.ok ? "Inviata ✓ (HTTP " + res.status + ")" : "Errore HTTP " + res.status; }
  catch (e) { dbg("error", `prova invio batteria fallita: ${e.name}: ${e.message}`); $("batTest").textContent = "Errore: " + e.name; }
  setTimeout(() => ($("batTest").textContent = "Prova invio batteria"), 4000);
};
$("spaceTest").onclick = () => { spaceMeasure(); };
$("zoomTest").onclick = () => { zoomTest().catch((e) => dbg("error", `ZOOM test: ${e.name}: ${e.message}`)); };
$("myLink").onclick = () => { if (!pairing) return; copyText(GDC_RT.Pair.link("camera.html", pairing, ID), $("myLink")); };
$("pairBtn").onclick = () => { const p = GDC_RT.Pair.decode($("pairTxt").value); if (!p) { alert("Codice non valido"); return; } GDC_RT.Pair.save(p); location.reload(); };
$("dbgToggle").onclick = () => { dbgOpen = !dbgOpen; $("dbgPre").hidden = !dbgOpen; $("dbgToggle").textContent = dbgOpen ? "Nascondi" : "Mostra"; if (dbgOpen) renderDbg(); };
$("dbgCopy").onclick = () => copyText(`REGISTRO CAMERA ${PAGE_VERSION} · ID ${ID} (${idSrc.src}) · ${new Date().toISOString()}\n` + dbgBuf.map(fmtLine).join("\n"), $("dbgCopy"));

async function start() {
  const nav = performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
  dbg("info", `avvio ${PAGE_VERSION}`, { ua: navigator.userAgent, standalone: navigator.standalone === true, displayMode: matchMedia("(display-mode: standalone)").matches ? "standalone" : "browser", browserVero: /Safari\//.test(navigator.userAgent), schermo: `${screen.width}x${screen.height}@${devicePixelRatio}`, finestra: `${innerWidth}x${innerHeight}`, lingua: navigator.language, fuso: Intl.DateTimeFormat().resolvedOptions().timeZone, core: navigator.hardwareConcurrency, online: navigator.onLine, referrer: document.referrer || "(nessuno)", navigazione: nav ? nav.type : "?", storiaPagine: history.length, mock: MOCK });
  dbg("info", `identità camera: ${ID} (origine: ${idSrc.src})`, { linkId: hashPair?.linkId || null, localStorage: !!store.get("gdc.camId", null), cookie: !!getCookie("gdc_camid"), cookieAbilitati: navigator.cookieEnabled, fp: FP });
  const lsOk = store.set("gdc.test", Date.now()); dbg(lsOk ? "info" : "error", `localStorage ${lsOk ? "ok" : "NON scrivibile"}`);
  try { if (navigator.storage?.persisted) dbg("info", `archivio persistente: ${await navigator.storage.persisted()}`); } catch { /* ok */ }
  pairing = hashPair || (window.GDC_RT && GDC_RT.Pair.load()) || null;
  dbg("info", `abbinamento: ${pairing ? "presente, canale …" + String(pairing.c).slice(-4) + (hashPair ? " (da link)" : " (memorizzato)") : "assente"}`);
  if (window.GDC_DEV) GDC_DEV.init({ role: "camera", dev: () => ID, ver: PAGE_VERSION, pairing, log: (l, m) => dbg(l, m), backlog: () => dbgBuf.slice(-300), host: $("modeHost") });
  batProbe(); deviceProbe().catch((e) => dbg("warn", `sonda dispositivo: ${e.name}: ${e.message}`));
  welcomePending = !!(pairing && FIRST);
  $("pairBox").hidden = !!pairing; { const end = store.get("gdc.ended", null); if (!pairing && end) { $("pairEnded").hidden = false; $("pairEnded").textContent = end.msg; } else { $("pairEnded").hidden = true; if (pairing && end) store.set("gdc.ended", null); } }
  $("welcome").hidden = !welcomePending; $("main").hidden = !pairing || welcomePending; $("statPanel").hidden = !pairing || welcomePending; $("dbgPanel").hidden = false;
  syncForm(); renderStat();
  await db.selfTest(); await loadSessions(); recoverOrphans();
  spaceTick(); setInterval(spaceTick, 8000);
  if (!pairing) return;
  if (welcomePending) { dbg("info", "prima apertura: mostro la schermata di benvenuto (nome e permessi)"); return; }
  await goOnline();
}
let netBad = 0, regiaPresente = false, regiaVista = Date.now(), orphanShown = false;
/* nessuna regia sul canale: succede se la sessione è cambiata mentre questo telefono era spento, o se la regia è chiusa.
   Dopo 90 s (con il collegamento attivo) lo dico chiaramente; la camera non si scollega da sola: lo decide chi la usa */
function orphanCheck() {
  const connected = rt && /^connesso/.test(rt.status), quiet = Date.now() - regiaVista, bad = connected && !regiaPresente && quiet > 90000;
  if (bad !== orphanShown) { orphanShown = bad; $("orphanBar").hidden = !bad; dbg(bad ? "warn" : "info", bad ? `nessuna regia sul canale da ${Math.round(quiet / 1000)} s: avviso la persona` : "la regia è tornata"); }
  if (bad) $("orphanTxt").textContent = `Da ${quiet >= 120000 ? Math.round(quiet / 60000) + " minuti" : Math.round(quiet / 1000) + " secondi"} nessuna regia comanda questa camera. Se la regia è accesa ma ha creato una nuova sessione, tocca qui sotto e inquadra il QR nuovo. Le clip già registrate restano sul telefono.${recording ? " La registrazione in corso continua." : ""}`;
}
function leaveSession(msg) {
  dbg("warn", `esco dalla sessione: ${msg}`); store.set("gdc.ended", { at: Date.now(), msg });
  try { GDC_RT.Pair.clear(); } catch { /* ok */ } try { rt && rt.close(); } catch { /* ok */ }
  setTimeout(() => location.replace(location.pathname + location.search), 400);
}
$("orphanBtn").onclick = () => { if (recording && !confirm("C'è una registrazione in corso: se scolleghi, si ferma e la clip resta sul telefono. Continuo?")) return; (async () => { if (recording) { stopRec(); for (let i = 0; i < 20 && recording; i++) await sleep(250); } leaveSession("camera scollegata da te: inquadra il QR valido della regia."); })(); };
function attachRt() {
  rt = GDC_RT.connect({ pairing, role: "camera", id: ID, meta: { name: cfg.name, device: cfg.device, fp: FP }, mock: MOCK, log: (l, m) => dbg(l, "rt: " + m) });
  rt.onStatus((s) => { $("connTxt").textContent = s; renderStat(); });
  rt.onPeers((list) => { const n = list.filter((p) => p.role === "dashboard").length; if (n && !regiaPresente) dbg("info", "regia presente sul canale"); if (n) { regiaVista = Date.now(); regiaPresente = true; } else regiaPresente = false; });
  rt.on("battery", (m) => { if (m && m.test) { dbg("info", "prova di invio ricevuta dal canale: valore di prova, non salvato"); return; } if (m && (!m.id || m.id === ID)) setBat(m.level, m.charging, "Comandi"); else dbg("trace", `batteria ignorata (id ${m && m.id})`); }); rt.on("xrtc", (m) => { if (m && m.to === ID) GDC_XFER.signal(m); }); rt.on("cmd", cmdGate); rt.on("rtc", onRtc); rt.on("hello", () => { dbg("info", "hello dalla dashboard"); publish(); });
}
async function goOnline() {
  attachRt();
  setInterval(() => { if (!rt) return; if (/^connesso/.test(rt.status)) { netBad = 0; return; } netBad += 10; if (netBad >= 60) { netBad = 0; dbg("warn", `collegamento giù da oltre 60 s (${rt.status}): lo ricreo`); try { rt.close(); } catch { /* ok */ } attachRt(); publish(); } }, 10000);
  addEventListener("online", () => { if (rt && !/^connesso/.test(rt.status)) { dbg("info", "rete tornata: ricreo il collegamento"); try { rt.close(); } catch { /* ok */ } attachRt(); } });
  setInterval(publish, 2000); setInterval(flushDbg, 1500); setInterval(orphanCheck, 5000); publish();
  setInterval(() => $("stat").children.length && renderStat(), 1000);
  navigator.mediaDevices?.addEventListener?.("devicechange", () => { AudioDiag.devChange = Date.now(); AudioDiag.devs().then((d) => dbg("info", "dispositivi multimediali cambiati", d)); });
  try { const a = navigator.audioSession; dbg("info", `audioSession: ${AudioDiag.as()}`); if (a && a.addEventListener) a.addEventListener("statechange", () => dbg("warn", `audioSession cambiata: ${AudioDiag.as()}`)); } catch { /* ok */ }
  autoOpen("apertura pagina");
}
$("wGo").onclick = async () => {
  const n = $("wName").value.trim(); if (n) cfg.name = n.slice(0, 30); cfg.autoCam = true; store.set("gdc.camCfg", cfg); store.set("gdc.welcomed", true); welcomePending = false;
  dbg("info", `benvenuto completato: nome "${cfg.name}"`); $("welcome").hidden = true; $("main").hidden = false; $("statPanel").hidden = false; syncForm(); renderStat();
  await goOnline(); // l'avvio della camera parte da goOnline (stesso tocco)
};
postazioneAvvio();
start();
