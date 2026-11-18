"use strict";
/* ===== Postazione fissa: si riprende da sola dopo blocchi ===== */
let wantRec = store.get("gdc.wantRec", false), lastResume = 0, reopenFails = 0, reopenAt = 0;
function setWant(v) { wantRec = !!v; store.set("gdc.wantRec", wantRec); }
setInterval(async () => {
  const now = Date.now();
  // la camera deve restare accesa (se non è stata fermata a mano)
  if (cfg.autoCam && !stream && !opening && !recording && pairing && !welcomePending && now >= reopenAt) { dbg("info", `controllo periodico: la camera è spenta, provo a riaccenderla (tentativo ${reopenFails + 1})`); await autoOpen("controllo periodico"); reopenFails = stream ? 0 : reopenFails + 1; reopenAt = Date.now() + Math.min(60000, 8000 * (reopenFails + 1)); }
  // postazione fissa: la registrazione richiesta dalla regia riprende dopo un'interruzione
  if (cfg.station && wantRec && stream && !recording && !tl && now - lastResume > 20000 && joinState !== "no") { lastResume = now; dbg("warn", "postazione fissa: la registrazione era richiesta ma non è in corso: la riavvio"); await startRec(); if (!recording) { dbg("error", `postazione fissa: riavvio non riuscito: ${lastErr}`); if (/Spazio/.test(lastErr)) setWant(false); } }
}, 4000);
