"use strict";
/* ===== Pannello registri unico (tab: Registro / Attività avanzata) ===== */
let logTab = store.get("gdc.logTab", "basic"), logId = "";
const logPanel = (id) => { logId = id || ""; return `<section class="panel adv-only" id="logPanel">
  <div class="row" style="justify-content:space-between;margin-bottom:8px">
    <div class="tabs" role="tablist" aria-label="Registri"><button role="tab" data-tab="basic">Registro</button><button role="tab" data-tab="adv">Attività avanzata</button></div>
    <div class="row"><button class="ghost" data-logcopy>Copia</button><button class="ghost" data-logclear>Svuota</button></div>
  </div>
  <ol class="list" data-log="${esc(logId)}"></ol>
  <pre class="adv" id="advPre" hidden></pre>
</section>`; };
function applyLogTab() {
  const pn = $("#logPanel"); if (!pn) { advOpen = false; return; }
  advOpen = logTab === "adv";
  $$("[data-tab]", pn).forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === logTab)));
  $("ol.list", pn).hidden = advOpen; $("#advPre").hidden = !advOpen;
  if (advOpen) renderAdv(); else renderLogs();
}
document.addEventListener("click", (e) => {
  const tb = e.target.closest("[data-tab]"); if (tb) { logTab = tb.dataset.tab; store.set("gdc.logTab", logTab); dbg("info", "ui", `registro: scheda ${logTab === "adv" ? "attività avanzata" : "base"}`); applyLogTab(); return; }
  const cp = e.target.closest("[data-logcopy]"); if (cp) { copyText(logTab === "adv" ? advText() : logsText(logId), cp); return; }
  const cl = e.target.closest("[data-logclear]"); if (cl) { if (logTab === "adv") { adv.length = 0; dbg("info", "registro", "registro avanzato svuotato"); } else { logs.length = 0; } applyLogTab(); }
});
