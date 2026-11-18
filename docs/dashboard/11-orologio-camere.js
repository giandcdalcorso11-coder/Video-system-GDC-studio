"use strict";
// orologio delle camere: scarto di ogni telefono rispetto alla regia (si prende il campione con il tempo di andata e ritorno più breve)
const Clock = {
  at: {}, run: {}, off: {},
  maybe(id) { const now = Date.now(); if (this.run[id] || now - (this.at[id] || 0) < 600000) return; this.at[id] = now; this.run[id] = { best: null, n: 0 }; for (let i = 0; i < 6; i++) setTimeout(() => { if (this.run[id]) transport.send(id, { cmd: "ping", t0: Date.now() }); }, i * 700); setTimeout(() => this.finish(id), 6200); },
  onAck(m) { const r = this.run[m.id], t0 = m.detail && m.detail.t0; if (!r || !t0 || !m.ts) return; const t2 = Date.now(), rtt = t2 - t0, off = m.ts - (t0 + t2) / 2; r.n++; if (!r.best || rtt < r.best.rtt) r.best = { rtt, off }; },
  finish(id) { const r = this.run[id]; delete this.run[id]; if (!r || !r.best) { this.at[id] = 0; return; } const off = Math.round(r.best.off), rtt = Math.round(r.best.rtt); this.off[id] = { off, rtt, at: Date.now() }; const c = camById(id);
    dbg("info", "orologio", `${c ? camTitle(c) : id}: scarto ${off} ms (±${Math.round(rtt / 2)} ms, ${r.n} misure)`); if (Math.abs(off) > 1500) log(id, `${c ? camTitle(c) : id}: l'orologio del telefono è sfasato di ${(off / 1000).toFixed(1)} s (i nomi dei file lo correggono)`);
    transport.send(id, { cmd: "clock", off, rtt }); refresh(); },
  note(id) { const o = this.off[id]; return o ? `Orologio: ${o.off > 0 ? "+" : ""}${(o.off / 1000).toFixed(2)} s rispetto alla regia (±${Math.round(o.rtt / 2)} ms)` : "Orologio: non ancora misurato"; },
};
const staleCams = () => cameras.filter((c) => { const st = state[c.id]; return !(st && st.online) && c.seen && Date.now() - c.seen > 24 * 3600 * 1000; });
const staleBanner = () => { if (!REAL) return ""; const l = staleCams(); return l.length ? `<section class="panel" style="margin-bottom:12px;display:flex;flex-wrap:wrap;gap:12px;align-items:center"><div style="flex:1;min-width:220px"><b>Camere non collegate da più di un giorno</b><div class="muted">${l.map((c) => esc(camTitle(c))).join("; ")}</div></div><button class="ghost" id="staleRm">Rimuovi dall'elenco</button></section>` : ""; };
document.addEventListener("click", (e) => { if (e.target.closest("#staleRm")) { const ids = staleCams().map((c) => c.id); ids.forEach((id) => { transport.remove(id); delete state[id]; }); cameras = cameras.filter((c) => !ids.includes(c.id)); saveCams(); dbg("info", "camere", `rimosse ${ids.length} camere non collegate`); route(); } });
