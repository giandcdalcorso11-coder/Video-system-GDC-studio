"use strict";
// ingresso di nuovi telefoni: QR + conferma (accetta / rifiuta) decisa dalla regia
// sessione: nome e "nuova sessione" (nuovo canale = nuovo QR, nuove chiavi, elenco camere vuoto)
const Session = {
  cur: store.get("gdc.session", null) || { name: "", start: Date.now() },
  label() { return this.cur.name ? this.cur.name : "Sessione senza nome"; },
  save() { store.set("gdc.session", this.cur); },
  rename(n) { this.cur.name = String(n || "").replace(/[<>&"]/g, "").trim().slice(0, 60); this.save(); this.paint(); dbg("info", "sessione", `nome: “${this.cur.name}”`); },
  paint() { const el = $("#sessTxt"); if (el) el.textContent = REAL ? this.label() + " · " : ""; },
  begin(name) {
    const old = { nome: this.cur.name, camere: cameras.length };
    this.cur = { name: String(name || "").replace(/[<>&"]/g, "").trim().slice(0, 60), start: Date.now() }; this.save();
    GDC_RT.Pair.save({ u: pairing.u, k: pairing.k, c: GDC_RT.Pair.newChannel() }); // senza chiavi: la regia ne crea di nuove al riavvio
    store.set(CAM_KEY, []); store.set("gdc.rejected", []);
    dbg("info", "sessione", `nuova sessione “${this.cur.name}”: nuovo canale, chiavi rifatte, elenco camere azzerato`, old);
    location.reload();
  },
};
const Join = {
  approve: store.get("gdc.approve", true), pending: {}, ok: new Set(), rejected: new Set(store.get("gdc.rejected", [])), greeted: {}, denied: {}, qrOpen: store.get("gdc.qrOpen", false),
  hold(m) {
    const now = Date.now(), p = this.pending[m.id]; this.pending[m.id] = { m, first: p ? p.first : now, seen: now };
    if (!p) { dbg("info", "camere", `richiesta di ingresso da ${m.id}`, { device: m.device, name: m.name, os: m.os, batteria: m.battery }); log("", `“${m.name || m.id}” (${m.device || "telefono"}) chiede di entrare`); this.render(); }
  },
  accept(id) { const p = this.pending[id]; if (!p) return; delete this.pending[id]; this.ok.add(id); dbg("info", "camere", `accettata ${id}`); transport.onCamState(p.m); /* crea la camera (con il suo numero) e le comunica l'ingresso */ if (camById(id)) { this.greeted[id] = 0; this.greet(id); } this.render(); },
  reject(id) { delete this.pending[id]; this.rejected.add(id); store.set("gdc.rejected", [...this.rejected]); this.denied[id] = Date.now(); transport.send(id, { cmd: "join_result", ok: false }); dbg("info", "camere", `rifiutata ${id}`); log("", "Telefono rifiutato"); this.render(); if (curDetail == null) route(); },
  greet(id) { const now = Date.now(); if (now - (this.greeted[id] || 0) > 60000) { this.greeted[id] = now; transport.send(id, { cmd: "join_result", ok: true, label: labelOf(id) }); } },
  deny(id) { const now = Date.now(); if (now - (this.denied[id] || 0) > 20000) { this.denied[id] = now; transport.send(id, { cmd: "join_result", ok: false }); } },
  sweep() { const now = Date.now(); let ch = false; for (const id in this.pending) if (now - this.pending[id].seen > 8000) { delete this.pending[id]; ch = true; } if (ch) this.render(); },
  render() {
    let el = $("#joinBar"); if (!el) { el = document.createElement("div"); el.id = "joinBar"; const v = $("#view"); v.parentNode.insertBefore(el, v); }
    const ids = Object.keys(this.pending); el.hidden = !ids.length;
    el.innerHTML = ids.map((id) => { const m = this.pending[id].m, sp = m.space && m.space.known ? ` · spazio per circa ${m.space.minLeft} min` : "";
      return `<section class="panel" style="margin-bottom:12px;border-color:var(--warn,#c77d00);display:flex;flex-wrap:wrap;gap:12px;align-items:center"><div style="flex:1;min-width:220px"><b>“${esc(m.name || id)}” vuole entrare</b><div class="muted">${esc(m.device || "Telefono")} · ${esc(m.os || "—")}${m.battery != null ? " · batteria " + Math.round(m.battery) + "%" : ""}${sp}</div></div><button class="ghost" data-jn="rej" data-id="${esc(id)}">Rifiuta</button><button class="primary" data-jn="acc" data-id="${esc(id)}">Accetta</button></section>`; }).join("") + (ids.length > 1 ? `<div style="margin:-4px 0 12px;text-align:right"><button class="ghost" data-jn="all">Accetta tutte (${ids.length})</button></div>` : "");
  },
  link() { const l = GDC_RT.Pair.link("camera.html", pairing); return new URLSearchParams(location.search).get("dev") === "1" ? l.replace("#", "?dev=1#") : l; },
  panel() {
    if (!REAL) return "";
    return `<section class="panel" id="addPhone"><div class="row"><h2 style="margin:0">Aggiungi un telefono</h2><button id="qrBtn">${this.qrOpen ? "Nascondi QR" : "Mostra QR"}</button></div>
      <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end;margin-top:10px"><div style="flex:1;min-width:200px"><label for="sessName" class="muted" style="font-size:13px">Nome della sessione</label><input id="sessName" type="text" maxlength="60" placeholder="Per esempio: Set di domenica" value="${esc(Session.cur.name)}" style="width:100%"></div><button id="sessNew" title="Nuovo QR e nuovo elenco di camere">Nuova sessione</button></div>
      <div class="muted" style="margin:4px 0 0;font-size:13px">Con “Nuova sessione” il QR cambia: i telefoni collegati ora dovranno rientrare con il nuovo QR. Le clip restano sui telefoni.</div>
      <label style="display:flex;gap:8px;align-items:center;margin-top:10px"><input type="checkbox" id="apprChk" style="width:auto;min-height:0" ${this.approve ? "checked" : ""}> Chiedi conferma prima di far entrare un telefono nuovo</label>
      <div class="muted" style="margin:2px 0 0 26px;font-size:13px">${this.approve ? "Un telefono nuovo compare qui con Accetta e Rifiuta. Quelli già collegati rientrano da soli." : "Chi apre il link entra subito, senza chiedere."}</div>
      <div id="qrBox" ${this.qrOpen ? "" : "hidden"} style="margin-top:12px"><div style="display:flex;flex-wrap:wrap;gap:16px;align-items:center"><div id="qrImg" style="background:#fff;padding:10px;border-radius:10px;width:340px;height:340px;box-sizing:border-box"></div><div style="flex:1;min-width:200px"><div>Sul telefono apri la <b>fotocamera</b> e inquadra il QR, poi tocca il link che compare.</div><div class="muted" style="margin-top:6px">Funziona con iPhone e Android. Il telefono si collega già a questa regia.</div><div class="row" style="margin-top:10px;justify-content:flex-start"><button class="ghost" id="qrCopy">Copia link</button>${this.rejected.size ? `<button class="ghost" id="rejClr">Dimentica i rifiutati (${this.rejected.size})</button>` : ""}</div></div></div></div></section>`;
  },
  draw() { Session.paint(); const b = $("#qrImg"); if (!b || !this.qrOpen) return; try { const q = qrcode(0, "L"); q.addData(this.link()); q.make(); b.innerHTML = q.createSvgTag({ cellSize: 4, margin: 0, scalable: true }); const sv = b.querySelector("svg"); if (sv) { sv.style.width = "100%"; sv.style.height = "100%"; } } catch (e) { b.textContent = "QR non generabile: " + e.message; dbg("error", "ui", `QR: ${e.message}`); } },
};
document.addEventListener("click", async (e) => {
  const j = e.target.closest("[data-jn]"); if (j) { if (j.dataset.jn === "all") { Object.keys(Join.pending).forEach((id) => Join.accept(id)); return; } j.dataset.jn === "acc" ? Join.accept(j.dataset.id) : Join.reject(j.dataset.id); return; }
  if (e.target.closest("#qrBtn")) { Join.qrOpen = !Join.qrOpen; store.set("gdc.qrOpen", Join.qrOpen); const bx = $("#qrBox"); if (bx) bx.hidden = !Join.qrOpen; e.target.closest("#qrBtn").textContent = Join.qrOpen ? "Nascondi QR" : "Mostra QR"; Join.draw(); return; }
  if (e.target.closest("#sessNew")) { const n = prompt("Nuova sessione. Il QR cambia: i telefoni collegati ora dovranno rientrare con il nuovo QR (le clip restano sui telefoni).\n\nScrivi il nome della nuova sessione, oppure lascia vuoto:", ""); if (n !== null) Session.begin(n); return; }
  if (e.target.closest("#qrCopy")) { try { await navigator.clipboard.writeText(Join.link()); e.target.textContent = "Copiato ✓"; } catch { e.target.textContent = "Copia non riuscita"; } return; }
  if (e.target.closest("#rejClr")) { Join.rejected.clear(); store.set("gdc.rejected", []); dbg("info", "camere", "rifiuti dimenticati"); route(); }
});
document.addEventListener("change", (e) => {
  if (e.target.id === "sessName") { Session.rename(e.target.value); return; }
  const pn = e.target.closest('[data-bind="proUi"]'); if (pn) { const id = pn.dataset.cam, k = e.target.dataset.pk || e.target.dataset.pm || e.target.dataset.pt; if (k && k !== "reset") { const v = e.target.type === "checkbox" ? e.target.checked : e.target.type === "range" ? Number(e.target.value) : e.target.value; command(id, { cmd: "pro", set: { [k]: v } }); } return; } });
document.addEventListener("input", (e) => { const pn = e.target.closest('[data-bind="proUi"]'); if (pn && e.target.type === "range") { const t = pn.querySelector(`[data-pv="${e.target.dataset.pk}"]`); if (t) t.textContent = e.target.value; clearTimeout(e.target._t); const k = e.target.dataset.pk, id = pn.dataset.cam, v = Number(e.target.value); e.target._t = setTimeout(() => command(id, { cmd: "pro", set: { [k]: v } }), 250); } });
document.addEventListener("click", (e) => { const b = e.target.closest('[data-bind="proUi"] [data-pk="reset"]'); if (b) command(b.closest("[data-cam]").dataset.cam, { cmd: "pro", reset: true }); });
document.addEventListener("change", (e) => { if (e.target.id === "apprChk") { Join.approve = e.target.checked; store.set("gdc.approve", Join.approve); dbg("info", "camere", `conferma prima di far entrare: ${Join.approve}`); if (!Join.approve) Object.keys(Join.pending).forEach((id) => Join.accept(id)); Xfer.refresh(); const t = e.target.parentNode.nextElementSibling; if (t) t.textContent = Join.approve ? "Un telefono nuovo compare qui con Accetta e Rifiuta. Quelli già collegati rientrano da soli." : "Chi apre il link entra subito, senza chiedere."; } });
