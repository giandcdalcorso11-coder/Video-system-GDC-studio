"use strict";
// segnali: un tocco registra l'istante su tutte le camere che stanno registrando (posizione dentro ogni clip), da esportare per il montaggio
const Marks = {
  list: store.get("gdc.marks", []), files: store.get("gdc.markFiles", {}), fps: 30,
  save() { store.set("gdc.marks", this.list.slice(-500)); store.set("gdc.markFiles", this.files); },
  add() {
    if (!REAL) return; const now = Date.now(), cams = [];
    cameras.forEach((c) => { const st = state[c.id]; if (st && st.online && st.rec && st.recSid) cams.push({ id: c.id, title: camTitle(c), sid: st.recSid, off: Math.max(0, now - st.recStart) }); });
    const n = (this.list.length ? this.list[this.list.length - 1].n : 0) + 1; this.list.push({ n, t: now, note: "", cams }); this.save();
    log("", cams.length ? `Segnale ${n} registrato su ${cams.length} ${cams.length === 1 ? "camera" : "camere"}` : `Segnale ${n}: nessuna camera stava registrando (resta solo l'ora)`); dbg("info", "segnali", `segnale ${n}`, { cams: cams.map((c) => [c.id, Math.round(c.off)]) });
    const b = $("#markBtn"); if (b) { b.textContent = `⚑ Segnato (${n})`; clearTimeout(this.tb); this.tb = setTimeout(() => { b.textContent = "⚑ Segna"; }, 1500); } this.render();
  },
  learn() { let ch = false; cameras.forEach((c) => ((state[c.id] && state[c.id].clips) || []).forEach((k) => { if (k.id && k.file && this.files[k.id] !== k.file) { this.files[k.id] = k.file; ch = true; } })); if (ch) this.save(); },
  tc(ms) { const f = Math.floor((ms % 1000) / 1000 * this.fps), t = Math.floor(ms / 1000), p2 = (n) => String(n).padStart(2, "0"); return `${p2(Math.floor(t / 3600))}:${p2(Math.floor(t / 60) % 60)}:${p2(t % 60)}:${p2(f)}`; },
  clock(t) { return new Date(t).toTimeString().slice(0, 8); },
  fileOf(c) { return this.files[c.sid] || `(clip ${c.sid})`; },
  csv() { const q = (x) => `"${String(x).replace(/"/g, '""')}"`; const rows = [["segnale", "ora_regia", "nota", "camera", "file", "posizione", "secondi"]];
    this.list.forEach((m) => { if (!m.cams.length) rows.push([m.n, this.clock(m.t), m.note, "", "", "", ""]); m.cams.forEach((c) => rows.push([m.n, this.clock(m.t), m.note, c.title, this.fileOf(c), this.tc(c.off), (c.off / 1000).toFixed(2)])); });
    return "\ufeff" + rows.map((r) => r.map(q).join(";")).join("\r\n") + "\r\n"; },
  // un file per camera, nel formato dei marcatori di DaVinci Resolve: il tempo parte da 01:00:00:00 (inizio di default di una timeline), con la clip messa all'inizio
  edl(id) { const ev = []; this.list.forEach((m) => m.cams.filter((c) => c.id === id).forEach((c) => ev.push({ m, c }))); if (!ev.length) return null;
    const base = 3600000, head = `TITLE: ${ev[0].c.title}\r\nFCM: NON-DROP FRAME\r\n\r\n`;
    return head + ev.map((x, i) => { const a = this.tc(base + x.c.off), b = this.tc(base + x.c.off + 1000 / this.fps), n = String(i + 1).padStart(3, "0"); return `${n}  001      V     C        ${a} ${b} ${a} ${b}  \r\n |C:ResolveColorBlue |M:${(x.m.note || "Segnale " + x.m.n).replace(/[|\r\n]/g, " ")} |D:1\r\n`; }).join("\r\n"); },
  async out(name, text) {
    const folder = Dest.mode === "folder" && Dest.handle && Dest.health && Dest.health.ok;
    try {
      if (folder) { const fh = await Dest.handle.getFileHandle(name, { create: true }), w = await fh.createWritable(); await w.write(text); await w.close(); log("", `Salvato nella cartella: ${name}`); }
      else { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); log("", `Scaricato: ${name}`); }
    } catch (e) { log("", `Salvataggio di ${name} non riuscito: ${e.message}`); dbg("error", "segnali", `${name}: ${e.name}: ${e.message}`); }
  },
  async exportAll() { if (!this.list.length) return; const d = new Date().toISOString().slice(0, 10); await this.out(`Segnali_${d}.csv`, this.csv());
    for (const c of cameras) { const t = this.edl(c.id); if (t) await this.out(`Segnali_${d}_${String(labelOf(c.id) || c.name).replace(/[^A-Za-z0-9]+/g, "")}.edl`, t); } },
  panel() {
    if (!REAL) return ""; const l = this.list.slice(-8).reverse();
    return `<section class="panel" id="marksPanel"><div class="row"><h2 style="margin:0">Segnali</h2><span class="muted">${this.list.length ? this.list.length + " in questa sessione" : "premi ⚑ Segna (o il tasto M) durante la ripresa"}</span></div>
      ${l.length ? `<ol class="list" style="max-height:none;margin-top:8px">${l.map((m) => `<li><time>${this.clock(m.t)}</time> Segnale ${m.n} · ${m.cams.length ? m.cams.map((c) => esc(c.title.split(" · ")[0]) + " " + this.tc(c.off).slice(0, 8)).join(", ") : "nessuna camera in registrazione"} <input data-mkn="${m.n}" value="${esc(m.note)}" placeholder="nota" style="width:140px;margin-left:6px"></li>`).join("")}</ol>
      <div class="row" style="margin-top:8px;justify-content:flex-start"><button class="primary" data-mk="exp">Esporta segnali</button><button class="ghost" data-mk="clr">Cancella i segnali</button></div>
      <div class="muted" style="margin-top:6px;font-size:13px">Per ogni segnale: la posizione dentro ogni clip (precisione di circa mezzo secondo). Esporta un file CSV e, per ogni camera, un file dei marcatori per DaVinci Resolve (da provare: parte da 01:00:00:00).</div>` : ""}</section>`;
  },
  render() { const el = $("#marksPanel"); if (el) el.outerHTML = this.panel(); },
};
document.addEventListener("click", (e) => { const b = e.target.closest("[data-mk]"); if (b) { if (b.dataset.mk === "exp") Marks.exportAll(); else if (b.dataset.mk === "clr" && confirm("Cancellare tutti i segnali di questa sessione?")) { Marks.list = []; Marks.save(); Marks.render(); } return; } if (e.target.closest("#markBtn")) Marks.add(); });
document.addEventListener("change", (e) => { const i = e.target.closest("[data-mkn]"); if (i) { const m = Marks.list.find((x) => x.n === Number(i.dataset.mkn)); if (m) { m.note = i.value.trim().slice(0, 80); Marks.save(); } } });
if (REAL) { const b = $("#markBtn"); if (b) b.hidden = false; }
