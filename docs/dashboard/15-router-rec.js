"use strict";
/* ===== Router ===== */
function route() {
  curDetail = null;
  dbg("info", "ui", `vista: ${location.hash || "#/"}`);
  const m = location.hash.match(/^#\/cam\/(.+)$/);
  if (m && camById(m[1])) showDetail(m[1]); else showHome();
  window.scrollTo(0, 0);
}
addEventListener("hashchange", route);

/* ===== REC globale + scorciatoia ===== */
$("#recAll").onclick = () => cameras.forEach((c) => (REAL ? Mode.start(c.id) : state[c.id]?.online && !state[c.id].rec && command(c.id, { cmd: "rec_start" })));
$("#stopAll").onclick = () => cameras.forEach((c) => (REAL ? Mode.stop(c.id) : state[c.id]?.rec && command(c.id, { cmd: "rec_stop" })));
document.addEventListener("keydown", (e) => {
  if (e.target.closest("input,textarea") || e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key.toLowerCase() === "m" && REAL) { Marks.add(); return; }
  if (e.key.toLowerCase() === "r") { const b = $("#recAll").disabled ? $("#stopAll") : $("#recAll"); if (!b.disabled) b.click(); }
});
setInterval(() => {
  const recs = cameras.map((c) => state[c.id]).filter((s) => s && s.rec);
  $("#globalTimer").textContent = recs.length ? fmtTime(Date.now() - Math.min(...recs.map((s) => s.recStart))) : "00:00";
  $$('[data-bind="timer"],[data-bind="badge"]').forEach((el) => BIND[el.dataset.bind](state[el.dataset.cam] || {}, null, el));
  if (typeof Xfer !== "undefined" && REAL) Xfer.renderGlobal();
}, 250);
