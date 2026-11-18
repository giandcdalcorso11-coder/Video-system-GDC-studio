"use strict";
/* ===== Permessi delle camere e modo di ripresa ===== */
// Permesso: il telefono può avviare e fermare la registrazione da solo. Il valore voluto sta nel record di ogni camera (c.localRec)
// e si rimanda alla camera se il suo stato dice altro; "per tutte" lo imposta su tutte e sulle camere che entreranno.
const Perm = {
  all: store.get("gdc.permAll", false), syncAt: {},
  setCam(id, v) { const c = camById(id); if (!c) return; c.localRec = !!v; saveCams(); command(id, { cmd: "perm_cfg", localRec: !!v }); dbg("info", "camere", `${id}: la camera ${v ? "può" : "non può"} avviare e fermare da sola`); this.render(); },
  setAll(v) { this.all = !!v; store.set("gdc.permAll", this.all); cameras.forEach((c) => { c.localRec = this.all; }); saveCams(); cameras.forEach((c) => state[c.id] && state[c.id].online && command(c.id, { cmd: "perm_cfg", localRec: this.all })); dbg("info", "camere", `tutte le camere ${this.all ? "possono" : "non possono"} avviare e fermare da sole`); refresh(); },
  sync(c, st) { if (c.localRec === undefined || st.localRec === c.localRec) return; const now = Date.now(); if (now - (this.syncAt[c.id] || 0) < 20000) return; this.syncAt[c.id] = now; transport.send(c.id, { cmd: "perm_cfg", localRec: !!c.localRec }); },
  panel() {
    if (!REAL) return "";
    return `<section class="panel" id="permPanel"><label style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="permAllChk" style="width:auto;min-height:0"> Tutte le camere possono avviare e fermare la registrazione da sole</label>
      <div class="muted" style="margin:2px 0 0 26px;font-size:13px">Spenta, comanda solo la regia. Vale anche per i telefoni che entreranno; si può cambiare camera per camera nel dettaglio. L'ultima parola è sempre della regia: il suo STOP ferma ogni camera.</div></section>`;
  },
  render() { const c = $("#permAllChk"); if (!c) return; const v = cameras.map((x) => !!x.localRec), n = v.filter(Boolean).length; c.checked = v.length ? n === v.length : this.all; c.indeterminate = n > 0 && n < v.length; },
};
// Modo di ripresa di ogni camera: Video o Time-lapse. REC tutte e STOP tutte fanno partire e fermare ogni camera nel suo modo.
const Mode = {
  of(c) { return c && c.mode === "timelapse" ? "timelapse" : "video"; },
  tl(c) { return { mode: "auto", int: 5, fps: 30, q: 0.92, ...((c && c.tl) || {}) }; },
  setMode(id, m) { const c = camById(id); if (!c) return; c.mode = m === "timelapse" ? "timelapse" : "video"; saveCams(); dbg("info", "camere", `${id}: modo di ripresa ${c.mode}`); refresh(); },
  saveTl(id, patch) { const c = camById(id); if (!c) return; c.tl = { ...this.tl(c), ...patch }; saveCams(); },
  start(id) { const c = camById(id), st = state[id]; if (!c || !st || !st.online || st.rec || st.tl) return; if (this.of(c) === "timelapse") { const t = this.tl(c); command(id, { cmd: "tl_start", mode: t.mode, int: t.int, fps: t.fps, q: t.q }); } else command(id, { cmd: "rec_start" }); },
  stop(id) { const st = state[id]; if (!st) return; if (st.rec) command(id, { cmd: "rec_stop" }); else if (st.tl && st.tl.stage === "shooting") command(id, { cmd: "tl_stop" }); },
  busy(st) { return !!(st && (st.rec || (st.tl && st.tl.stage === "shooting"))); },
};
document.addEventListener("change", (e) => {
  if (e.target.id === "permAllChk") { Perm.setAll(e.target.checked); return; }
  const lc = e.target.closest("#localRecChk"); if (lc) { Perm.setCam(lc.closest("[data-cam]").dataset.cam, lc.checked); return; }
  const ms = e.target.closest("#modeSel"); if (ms) { Mode.setMode(ms.closest("[data-cam]").dataset.cam, ms.value); }
});
