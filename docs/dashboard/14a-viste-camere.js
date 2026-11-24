"use strict";
/* ===== Viste delle camere: Automatico, Scorrimento, Personalizzato (Pro, in prova) =====
   Le tre viste usano le stesse schede delle camere (#homeGrid): cambia solo come sono disposte,
   così anteprime, pulsanti e stato continuano a funzionare. */
const Views = {
  cur: store.get("gdc.view", null), dir: store.get("gdc.scrollDir", "h") === "v" ? "v" : "h", layout: store.get("gdc.layout", {}) || {}, drag: null, quiet: 0, magnet: store.get("gdc.magnet", false) === true, addOpen: (() => { const o = store.get("gdc.addOpenNext", false); if (o) store.set("gdc.addOpenNext", false); return !!o; })(), z: 10,
  // Pro in prova: in Avanzata c'è tutto; in Base serve l'interruttore. Nessun pagamento, nessun profilo.
  pro() { return (window.GDC_DEV && GDC_DEV.mode === "adv") || store.get("gdc.pro", false) === true; },
  def() { return window.matchMedia && matchMedia("(max-width:600px) and (orientation:portrait)").matches ? "scroll" : "auto"; },
  mode() { const m = this.cur || this.def(); return m === "free" && !this.pro() ? this.def() : m; },
  set(m) { if (m === "free" && !this.pro()) return; this.cur = m; store.set("gdc.view", m); dbg("info", "ui", `vista delle camere: ${m}`); this.apply(); },
  bar() {
    return `<div class="viewbar" id="viewBar">
      <span class="seg3" role="group" aria-label="Vista delle camere"><button data-vw="auto">Automatico</button><button data-vw="scroll">Scorrimento</button><button data-vw="free" id="vwFree">Personalizzato <small>Pro</small></button></span>
      <span class="seg3" id="vwDir" role="group" aria-label="Direzione dello scorrimento" hidden><button data-vd="h" title="Scorri a destra e a sinistra">↔</button><button data-vd="v" title="Scorri su e giù">↕</button></span>
      <button id="vwMagnet" hidden aria-pressed="false" title="Calamita: spostando o ridimensionando una camera, le altre si scostano da sole">🧲 Calamita</button>
      <button id="vwReset" hidden title="Rimette le camere nella disposizione iniziale">Ripristina disposizione</button>
      <span style="flex:1"></span>
      <label class="base-only proLbl" title="Solo per le prove: attiva le funzioni Pro. Nessun pagamento."><input type="checkbox" id="proChk"> Funzioni Pro (prova)</label>
      ${REAL ? `<button class="primary" id="addCam2">+ Aggiungi camera</button>` : ""}
    </div><div id="vwChips" class="vwchips" hidden></div>`;
  },
  modal() { return REAL ? `<div class="modal" id="addModal" ${this.addOpen ? "" : "hidden"}><div class="modal-card"><div class="row" style="margin-bottom:8px"><b>Aggiungi un dispositivo</b><button id="addClose" class="ghost">Chiudi</button></div><div id="joinModalBar"></div>${Join.panel()}</div></div>` : ""; },
  openAdd() { this.addOpen = true; const m = $("#addModal"); if (!m) return; m.hidden = false; Join.qrOpen = true; store.set("gdc.qrOpen", true); const bx = $("#qrBox"); if (bx) bx.hidden = false; const b = $("#qrBtn"); if (b) b.textContent = "Nascondi QR"; Join.draw(); Join.render(); dbg("info", "ui", "finestra Aggiungi dispositivo aperta"); },
  closeAdd() { this.addOpen = false; const m = $("#addModal"); if (m) m.hidden = true; },
  apply() {
    const g = $("#homeGrid"); if (!g) return; const m = this.mode(), n = cameras.length;
    g.classList.remove("v-auto", "v-scroll", "v-free", "dir-v", "dense"); g.classList.add("v-" + m); if (m === "scroll" && this.dir === "v") g.classList.add("dir-v"); if (m === "auto" && n > 4) g.classList.add("dense");
    document.querySelectorAll("#viewBar [data-vw]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.vw === m)));
    document.querySelectorAll("#viewBar [data-vd]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.vd === this.dir)));
    const fr = $("#vwFree"); if (fr) { fr.disabled = !this.pro(); fr.title = this.pro() ? "" : "Attiva “Funzioni Pro (prova)” per usarla"; }
    const pc = $("#proChk"); if (pc) pc.checked = store.get("gdc.pro", false) === true;
    const dr = $("#vwDir"); if (dr) dr.hidden = m !== "scroll"; const rs = $("#vwReset"); if (rs) rs.hidden = m !== "free"; const mg = $("#vwMagnet"); if (mg) { mg.hidden = m !== "free"; mg.setAttribute("aria-pressed", String(this.magnet)); } g.classList.toggle("magnet", this.magnet);
    if (m === "free") this.place(); else { g.style.minHeight = ""; g.querySelectorAll(".card").forEach((c) => { c.style.left = c.style.top = c.style.width = c.style.height = ""; }); }
    this.chips();
  },
  // Personalizzato: ogni scheda ha posizione e misura salvate sul dispositivo (non su un profilo)
  place() {
    const g = $("#homeGrid"); if (!g) return; const W = 290, H = 430, per = Math.max(1, Math.floor((g.clientWidth || 900) / (W + 16))); let bottom = 0;
    [...g.querySelectorAll(".card")].forEach((c, i) => {
      const id = c.dataset.cam, l = this.layout[id] || { x: (i % per) * (W + 16), y: Math.floor(i / per) * (H + 16), w: W, h: H };
      c.style.left = l.x + "px"; c.style.top = l.y + "px"; c.style.width = l.w + "px"; c.style.height = l.h + "px"; bottom = Math.max(bottom, l.y + l.h);
      if (!c.querySelector(".rz")) { const r = document.createElement("div"); r.className = "rz"; r.title = "Trascina per ridimensionare"; c.appendChild(r); }
    });
    g.style.minHeight = Math.max(bottom + 24, 480) + "px";
  },
  chips() {
    const el = $("#vwChips"), g = $("#homeGrid"); if (!el || !g) return;
    if (this.mode() !== "scroll" || cameras.length < 2) { el.hidden = true; return; }
    el.hidden = false; el.innerHTML = cameras.map((c, i) => `<button data-vc="${c.id}" title="${esc(camTitle(c))}">${c.num || i + 1}<i data-vcs="${c.id}"></i></button>`).join("") + `<span id="vwPos" class="muted"></span>`; this.pos();
  },
  pos() {
    const g = $("#homeGrid"); if (!g || this.mode() !== "scroll") return; const cs = [...g.querySelectorAll(".card")]; if (!cs.length) return;
    const v = this.dir === "v", r = g.getBoundingClientRect(); let best = cs.length - 1;
    for (let i = 0; i < cs.length; i++) { const q = cs[i].getBoundingClientRect(), c = v ? q.top + q.height / 2 : q.left + q.width / 2; if (c >= (v ? r.top : r.left)) { best = i; break; } }
    document.querySelectorAll("#vwChips [data-vc]").forEach((b, i) => b.setAttribute("aria-pressed", String(i === best)));
    const p = $("#vwPos"); if (p) p.textContent = `${best + 1} di ${cs.length}`;
  },
  dots() { document.querySelectorAll("#vwChips [data-vcs]").forEach((i) => { const s = state[i.dataset.vcs]; i.className = s && s.rec ? "r" : s && s.online ? "g" : ""; }); },
  // Calamita: le schede toccate dal movimento si scostano (verso il lato più vicino, o in basso), a catena
  push(rects, id) {
    const gap = 8, W = $("#homeGrid").clientWidth || 900, q = [id]; let guard = 400;
    while (q.length && guard-- > 0) {
      const a = rects[q.shift()];
      for (const k in rects) {
        const b = rects[k]; if (b === a || k === id) continue;
        if (a.x + a.w + gap <= b.x || b.x + b.w + gap <= a.x || a.y + a.h + gap <= b.y || b.y + b.h + gap <= a.y) continue;
        const opts = [{ d: a.y + a.h + gap - b.y, f: () => { b.y = a.y + a.h + gap; } }];
        const r = a.x + a.w + gap - b.x, l = b.x + b.w - (a.x - gap);
        if (b.x + r + b.w <= W) opts.push({ d: r, f: () => { b.x = a.x + a.w + gap; } });
        if (a.x - gap - b.w >= 0) opts.push({ d: l, f: () => { b.x = a.x - gap - b.w; } });
        if (a.y - gap - b.h >= 0) opts.push({ d: b.y + b.h - (a.y - gap), f: () => { b.y = a.y - gap - b.h; } });
        opts.sort((u, v) => u.d - v.d); opts[0].f(); q.push(k);
      }
    }
  },
  reset() { this.layout = {}; store.set("gdc.layout", {}); dbg("info", "ui", "disposizione ripristinata"); this.place(); },
};
document.addEventListener("click", (e) => {
  if (Views.quiet > Date.now()) { e.stopPropagation(); e.preventDefault(); return; }
  const vw = e.target.closest("#viewBar [data-vw]"); if (vw) { Views.set(vw.dataset.vw); return; }
  const vd = e.target.closest("#viewBar [data-vd]"); if (vd) { Views.dir = vd.dataset.vd; store.set("gdc.scrollDir", Views.dir); Views.apply(); return; }
  if (e.target.closest("#vwMagnet")) { Views.magnet = !Views.magnet; store.set("gdc.magnet", Views.magnet); dbg("info", "ui", `calamita: ${Views.magnet ? "attiva" : "spenta"}`); Views.apply(); return; }
  if (e.target.closest("#vwReset")) { Views.reset(); return; }
  const vc = e.target.closest("#vwChips [data-vc]"); if (vc) { const c = document.querySelector(`#homeGrid .card[data-cam="${vc.dataset.vc}"]`); if (c) c.scrollIntoView({ behavior: "smooth", inline: "start", block: "start" }); return; }
  if (e.target.closest("#addCam2") || e.target.closest("#addDev")) { Views.openAdd(); return; }
  if (e.target.closest("#addClose") || e.target.id === "addModal") { Views.closeAdd(); return; }
  if (e.target.closest("#gdcMode [data-mode]")) setTimeout(() => Views.apply(), 0);
}, true);
document.addEventListener("change", (e) => { if (e.target.id === "proChk") { store.set("gdc.pro", e.target.checked); dbg("info", "ui", `funzioni Pro (prova): ${e.target.checked ? "attive" : "spente"}`); if (!e.target.checked && Views.cur === "free") { Views.cur = null; store.set("gdc.view", null); } Views.apply(); } });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") Views.closeAdd(); });
document.addEventListener("scroll", (e) => { if (e.target && e.target.id === "homeGrid") { clearTimeout(Views._t); Views._t = setTimeout(() => Views.pos(), 80); } }, true);
// trascinare (dalla testata) e ridimensionare (dall'angolo) le schede nella vista Personalizzata
document.addEventListener("pointerdown", (e) => {
  const g = $("#homeGrid"); if (!g || !g.classList.contains("v-free")) return;
  const card = e.target.closest("#homeGrid .card"), rz = e.target.closest(".rz"), hd = e.target.closest(".card-h"); if (!card || (!rz && !hd) || e.button > 0) return;
  e.preventDefault(); card.setPointerCapture(e.pointerId); card.classList.add("moving"); card.style.zIndex = ++Views.z;
  const rects = {}; g.querySelectorAll(".card").forEach((c) => { rects[c.dataset.cam] = { x: parseFloat(c.style.left) || c.offsetLeft, y: parseFloat(c.style.top) || c.offsetTop, w: parseFloat(c.style.width) || c.offsetWidth, h: parseFloat(c.style.height) || c.offsetHeight }; });
  Views.drag = { rects, card, kind: rz ? "size" : "move", x0: e.clientX, y0: e.clientY, l: card.offsetLeft, t: card.offsetTop, w: card.offsetWidth, h: card.offsetHeight, moved: false };
});
document.addEventListener("pointermove", (e) => {
  const d = Views.drag; if (!d) return; const dx = e.clientX - d.x0, dy = e.clientY - d.y0; if (Math.abs(dx) + Math.abs(dy) > 4) d.moved = true;
  const g = $("#homeGrid"), W = g.clientWidth;
  if (d.kind === "move") { d.card.style.left = Math.max(0, Math.min(W - 60, d.l + dx)) + "px"; d.card.style.top = Math.max(0, d.t + dy) + "px"; }
  else { d.card.style.width = Math.max(150, Math.min(W - d.l, d.w + dx)) + "px"; d.card.style.height = Math.max(200, d.h + dy) + "px"; }
  if (Views.magnet) {
    const id = d.card.dataset.cam; d.rects[id] = { x: parseFloat(d.card.style.left) || d.card.offsetLeft, y: parseFloat(d.card.style.top) || d.card.offsetTop, w: parseFloat(d.card.style.width) || d.card.offsetWidth, h: parseFloat(d.card.style.height) || d.card.offsetHeight };
    Views.push(d.rects, id); let bottom = 0;
    for (const k in d.rects) { const r = d.rects[k], c = g.querySelector(`.card[data-cam="${k}"]`); bottom = Math.max(bottom, r.y + r.h); if (c && k !== id) { c.style.left = r.x + "px"; c.style.top = r.y + "px"; } }
    g.style.minHeight = Math.max(bottom + 24, 480) + "px";
  }
});
const endDrag = () => {
  const d = Views.drag; if (!d) return; Views.drag = null; d.card.classList.remove("moving");
  if (d.moved) { Views.quiet = Date.now() + 250; Views.layout[d.card.dataset.cam] = { x: d.card.offsetLeft, y: d.card.offsetTop, w: d.card.offsetWidth, h: d.card.offsetHeight }; if (Views.magnet) for (const k in d.rects) if (k !== d.card.dataset.cam) { const r = d.rects[k]; Views.layout[k] = { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.w), h: Math.round(r.h) }; } store.set("gdc.layout", Views.layout); dbg("info", "ui", `scheda ${d.card.dataset.cam}: ${d.kind === "move" ? "spostata" : "ridimensionata"}`); Views.place(); }
};
document.addEventListener("pointerup", endDrag); document.addEventListener("pointercancel", endDrag);
