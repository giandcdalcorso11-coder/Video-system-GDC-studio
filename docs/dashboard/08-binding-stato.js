"use strict";
let zDrag = false;
const spColor = (el, st) => { const lv = st.online && st.space && st.space.known ? st.space.level : "ok"; el.style.color = lv === "crit" ? "var(--bad,#d93025)" : lv === "warn" ? "var(--warn,#c77d00)" : ""; };
const BIND = {
  clockNote: (st, c, el) => { el.textContent = Clock.note(c.id); },
  xferUi: (st, c, el) => Xfer.render(st, c, el),
  stationUi: (st, c, el) => { const cb = $("#stationChk", el); if (!cb) return; if (document.activeElement !== cb) cb.checked = !!st.station; cb.disabled = !st.online; },
  autoFreeUi: (st, c, el) => { const cb = $("#autoFree", el); if (!cb) return; if (document.activeElement !== cb) cb.checked = !!(st.space && st.space.autoFree); cb.disabled = !st.online; },
  spaceNote: (st, c, el) => { const sp = st.space; el.textContent = !st.online || !sp ? "" : `Base di calcolo: ${sp.basis || "n/d"}${sp.measuredMB ? " · limite misurato " + sp.measuredMB + " MB" : ""}${sp.quotaMB != null ? " · quota browser " + sp.quotaMB + " MB (usati " + sp.usageMB + " MB)" : ""} · liberati finora: ${sp.freedMB || 0} MB`; },
  proUi: (st, c, el) => {
    const p = st.pro, on = !!(st.online && st.camReady && p), sig = JSON.stringify(on ? [!!p.torch, p.focus && [p.focus.modes, !!p.focus.dist && [p.focus.dist.min, p.focus.dist.max]], p.wb && [p.wb.modes, !!p.wb.temp && [p.wb.temp.min, p.wb.temp.max]], p.exp && [p.exp.modes, ["comp", "iso", "shutter"].map((k) => p.exp[k] && [p.exp[k].min, p.exp[k].max])]] : [on]);
    const NM = { continuous: "Automatico", manual: "Manuale", "single-shot": "Blocca" };
    if (el.dataset.sig !== sig) {
      el.dataset.sig = sig; const sl = (k, o, lbl, fmt) => o ? `<div class="pr"><div class="row" style="gap:10px;align-items:center"><span style="min-width:92px">${lbl}</span><input type="range" data-pk="${k}" min="${o.min}" max="${o.max}" step="${o.step || "any"}" style="flex:1"><b data-pv="${k}" style="min-width:60px;text-align:right"></b></div></div>` : "";
      const md = (k, ms, lbl) => ms && ms.length > 1 ? `<div class="row" style="gap:10px;align-items:center;margin-top:6px"><span style="min-width:92px">${lbl}</span><select data-pm="${k}" style="flex:1">${ms.map((m) => `<option value="${m}">${NM[m] || m}</option>`).join("")}</select></div>` : "";
      el.innerHTML = `<h2>Controlli camera</h2>` + (!on ? `<div class="muted">${!st.online ? "" : !st.camReady ? "Camera spenta." : "Questo telefono non offre controlli avanzati (torcia, fuoco, bianco, esposizione)."}</div>` : `
        ${p.torch ? `<label style="display:flex;gap:8px;align-items:center;margin:4px 0"><input type="checkbox" data-pt="torch" style="width:auto;min-height:0"> Torcia</label>` : ""}
        ${p.focus ? `<div style="margin-top:8px"><b>Fuoco</b>${md("focusMode", p.focus.modes, "Modo")}${sl("focusDistance", p.focus.dist, "Distanza", 0)}</div>` : ""}
        ${p.wb ? `<div style="margin-top:8px"><b>Bilanciamento del bianco</b>${md("whiteBalanceMode", p.wb.modes, "Modo")}${sl("colorTemperature", p.wb.temp, "Temperatura", 0)}</div>` : ""}
        ${p.exp ? `<div style="margin-top:8px"><b>Esposizione</b>${md("exposureMode", p.exp.modes, "Modo")}${sl("exposureCompensation", p.exp.comp, "Correzione", 0)}${sl("iso", p.exp.iso, "ISO", 0)}${sl("exposureTime", p.exp.shutter, "Otturatore", 0)}</div>` : ""}
        <div class="row" style="margin-top:10px;justify-content:flex-start"><button class="ghost" data-pk="reset">Tutto automatico</button></div>
        <div class="muted" style="margin-top:6px;font-size:13px">Si vedono solo i controlli che questo telefono supporta. I valori manuali restano anche se la camera si riavvia.</div>`);
    }
    if (!on) return;
    const act = document.activeElement, put = (k, v, f) => { const i = el.querySelector(`[data-pk="${k}"]`), t = el.querySelector(`[data-pv="${k}"]`); if (i && act !== i && v != null) i.value = v; if (t && v != null) t.textContent = f(v); };
    const tb = el.querySelector('[data-pt="torch"]'); if (tb && act !== tb) tb.checked = !!(p.torch && p.torch.cur);
    const ms = (k, v) => { const s2 = el.querySelector(`[data-pm="${k}"]`); if (s2 && act !== s2 && v) s2.value = v; };
    if (p.focus) { ms("focusMode", p.focus.cur); put("focusDistance", p.focus.dist && p.focus.dist.cur, (v) => Number(v).toFixed(2)); }
    if (p.wb) { ms("whiteBalanceMode", p.wb.cur); put("colorTemperature", p.wb.temp && p.wb.temp.cur, (v) => Math.round(v) + " K"); }
    if (p.exp) { ms("exposureMode", p.exp.cur); put("exposureCompensation", p.exp.comp && p.exp.comp.cur, (v) => (v > 0 ? "+" : "") + Number(v).toFixed(1)); put("iso", p.exp.iso && p.exp.iso.cur, (v) => String(Math.round(v))); put("exposureTime", p.exp.shutter && p.exp.shutter.cur, (v) => (v <= 10000 ? "1/" + Math.round(10000 / v) + " s" : (v / 10000).toFixed(1) + " s")); }
  },
  zoomUi: (st, c, el) => {
    const z = st.zoom, sl = $("#zSlider", el), val = $("#zVal", el), note = $("#zNote", el), ok = !!(st.online && st.camReady && z && z.native);
    if (ok) { sl.min = z.min; sl.max = z.max; }
    sl.disabled = !ok; if (!zDrag && ok && z.cur != null) sl.value = z.cur;
    val.textContent = ok && z.cur != null ? Number(z.cur).toFixed(1) + "×" : "—";
    $$(".zb", el).forEach((b) => { const v = Number(b.dataset.z); b.disabled = !ok || v < z.min - 0.001 || v > z.max + 0.001; b.classList.toggle("primary", ok && z.cur != null && Math.abs(z.cur - v) < 0.06); });
    note.textContent = !st.online ? "" : !st.camReady ? "Camera spenta." : !ok ? "Zoom non disponibile su questo dispositivo (serve un Safari recente)." : `Zoom nativo da ${z.min}× a ${z.max}×. Si può cambiare anche durante la registrazione.`;
  },
  title: (st, c, el) => { el.textContent = camTitle(c); },
  pill: (st, c, el) => { const tlOn = !!(st.tl && st.tl.stage); el.className = "pill " + (!st.online ? "" : st.rec || tlOn ? "rec" : "idle"); el.innerHTML = `<span class="dot"></span>${!st.online ? "OFFLINE" : st.rec ? "IN REC" : tlOn ? (st.tl.stage === "rendering" ? "CREO VIDEO" : "TIME-LAPSE") : "PRONTA"}`; },
  card: (st, c, el) => { el.classList.toggle("is-off", !st.online); el.classList.toggle("is-rec", !!(st.rec || st.tl)); },
  batTxt: (st, c, el) => { el.textContent = st.online ? (st.battery == null ? "n/d" : Math.round(st.battery) + "%" + (st.charging ? " ⚡" : "")) : "—"; },
  batBar: (st, c, el) => { const has = st.online && st.battery != null; el.className = "bar " + (has ? batClass(st.battery) : ""); $("i", el).style.width = (has ? st.battery : 0) + "%"; },
  batWarn: (st, c, el) => { el.textContent = st.online && st.battery != null && !st.charging && st.battery < 20 ? "Batteria bassa: collega il cavo" : ""; },
  batState: (st, c, el) => { const at = st.batAt ? new Date(st.batAt).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }) : ""; el.textContent = !st.online ? "—" : st.battery == null ? "Livello non disponibile (arriverà dall'app Comandi)" : (st.charging == null ? "" : st.charging ? "In carica" : "A batteria") + (at ? (st.charging == null ? "" : " · ") + "misurata alle " + at : ""); },
  free: (st, c, el) => { spColor(el, st); if (st.online && st.space && st.space.known) { el.textContent = `~${st.space.minLeft} min di ripresa`; return; } el.textContent = !st.online ? "—" : st.bufMB != null ? `${st.bufMB} / ${st.maxBufMB} MB` : st.freeGb.toFixed(1) + " GB"; },
  freeLong: (st, c, el) => { if (st.online && st.space && st.space.known) { el.textContent = `${st.space.availMB} MB ancora disponibili · ${st.space.usedMB} MB già usati dalle clip sul telefono`; return; } el.textContent = !st.online ? "—" : st.bufMB != null ? `${st.bufMB} MB usati su ${st.maxBufMB} MB di buffer sul telefono` : `${st.freeGb.toFixed(1)} GB liberi di ${st.totalGb} GB`; },
  freeEst: (st, c, el) => { spColor(el, st); if (st.online && st.space && st.space.known) { el.textContent = `Circa ${st.space.minLeft} min di ripresa a ${st.res} (${st.space.pct}% dello spazio disponibile già usato)`; return; } el.textContent = !st.online ? "—" : st.bufMB != null ? (st.bps ? `circa ${Math.max(0, Math.floor(((st.maxBufMB - st.bufMB) * 8) / (st.bps / 1e6) / 60))} min di ripresa prima di riempire il buffer` : "—") : `circa ${Math.floor(st.freeGb * 1024 / MB_PER_MIN)} min di ripresa (stima)`; },
  timer: (st, c, el) => { el.textContent = st.rec ? fmtTime(Date.now() - st.recStart) : st.tl ? `Time-lapse: ${st.tl.frames} imm.` : "—"; },
  badge: (st, c, el) => { el.textContent = st.rec ? fmtTime(Date.now() - st.recStart) : "00:00"; },
  conn: (st, c, el) => { el.textContent = !st.online ? "—" : st.rssi == null ? "Collegata (Supabase)" : `Wi-Fi ${Math.round(st.rssi)} dBm · ${st.latency} ms`; },
  pos: (st, c, el) => { el.textContent = !st.online || st.real ? "—" : `${st.pan}° / ${st.tilt}°`; },
  res: (st, c, el) => { el.textContent = st.res; },
  orient: (st, c, el) => { el.textContent = st.orient; },
  recBtn: (st, c, el) => { el.disabled = !st.online || st.rec || !!st.tl; },
  stopBtn: (st, c, el) => { el.disabled = !Mode.busy(st); },
  modeUi: (st, c, el) => { if (document.activeElement !== el) el.value = Mode.of(c); el.disabled = !st.online || Mode.busy(st); },
  modeTxt: (st, c, el) => { el.textContent = Mode.of(c) === "timelapse" ? "Time-lapse" : "Video"; },
  localRecUi: (st, c, el) => { const cb = $("#localRecChk", el); if (!cb) return; if (document.activeElement !== cb) cb.checked = c.localRec !== undefined ? !!c.localRec : !!st.localRec; cb.disabled = !st.online; },
  connBtn: (st, c, el) => { el.disabled = !!st.real; el.textContent = st.real ? "Camera reale" : st.online ? "Disconnetti (sim)" : "Connetti (sim)"; },
  chargeBtn: (st, c, el) => { el.disabled = !st.online || !!st.real; el.hidden = !!st.real; el.textContent = st.charging ? "Scollega cavo (sim)" : "Collega cavo (sim)"; },
  tlStat: (st, c, el) => {
    const t = st.tl; if (!st.online) { el.textContent = "—"; return; } if (!t) { el.textContent = "Nessun time-lapse in corso."; return; }
    const iv = t.intS < 1 ? `${Math.round(1 / t.intS)} al secondo` : t.intS === 1 ? "1 al secondo" : `1 ogni ${t.intS} s`;
    el.textContent = t.stage === "rendering" ? `Creo il video… ${Math.round(t.progress * 100)}% (${t.frames} immagini a ${t.fps} fps)` : `In ripresa da ${fmtTime(t.elapsedMs)} · ${t.frames} immagini (${t.MB} MB) · intervallo ${iv} · video atteso ${(t.frames / t.fps).toFixed(1)} s${t.skipped ? ` · saltate ${t.skipped}` : ""}${t.errs ? ` · errori ${t.errs}` : ""}`;
  },
  tlStartBtn: (st, c, el) => { el.disabled = !st.online || st.rec || !!st.tl; },
  tlStopBtn: (st, c, el) => { el.disabled = !(st.tl && st.tl.stage === "shooting"); },
  standbyBtn: (st, c, el) => { el.disabled = !st.online; el.textContent = st.standby ? "Riattiva schermo" : "Schermo nero"; },
  screen: (st, c, el) => { el.textContent = !st.online ? "—" : st.standby ? "Nero (standby)" : "Normale"; },
  clips: (st, c, el) => { el.innerHTML = st.clips.length ? st.clips.map((k) => `<li>${esc(k.file)} <span class="muted">· ${k.kind === "timelapse" ? "time-lapse · " : ""}${fmtTime(k.dur)} · ~${k.mb} MB · ${esc(k.status || "")}</span></li>`).join("") : '<li class="muted">Nessun clip in questa sessione</li>'; },
};
const spaceSeen = {};
function spaceWatch() {
  cameras.forEach((c) => {
    const st = state[c.id], sp = st && st.space; if (!sp || !sp.known) return; const prev = spaceSeen[c.id]; spaceSeen[c.id] = sp.level;
    if (sp.level !== "ok" && prev !== sp.level) { const msg = `${camTitle(c)}: ${sp.level === "crit" ? "spazio quasi finito" : "spazio in calo"} (circa ${sp.minLeft} min di ripresa)`; log(c.id, msg); dbg("warn", "spazio", msg, sp); }
  });
}
function renderPreflight() {
  const el = $("#preflight"); if (!el) return;
  if (!REAL || !cameras.length) { el.hidden = true; return; } el.hidden = false;
  const col = (lv) => (lv === "ok" ? "var(--ok,#2a9d5c)" : lv === "warn" ? "var(--warn,#c77d00)" : lv === "crit" ? "var(--bad,#d93025)" : "var(--muted,#888)"), dot = (lv) => `<span style="color:${col(lv)}">●</span>`;
  const rows = cameras.map((c) => {
    const st = state[c.id] || {}, on = !!st.online, sp = st.space, why = [];
    const cl = on ? "ok" : "crit", bl = st.battery == null ? "n" : st.charging ? "ok" : st.battery < 20 ? "crit" : st.battery < 40 ? "warn" : "ok", sl = !sp || !sp.known ? "n" : sp.level;
    if (!on) why.push("non è collegata"); if (bl === "crit") why.push("batteria sotto il 20%"); if (sl === "crit") why.push("spazio quasi finito"); if (bl === "warn") why.push("batteria sotto il 40%"); if (sl === "warn") why.push("poco spazio");
    return { name: camTitle(c), worst: [cl, bl, sl].includes("crit") ? "crit" : [cl, bl, sl].includes("warn") ? "warn" : "ok", why,
      html: `<tr><td>${esc(camTitle(c))}</td><td>${dot(cl)} ${on ? "online" : "offline"}</td><td>${dot(bl)} ${st.battery == null ? "n/d" : Math.round(st.battery) + "%" + (st.charging ? " ⚡" : "")}</td><td>${dot(sl)} ${sp && sp.known ? "circa " + sp.minLeft + " min" : "n/d"}</td></tr>` };
  });
  const dh = REAL && Dest.mode === "folder" && Dest.handle ? Dest.health : null, destBad = !!(dh && !dh.ok);
  const destLine = dh ? `<div style="margin-top:8px;font-size:14px"><span style="color:${dh.ok ? col("ok") : col("crit")}">●</span> Cartella dei file “${esc(Dest.handle.name)}”: ${esc(dh.msg)}</div>` : "";
  const bad = rows.filter((r) => r.worst === "crit"), mid = rows.filter((r) => r.worst === "warn");
  const verdict = destBad && !bad.length ? `<b style="color:${col("crit")}">Da sistemare:</b> la cartella dei file non è raggiungibile (${esc(dh.msg)}). Puoi registrare, ma i file restano sui telefoni.` : bad.length ? `<b style="color:${col("crit")}">Da sistemare prima di registrare:</b> ${bad.map((r) => esc(r.name) + " (" + r.why.join(", ") + ")").join("; ")}.` : mid.length ? `<b style="color:${col("warn")}">Quasi pronto:</b> ${mid.map((r) => esc(r.name) + " (" + r.why.join(", ") + ")").join("; ")}.` : `<b style="color:${col("ok")}">Tutto pronto.</b> Spazio, batteria e collegamento sono a posto.`;
  el.innerHTML = `<h2>Controllo prima di iniziare</h2><table style="width:100%;font-size:14px;border-collapse:collapse"><thead><tr style="text-align:left;color:var(--muted,#888)"><th>Camera</th><th>Collegamento</th><th>Batteria</th><th>Spazio</th></tr></thead><tbody>${rows.map((r) => r.html).join("")}</tbody></table>${destLine}<div style="margin-top:10px;font-size:14px">${verdict}</div>`;
}
function refresh() {
  $$("[data-bind]").forEach((el) => {
    const id = el.dataset.cam, st = state[id], c = camById(id), fn = BIND[el.dataset.bind];
    if (st && c && fn) fn(st, c, el);
  });
  const all = cameras.map((c) => state[c.id]).filter(Boolean);
  const online = all.filter((s) => s.online), recs = all.filter((s) => Mode.busy(s) || s.tl);
  $("#recAll").disabled = !online.length || recs.length === online.length;
  $("#stopAll").disabled = !all.some((s) => Mode.busy(s));
  renderPreflight(); spaceWatch(); Perm.render();
  $("#globalPill").className = "pill " + (recs.length ? "rec" : online.length ? "idle" : "");
  $("#globalTxt").textContent = recs.length ? `IN REC (${recs.length}/${online.length})` : online.length ? `PRONTE (${online.length}/${cameras.length})` : "NESSUNA CAMERA";
  const sum = $("#sum");
  if (sum) {
    $("#sOnline").textContent = `${online.length}/${cameras.length}`;
    $("#sRec").textContent = recs.length;
    { const bs = online.map((s) => s.battery).filter((v) => v != null); $("#sBat").textContent = bs.length ? Math.round(Math.min(...bs)) + "%" : online.length ? "n/d" : "—"; }
    $("#sFree").textContent = !online.length ? "—" : online.some((s) => s.space && s.space.known) ? "~" + Math.min(...online.filter((s) => s.space && s.space.known).map((s) => s.space.minLeft)) + " min" : online.some((s) => s.bufMB != null) ? Math.min(...online.filter((s) => s.bufMB != null).map((s) => s.maxBufMB - s.bufMB)) + " MB" : Math.min(...online.map((s) => s.freeGb)).toFixed(1) + " GB";
  }
}
function renderLogs() {
  $$("[data-log]").forEach((ol) => {
    const id = ol.dataset.log, rows = logs.filter((l) => !id || l.id === id).slice(0, 40);
    ol.innerHTML = rows.length ? rows.map((l) => `<li><time>${l.t}</time>${esc(l.msg)}</li>`).join("") : '<li class="muted">Nessun evento</li>';
  });
}
