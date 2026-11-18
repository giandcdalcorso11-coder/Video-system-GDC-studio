"use strict";
/* ===== Schermo nero ===== */
function setStandby(on) {
  standby = !!on; const b = $("blackout"); b.classList.toggle("on", standby); b.style.display = standby ? "block" : "none";
  const cs = getComputedStyle(b), r = b.getBoundingClientRect();
  dbg("info", `schermo nero ${standby ? "attivato" : "disattivato"}`, { display: cs.display, z: cs.zIndex, rect: [Math.round(r.width), Math.round(r.height)], finestra: [innerWidth, innerHeight] });
  publish();
}
