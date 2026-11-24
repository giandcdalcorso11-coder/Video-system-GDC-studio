"use strict";
const Xfer = {
  // la clip è stata registrata prima dell'inizio della sessione attuale della regia
  isOld(k) { return !!(k && k.at && Session.cur && Session.cur.start && k.at < Session.cur.start - 5000); },
  sessTxt(k) { return this.isOld(k) ? (k.sn ? ` · da “${esc(k.sn)}”` : " · da una sessione precedente") : ""; },
  jobs: new Map(), delAfter: store.get("gdc.xdel", false), queueRun: false,
  keepPrev: store.get("gdc.xprev", true), hold: store.get("gdc.xhold", false), auto: store.get("gdc.xauto", false), autoTry: {}, autoNext: {}, autoBusy: {}, autoWarned: false,
  // trasferimento automatico: ogni clip pronta parte da sola (la più vecchia per prima) quando la camera non sta registrando.
  // Con "elimina dal telefono" attivo il telefono tiene solo ciò che non è ancora arrivato (buffer a rotazione).
  async autoTick(camId) {
    if (!this.auto || this.hold || this.autoBusy[camId] || this.queueRun) return;
    const st = state[camId]; if (!st || !st.online || st.rec || st.tl) return;
    if (Dest.mode !== "folder" || !Dest.handle || (Dest.health && !Dest.health.ok)) return;
    if (this.active().some((j) => j.camId === camId)) return;
    if (Object.values(this.autoBusy).filter(Boolean).length >= 2) return;
    const now = Date.now(), clip = [...((st.clips) || [])].reverse().find((k) => k.id && k.status === "pronta" && (this.autoTry[k.id] || 0) < 3 && (this.autoNext[k.id] || 0) <= now);
    if (!clip) return;
    this.autoBusy[camId] = true;
    try {
      let perm = "denied"; try { perm = await Dest.handle.queryPermission({ mode: "readwrite" }); } catch { /* ok */ }
      if (perm !== "granted") { if (!this.autoWarned) { this.autoWarned = true; log("", "Trasferimento automatico fermo: la cartella chiede di nuovo il permesso. Tocca Trasferisci o Cambia cartella una volta."); dbg("warn", "file", "automatico: permesso cartella non concesso"); } return; }
      this.autoWarned = false;
      const c = camById(camId); log(camId, `${c ? camTitle(c) : camId}: trasferimento automatico di ${clip.file}`); dbg("info", "file", `automatico: avvio ${clip.id}`, { MB: clip.mb, elimina: !!this.delAfter });
      const j = await this.start(camId, clip, { auto: true }); if (!j) return;
      await j.promise;
      if (j.state !== "ok") { if (j.userCancel) this.autoTry[clip.id] = 99; else { const n = this.autoTry[clip.id] = (this.autoTry[clip.id] || 0) + 1; this.autoNext[clip.id] = Date.now() + 60000 * n; log(camId, `${c ? camTitle(c) : camId}: automatico non riuscito per ${clip.file}${n < 3 ? ", riprovo tra " + n + " min" : ": mi fermo, usa Trasferisci"}`); } }
    } finally { this.autoBusy[camId] = false; this.refresh(); setTimeout(() => this.autoTick(camId), 1500); }
  },
  autoAll() { Object.keys(state).forEach((id) => this.autoTick(id)); },
  active() { return [...this.jobs.values()].filter((j) => j.state === "attesa" || j.state === "in corso" || j.state === "interrotto"); },
  unsafe() { return this.active().length > 0 || [...this.jobs.values()].some((j) => j.state === "ok" && j.where === "memoria" && !j.saved && !j.test); },
  async pick() {
    try { Dest.handle = await window.showDirectoryPicker({ mode: "readwrite" }); await kv.set("dir", Dest.handle); dbg("info", "file", `cartella scelta: ${Dest.handle.name}`); this.refresh(); return true; }
    catch (e) { if (e.name !== "AbortError") { dbg("error", "file", `scelta cartella: ${e.name}: ${e.message}`); log("", "Cartella non selezionabile: " + e.message); } return false; }
  },
  async ensureDest() {
    if (Dest.mode !== "folder") return true;
    if (!Dest.handle && !(await this.pick())) return false;
    let p = "denied";
    try {
      p = await withTimeout(Dest.handle.queryPermission({ mode: "readwrite" }), 6000, "permesso");
      if (p !== "granted") { log("", `Il browser sta chiedendo il permesso di scrivere nella cartella “${Dest.handle.name}”: rispondi alla richiesta (di solito in alto a sinistra) e riprova.`); dbg("warn", "file", "chiedo il permesso sulla cartella"); p = await withTimeout(Dest.handle.requestPermission({ mode: "readwrite" }), 60000, "richiesta di permesso"); }
    } catch (e) { log("", e.name === "Timeout" ? `La cartella “${Dest.handle.name}” non risponde (${e.message}): disco scollegato o richiesta del browser senza risposta. Nessun trasferimento avviato: i file restano sui telefoni.` : `Cartella non utilizzabile (${e.name}): scegline una di nuovo con “Cambia cartella”.`); dbg("warn", "file", `ensureDest: ${e.name}: ${e.message}`); return false; }
    if (p !== "granted") { log("", "Permesso sulla cartella negato"); return false; }
    const h = await Dest.check(); if (h && !h.ok) { log("", `Cartella “${Dest.handle.name}”: ${h.msg}. Nessun trasferimento avviato: i file restano sul telefono.`); return false; } return true;
  },
  memState: "", memBusy: false,
  // misura quanti dati questo dispositivo regge in memoria (come i file ricevuti senza cartella): prova a tenere blocchi sempre più grandi e riporta fin dove arriva
  // la prova riempie la memoria di blocchi da 256 MB fino a 4 GB: ha senso sull'iPad (dove i file restano in memoria), sul computer lo pianta (visto su Edge)
  memOk() { return /iPad|iPhone/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) || /[?&]mem=1/.test(location.search); },
  async memMeasure() {
    if (!this.memOk()) { log("", "La misura della memoria serve solo su iPad/iPhone: sul computer i file vanno in una cartella."); return; }
    if (this.memBusy) return; this.memBusy = true; const cap = (window.__memCapMB || 4096) * 1048576, step = (window.__memStepMB || 256) * 1048576, blk = new Uint8Array(1048576), t0 = performance.now();
    for (let o = 0; o < blk.length; o += 65536) crypto.getRandomValues(blk.subarray(o, o + 65536));
    const L = (lv, m, d) => { dbg(lv, "memoria", m, d); try { window.GDC_DEV && GDC_DEV.flush(); } catch { /* ok */ } };
    L("info", "=== INIZIO MISURA MEMORIA ===", { tettoProvaMB: Math.round(cap / 1048576), passoMB: Math.round(step / 1048576), ua: navigator.userAgent, memoriaDispositivoGB: navigator.deviceMemory || null });
    const parts = []; let held = 0, esito = "tetto di prova raggiunto senza errori (la memoria reale è almeno questa)";
    try {
      while (held < cap) {
        for (let i = 0; i < step / 1048576; i++) parts.push(blk.slice().buffer); held += step; this.memState = `${Math.round(held / 1048576)} MB`;
        store.set("gdc.memTest", { running: true, mb: Math.round(held / 1048576), at: Date.now() }); this.refresh();
        const b = new Blob(parts.map((x) => new Blob([x]))), back = await b.slice(0, 65536).arrayBuffer(); if (b.size !== held || back.byteLength !== 65536) throw new Error("il blocco riletto non coincide");
        L("info", `reggo ${Math.round(held / 1048576)} MB in memoria`, { secondi: Math.round((performance.now() - t0) / 1000) });
        await new Promise((r) => setTimeout(r, 3300)); // lascia il tempo di inviare il log prima del passo successivo: se la pagina viene chiusa dal sistema, l'ultimo passo riuscito è già registrato
      }
    } catch (e) { esito = `errore a ${Math.round(held / 1048576)} MB: ${e.name}: ${e.message}`; }
    parts.length = 0; store.set("gdc.memTest", null); this.memState = ""; this.memBusy = false; this.refresh();
    L("info", "=== MISURA MEMORIA COMPLETATA ===", { tenutiMB: Math.round(held / 1048576), esito, secondi: Math.round((performance.now() - t0) / 1000) });
  },
  byX: new Map(), MAXTRY: 6, MEMMAX: window.__memMax || 1.5 * 1073741824,
  // sull'iPad (e senza cartella) i file arrivano in memoria finché non tocchi Salva: la memoria della pagina è limitata, quindi si tiene un tetto
  pendingMem() { return [...this.jobs.values()].filter((j) => !j.test && j.where !== "cartella" && !j.saved && (j.state === "ok" ? j.blob : (j.state === "in corso" || j.state === "interrotto" || j.state === "attesa") && j.dest === "device")).reduce((a, j) => a + (j.state === "ok" ? j.blob.size : j.got || 0), 0); },
  async start(camId, clip, opt = {}) {
    if (!opt.test && !(await this.ensureDest())) return null;
    if (!opt.test && Dest.mode === "device" && clip) {
      const pend = this.pendingMem(), need = Math.max(clip.mb || 0, 1) * 1048576;
      if (pend > 0 && pend + need > this.MEMMAX) { log(camId, `Memoria di questo dispositivo quasi piena (${fmtMB(pend)} da salvare): tocca Salva sui file arrivati, poi riprova. I file restano sul telefono.`); dbg("warn", "file", `memoria piena: in attesa ${pend} byte, richiesti ${need}`); return null; }
      if (need > this.MEMMAX) log(camId, `Il file è grande (${fmtMB(need)}): in memoria potrebbe non starci. Meglio una cartella di un computer.`);
    }
    if (!opt.test && clip) { const dup = [...this.jobs.values()].find((j) => !j.test && j.camId === camId && j.sid === clip.id && (j.state === "attesa" || j.state === "in corso" || j.state === "interrotto")); if (dup) { dbg("info", "file", `richiesta doppia ignorata: ${clip.file} è già in trasferimento`); return dup; } }
    const id = "j" + rid() + rid(); if (!opt.auto && clip) delete this.autoTry[clip.id];
    const job = { id, xid: "", camId, sid: clip ? clip.id : null, name: clip ? clip.file : "prova-rete.bin", size: opt.test ? opt.mb * 1048576 : (clip ? clip.mb * 1048576 : 0), got: 0, speed: 0, state: "attesa", at: Date.now(), saved: false, test: !!opt.test, path: "", error: "", note: "", attempt: 0, userCancel: false, st: { sink: null, got: 0, crc: 0 }, dest: Dest.mode, handle: Dest.handle, clip, opt };
    this.jobs.set(id, job); Preview.ensureAll(); job.promise = this.runJob(job); this.refresh(); return job;
  },
  // un tentativo: nuova connessione, stesso stato ricevuto fin qui (si riprende dal byte in cui ci si era fermati)
  attempt(job) {
    const c = camById(job.camId), xid = "x" + rid() + rid(); job.xid = xid; job.camError = ""; this.byX.set(xid, job); job.state = "attesa";
    const makeSink = job.test ? GDC_XFER.nullSink() : job.dest === "folder" ? GDC_XFER.folderSink(job.handle) : GDC_XFER.memorySink();
    const o = { rt: transport.rt, from: transport.id, to: job.camId, xid, makeSink, state: job.st, log: (l, m) => dbg(l, "trasferimento", m),
      onProgress: (x) => { job.state = "in corso"; job.got = x.got; if (x.size) job.size = Math.max(job.size, x.got); job.speed = x.speed; this.refresh(); },
      onInfo: (i) => { if (i.path) job.path = i.path; if (i.name && !job.test) job.fname = i.name; this.refresh(); } };
    job.opts = o;
    const p = GDC_XFER.receiveFile(o).then((r) => { Object.assign(job, { state: "ok", where: r.where, blob: r.blob, fname: r.name, got: r.bytes, size: r.bytes, mbps: r.mbps, ms: r.ms, note: "" }); log(job.camId, `${c ? camTitle(c) : job.camId}: ${job.test ? "prova di rete" : "file " + r.name + " arrivato e verificato"} (${fmtMB(r.bytes)}, ${r.mbps.toFixed(2)} Mbps)`); });
    command(job.camId, job.test ? { cmd: "xfer_test", xid, mb: job.opt.mb } : { cmd: "xfer_start", xid, sid: job.sid, del: !!(this.delAfter && !this.hold) });
    return p;
  },
  async runJob(job) {
    const c = camById(job.camId);
    for (;;) {
      const g0 = job.st.got; let err = null; try { await this.attempt(job); } catch (e) { err = e; }
      if (!err) break;
      if (err.sink && job.dest === "folder" && !job.test && !job.userCancel) {
        // la cartella non risponde: si scarta il file parziale e si aspetta che torni; la clip resta sul telefono
        try { job.st.sink && await job.st.sink.abort(); } catch { /* ok */ } job.st.sink = null; job.st.got = 0; job.st.crc = 0; job.got = 0;
        job.state = "interrotto"; job.note = `La cartella non è raggiungibile (${err.name === "QuotaExceededError" ? "disco pieno" : "disco scollegato o spento?"}). ${err.name === "QuotaExceededError" ? "Libera spazio o scegli un'altra cartella (Cambia cartella): riparto da solo." : "Riconnettila o scegli un'altra cartella: riparto da solo."} Il file resta sul telefono.`;
        dbg("warn", "trasferimento", `cartella non scrivibile (${err.name}: ${err.message}): in attesa`); log(job.camId, `${c ? camTitle(c) : job.camId}: ${job.note}`); this.refresh();
        for (;;) { await new Promise((r) => setTimeout(r, 4000)); if (job.userCancel || Dest.mode !== "folder") break; if (Dest.handle && Dest.handle !== job.handle) { job.handle = Dest.handle; dbg("info", "trasferimento", `cartella cambiata: uso ${Dest.handle.name}`); } const h = await Dest.check(); if (h && h.ok) break; }
        if (job.userCancel || Dest.mode !== "folder") { job.state = "errore"; job.error = job.userCancel ? "annullato" : "destinazione cambiata: riprova"; break; }
        continue;
      }
      if (job.st.got > g0) job.attempt = 0; // i tentativi si contano solo se non si avanza: su una rete lenta ma che avanza si può riprendere a lungo
      const fatalCam = /non trovata|nessun dato|registrazione ancora in corso|incompleta|annullato dalla dashboard/.test(job.camError || ""); // solo gli errori sulla registrazione sono definitivi; quelli di rete si riprovano
      if (job.userCancel) { job.state = "errore"; job.error = "annullato"; break; }
      if (!job.test && !fatalCam && job.attempt < this.MAXTRY) {
        job.attempt++; job.state = "interrotto"; job.note = `interrotto (${job.camError || err.message}). Riprendo da ${fmtMB(job.st.got)}: tentativo ${job.attempt}/${this.MAXTRY}`;
        dbg("warn", "trasferimento", job.note); log(job.camId, `${c ? camTitle(c) : job.camId}: ${job.note}`); this.refresh();
        await new Promise((r) => setTimeout(r, 6000)); if (job.userCancel) { job.state = "errore"; job.error = "annullato"; break; }
        continue;
      }
      job.state = "errore"; job.error = job.camError || err.message; log(job.camId, `${c ? camTitle(c) : job.camId}: trasferimento non riuscito: ${job.error}`); break;
    }
    if (job.state === "errore" && job.userCancel) { try { job.st.sink && await job.st.sink.abort(); } catch { /* ok */ } job.st.sink = null; job.st.got = 0; job.st.crc = 0; }
    this.refresh(); Preview.ensureAll(); return job;
  },
  resume(id) { const j = this.jobs.get(id); if (!j || j.state !== "errore" || j.test) return; j.attempt = 0; j.userCancel = false; j.error = ""; j.note = ""; j.promise = this.runJob(j); this.refresh(); },
  onDone(m) { const j = this.byX.get(m.xid); if (!j || m.ok) return; j.camError = m.error; if (j.opts && j.opts.stop) j.opts.stop("la camera ha risposto: " + m.error); },
  async all(camId) {
    if (this.queueRun) return; this.queueRun = true; this.refresh();
    try { const clips = ((state[camId] && state[camId].clips) || []).filter((k) => k.status === "pronta" && k.id); if (!(await this.ensureDest())) return; for (const k of clips) { const j = await this.start(camId, k); if (!j) break; await j.promise; if (j.state !== "ok") break; } }
    finally { this.queueRun = false; this.refresh(); }
  },
  async save(id) {
    const j = this.jobs.get(id); if (!j || !j.blob) return;
    const f = new File([j.blob], j.fname || j.name, { type: j.blob.type });
    try { if (navigator.canShare && navigator.canShare({ files: [f] })) await navigator.share({ files: [f] }); else { const a = document.createElement("a"); a.href = URL.createObjectURL(j.blob); a.download = f.name; document.body.appendChild(a); a.click(); a.remove(); } j.saved = true; j.blob = null; }
    catch (e) { if (e.name !== "AbortError") log(j.camId, "Salvataggio non riuscito: " + e.message); }
    this.refresh();
  },
  cancel(id) { const j = this.jobs.get(id); if (!j) return; j.userCancel = true; if (j.opts && j.opts.cancel) j.opts.cancel(); },
  settings(id) {
    return `        <div class="muted" style="margin-bottom:6px">Destinazione dei file</div>
        <div class="row" style="gap:12px;align-items:center">
          ${FS ? `<label style="margin:0"><input type="radio" name="dst${esc(id)}" data-xm="folder" ${Dest.mode === "folder" ? "checked" : ""}> Cartella di questo computer</label>` : ""}
          <label style="margin:0"><input type="radio" name="dst${esc(id)}" data-xm="device" ${Dest.mode === "device" ? "checked" : ""}> Questo dispositivo (poi Salva / Condividi)</label>
        </div>
        ${Dest.mode === "folder" ? `<div class="row" style="margin-top:6px;gap:8px;align-items:center"><span class="muted">${Dest.handle ? "Cartella: <b>" + esc(Dest.handle.name) + "</b>" : "Nessuna cartella scelta"}</span><button class="ghost" data-xf="pick">${Dest.handle ? "Cambia cartella" : "Scegli cartella"}</button>${Dest.handle ? `<button class="ghost" data-xf="chk">Verifica cartella</button>` : ""}</div>${Dest.handle && Dest.health ? `<div style="margin-top:4px;font-size:13px;color:${Dest.health.ok ? "var(--ok,#2a9d5c)" : "var(--bad,#d93025)"}">${Dest.health.ok ? "✓ " : "⚠ "}${esc(Dest.health.msg)}</div>` : ""}${Dest.handle && !Dest.health ? `<div style="margin-top:4px;font-size:13px;color:var(--warn,#c77d00)">⏳ Controllo della cartella in corso… Se non finisce in pochi secondi: disco scollegato o permesso da confermare. Tocca “Verifica cartella”.</div>` : ""}` : `<div class="muted" style="margin-top:6px">${FS ? "" : "Questo browser non può scegliere una cartella: i file restano in memoria finché non li salvi con “Salva”. "}Salva ogni file appena arriva.</div>`}
        ${Dest.mode === "device" && this.pendingMem() > 0 ? `<div style="margin-top:8px;font-size:13px;color:${this.pendingMem() > this.MEMMAX * 0.7 ? "var(--bad,#d93025)" : "var(--warn,#c77d00)"}">In memoria da salvare: ${fmtMB(this.pendingMem())} su ${fmtMB(this.MEMMAX)}${this.pendingMem() > this.MEMMAX * 0.7 ? ". Tocca Salva prima di trasferire altro." : "."}</div>` : ""}
        <label style="display:flex;gap:8px;align-items:center;margin:8px 0 0"><input type="checkbox" data-xf="hold" style="width:auto;min-height:0" ${this.hold ? "checked" : ""}> Tieni i file sui telefoni: non trasferire durante la sessione</label>
        <div class="muted" style="margin:2px 0 0 26px;font-size:13px">${this.hold ? "Nessun trasferimento parte da solo e nulla viene eliminato dai telefoni. Scarichi tutto dopo, con “Trasferisci tutte le clip pronte”." : "Utile con una rete debole o con l'iPad come regia."}</div>
        <label style="display:flex;gap:8px;align-items:center;margin:8px 0 0"><input type="checkbox" data-xf="del" style="width:auto;min-height:0" ${this.delAfter && !this.hold ? "checked" : ""} ${this.hold ? "disabled" : ""}> Elimina dal telefono dopo il trasferimento verificato</label>
        <label style="display:flex;gap:8px;align-items:center;margin:8px 0 0"><input type="checkbox" data-xf="auto" style="width:auto;min-height:0" ${this.auto && !this.hold ? "checked" : ""} ${Dest.mode === "folder" && Dest.handle && !this.hold ? "" : "disabled"}> Trasferisci da solo ogni clip appena fermo la registrazione</label>
        <div class="muted" style="margin:2px 0 0 26px;font-size:13px">${Dest.mode !== "folder" || !Dest.handle ? "Serve una cartella di questo computer: sull'iPad i file vanno salvati a mano." : this.auto && this.delAfter ? "Buffer a rotazione attivo: il telefono tiene solo le clip non ancora arrivate." : this.auto ? "Attiva anche “Elimina dal telefono” per liberare spazio man mano." : "Parte quando nessuna ripresa è in corso."}${this.auto ? (this.autoBusy[id] ? " · trasferimento automatico in corso" : "") : ""}</div>
        <label style="display:flex;gap:8px;align-items:center;margin:8px 0 0"><input type="checkbox" data-xf="prev" style="width:auto;min-height:0" ${this.keepPrev ? "checked" : ""}> Tieni l'anteprima accesa durante i trasferimenti</label>
        <div class="muted" style="margin:2px 0 0 26px;font-size:13px">${this.keepPrev ? "⚠ Con una rete debole il trasferimento può rallentare o interrompersi, ma nessun file va perso: resta sul telefono finché non è arrivato e verificato, e il trasferimento riprende da dove si era fermato (se si ferma del tutto, tocca Riprendi). Se rallenta troppo, spegni questa spunta." : "Durante un trasferimento l'anteprima si ferma per lasciare tutta la rete al file e riparte alla fine."}</div>`;
  },
  /* riquadro nella home: la destinazione dei file vale per tutte le camere */
  renderGlobal() {
    const el = document.getElementById("xferGlobal"); if (!el) return;
    const ids = Object.keys(state).filter((id) => state[id] && state[id].online), ready = ids.reduce((n, id) => n + ((state[id].clips || []).filter((k) => k.id && k.status === "pronta").length), 0);
    const oldK = ids.flatMap((id) => (state[id].clips || []).filter((k) => k.id && k.status === "pronta" && this.isOld(k))), oldN = oldK.length, oldMB = oldK.reduce((a, k) => a + (k.mb || 0), 0), extra = ids.reduce((n, id) => n + Math.max(0, (state[id].clipsTot || 0) - (state[id].clips || []).length), 0);
    const sig = JSON.stringify([oldN, oldMB, extra, Dest.mode, Dest.handle && Dest.handle.name, Dest.health && Dest.health.msg, this.hold, this.delAfter, this.auto, this.keepPrev, FS, this.queueRun, ready, ids.length, Dest.mode === "device" ? Math.round(this.pendingMem() / 1048576) : 0, Object.values(this.autoBusy).filter(Boolean).length]);
    if (el.dataset.sig === sig) return; el.dataset.sig = sig;
    el.innerHTML = `<h2>File dei video · tutte le camere</h2><div class="muted" style="margin-bottom:8px;font-size:13px">Dove vanno i file e quando partono i trasferimenti, per tutte le camere insieme. Nella pagina di ogni camera trovi le stesse impostazioni.</div>${this.settings("g")}
      ${oldN ? `<div style="margin-top:10px;color:var(--warn,#c77d00)">⚠ ${oldN} clip di sessioni precedenti sono ancora sui telefoni (~${oldMB} MB): trasferiscile prima che il telefono le perda.</div>` : ""}${extra ? `<div class="muted" style="margin-top:6px;font-size:13px">Sui telefoni ci sono altre ${extra} clip oltre alle più recenti elencate qui: le trovi nella pagina di ogni camera.</div>` : ""}
      <div class="row" style="margin-top:10px"><button class="primary" data-xf="allcams" ${ready && !this.queueRun ? "" : "disabled"}>Trasferisci tutte le clip pronte di tutte le camere${ready ? " (" + ready + ")" : ""}</button></div>`;
  },
  /* barre dei trasferimenti nella home: tutte le camere, chi sta scaricando cosa e a che punto è */
  renderLive() {
    const el = document.getElementById("xferLive"); if (!el) return;
    const seen = new Set(), jobs = [...this.jobs.values()].filter((j) => !j.test).sort((a, b) => b.at - a.at).filter((j) => { const k = j.camId + "|" + (j.sid || j.id); if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 8); // una barra per clip: i tentativi ripetuti non fanno sembrare più camere
    const term = (j) => j.state === "ok" || j.state === "errore";
    jobs.forEach((j) => { if (term(j) && !j.endSeen) j.endSeen = Date.now(); });
    const recent = jobs.filter((j) => !term(j) || Date.now() - j.endSeen < 90000); // quelli finiti restano visibili per 90 s
    el.hidden = !recent.length;
    if (!recent.length) { el.dataset.sig = ""; return; }
    const sig = JSON.stringify(recent.map((j) => [j.id, j.state, j.error, j.where, j.saved, j.note, j.path, j.attempt]));
    if (el.dataset.sig !== sig) {
      el.dataset.sig = sig;
      el.innerHTML = `<h2>Trasferimenti</h2>` + recent.map((j) => { const c = camById(j.camId); return `<div class="xj" style="margin-top:8px"><div>${esc(c ? camTitle(c) : j.camId)} · ${esc(j.fname || j.name)} <span class="muted" data-gt="${j.id}"></span></div>
        <div data-gp="${j.id}" style="height:10px;background:var(--panel-2);border-radius:6px;overflow:hidden;margin:4px 0"><i style="display:block;height:100%;width:0;background:var(--ok,#2a9d5c)"></i></div>
        <div class="muted">${j.state === "errore" ? `<span class="err">${esc(j.error)}</span>` : j.state === "ok" ? (j.where === "memoria" && !j.saved ? "Arrivato in memoria: tocca Salva (nella pagina della camera)" : j.where === "memoria" ? "Salvato" : "Salvato nella cartella ✓ verificato") : (j.state === "interrotto" ? esc(j.note) : "Trasferimento in corso…")}${j.path ? " · " + esc(j.path) : ""}</div></div>`; }).join("");
    }
    recent.forEach((j) => {
      const pb = el.querySelector(`[data-gp="${j.id}"] i`), tx = el.querySelector(`[data-gt="${j.id}"]`); if (!pb) return;
      const pct = j.state === "ok" ? 100 : j.size ? Math.min(100, Math.round(j.got / j.size * 100)) : 0; pb.style.width = pct + "%";
      const left = j.speed > 0 && j.size > j.got ? Math.round((j.size - j.got) / j.speed) : 0;
      tx.textContent = j.state === "in corso" || j.state === "attesa" ? `· ${pct}% · ${fmtMB(j.got)} · ${j.speed ? (j.speed * 8 / 1e6).toFixed(1) + " Mbps" : ""}${left ? " · circa " + (left >= 60 ? Math.round(left / 60) + " min" : left + " s") : ""}` : j.state === "ok" ? `· ${fmtMB(j.got)} · ${j.mbps ? j.mbps.toFixed(1) + " Mbps" : ""}` : "";
    });
  },
  async allCams() { if (this.queueRun) return; for (const id of Object.keys(state).filter((i) => state[i] && state[i].online)) { if (!((state[id].clips || []).some((k) => k.id && k.status === "pronta"))) continue; await this.all(id); } },
  refresh() { $$('[data-bind="xferUi"]').forEach((el) => { const id = el.dataset.cam; const c = camById(id); if (c) this.render(state[id], c, el); }); this.renderGlobal(); this.renderLive(); },
  render(st, c, el) {
    const id = c.id, clips = ((st && st.clips) || []).filter((k) => k.id), jobs = [...this.jobs.values()].filter((j) => j.camId === id).sort((a, b) => a.at - b.at).slice(-6);
    const act = jobs.some((j) => j.state === "attesa" || j.state === "in corso" || j.state === "interrotto"), online = !!(st && st.online);
    const sig = JSON.stringify([clips.map((k) => [k.id, k.status, k.mb, k.kind]), jobs.map((j) => [j.id, j.state, j.saved, j.error, j.path, j.where, j.note, j.attempt]), Dest.mode, Dest.handle && Dest.handle.name, this.memState, Dest.health && Dest.health.msg, this.hold, Dest.mode === "device" ? Math.round(this.pendingMem() / 1048576) : 0, this.delAfter, this.auto, this.keepPrev, !!this.autoBusy[id], online, FS, act, this.queueRun]);
    if (el.dataset.sig !== sig) {
      el.dataset.sig = sig;
      const free = clips.filter((k) => k.status === "pronta").length;
      el.innerHTML = `<h2>File</h2>
        <div class="muted" style="margin-bottom:8px;font-size:13px">Queste impostazioni valgono per <b>tutte le camere</b>: sono le stesse della home.</div>
        ${this.settings(id)}
        <div style="margin-top:10px"><b>Clip sul telefono</b></div>
        <ol class="list" style="max-height:none">${clips.length ? clips.map((k) => `<li>${esc(k.file)} <span class="muted">· ${k.kind === "timelapse" ? "time-lapse · " : ""}${fmtTime(k.dur)} · ~${k.mb} MB · ${esc(k.status)}${this.sessTxt(k)}</span> ${k.status === "pronta" || k.status === "inviata" ? `<button class="ghost" data-xf="go" data-sid="${esc(k.id)}" ${online && !act ? "" : "disabled"}>${k.status === "inviata" ? "Trasferisci di nuovo" : "Trasferisci"}</button>` : ""}</li>`).join("") : `<li class="muted">Nessuna clip sul telefono.</li>`}</ol>
        <div class="row" style="margin-top:8px"><button class="primary" data-xf="all" ${online && !act && !this.queueRun && free ? "" : "disabled"}>Trasferisci tutte le clip pronte${free ? " (" + free + ")" : ""}</button><button class="ghost adv-only" data-xf="test" ${online && !act ? "" : "disabled"}>Prova velocità rete (circa 8 s)</button>${this.memOk() ? `<button class="ghost adv-only" data-xf="mem" ${this.memBusy ? "disabled" : ""}>${this.memBusy ? "Misuro… " + this.memState : "Misura memoria di questo dispositivo"}</button>` : `<span class="muted adv-only" style="font-size:13px">La misura della memoria serve solo su iPad/iPhone: sul computer i file vanno in una cartella e il test rallenterebbe il computer.</span>`}</div>
        ${jobs.length ? `<div style="margin-top:12px"><b>Trasferimenti</b></div>` + jobs.map((j) => `<div class="xj" style="margin-top:8px"><div>${esc(j.test ? "Prova di rete" : (j.fname || j.name))} <span class="muted" data-xt="${j.id}"></span></div>
          <div data-xp="${j.id}" style="height:8px;background:var(--panel-2);border-radius:6px;overflow:hidden;margin:4px 0"><i style="display:block;height:100%;width:0;background:var(--ok,#2a9d5c)"></i></div>
          <div class="muted">${j.state === "errore" ? `<span class="err">${esc(j.error)}</span>` : j.state === "ok" ? (j.where === "memoria" && !j.saved ? "Arrivato in memoria: tocca Salva" : j.where === "memoria" ? "Salvato" : j.where === "cartella" ? "Salvato nella cartella" : "Prova completata") : (j.state === "interrotto" ? esc(j.note) : "Trasferimento…")} ${j.path ? "· " + esc(j.path) : ""}</div>
          <div class="row" style="gap:8px">${j.state === "ok" && j.where === "memoria" && !j.saved ? `<button class="primary" data-xf="save" data-xid="${j.id}">Salva</button>` : ""}${j.state === "errore" && !j.test && !j.userCancel ? `<button class="primary" data-xf="resume" data-xid="${j.id}">${j.st && j.st.got ? "Riprendi da " + fmtMB(j.st.got) : "Riprova"}</button>` : ""}${j.state === "attesa" || j.state === "in corso" || j.state === "interrotto" ? `<button class="ghost" data-xf="cancel" data-xid="${j.id}">Annulla</button>` : ""}</div></div>`).join("") : ""}
        <div data-xs style="margin-top:12px;font-weight:600"></div>`;
    }
    jobs.forEach((j) => {
      const pb = el.querySelector(`[data-xp="${j.id}"] i`), tx = el.querySelector(`[data-xt="${j.id}"]`); if (!pb) return;
      const pct = j.state === "ok" ? 100 : j.size ? Math.min(100, Math.round(j.got / j.size * 100)) : 0; pb.style.width = pct + "%";
      const left = j.speed > 0 && j.size > j.got ? Math.round((j.size - j.got) / j.speed) : 0;
      tx.textContent = j.state === "in corso" || j.state === "attesa" ? `· ${pct}% · ${fmtMB(j.got)} · ${j.speed ? (j.speed * 8 / 1e6).toFixed(1) + " Mbps" : ""}${left ? " · circa " + (left >= 60 ? Math.round(left / 60) + " min" : left + " s") : ""}` : j.state === "ok" ? `· ${fmtMB(j.got)} · ${j.mbps ? j.mbps.toFixed(1) + " Mbps" : ""}` : "";
    });
    const s = el.querySelector("[data-xs]"); if (s) {
      const all = clips.length && clips.every((k) => k.status === "inviata");
      if (act) { s.textContent = "⏳ Trasferimento in corso: non chiudere questa pagina e lascia la camera aperta"; s.style.color = "var(--warn,#c77d00)"; }
      else if (this.unsafe()) { s.textContent = "⚠ File in memoria non ancora salvati: tocca Salva prima di chiudere"; s.style.color = "var(--warn,#c77d00)"; }
      else if (all && jobs.some((j) => j.state === "ok")) { s.textContent = "✓ Sicuro da chiudere: tutti i file sono arrivati e verificati"; s.style.color = "var(--ok,#2a9d5c)"; }
      else { s.textContent = ""; }
    }
  },
};
addEventListener("beforeunload", (e) => { if (Xfer.unsafe()) { e.preventDefault(); e.returnValue = ""; } });
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-xf]"); if (!b || b.tagName === "INPUT") return; const pn = b.closest("[data-cam]"), id = pn && pn.dataset.cam, a = b.dataset.xf; if (!id && !["pick", "chk", "allcams"].includes(a)) return;
  dbg("info", "file", `clic: ${a}${id ? " su " + id : " (tutte le camere)"} · destinazione ${Dest.mode}${Dest.handle ? " “" + Dest.handle.name + "”" : ""}, cartella ${Dest.health ? (Dest.health.ok ? "ok" : "problema: " + Dest.health.msg) : "non verificata"}, automatico ${Xfer.auto}, tieni i file ${Xfer.hold}`);
  if (a === "allcams") { Xfer.allCams(); return; }
  if (a === "mem") Xfer.memMeasure(); else if (a === "chk") { Dest.health = null; Xfer.ensureDest().then(() => Dest.check()).then(() => Xfer.refresh()); } else if (a === "pick") Xfer.pick().then(() => Dest.check()); else if (a === "all") Xfer.all(id); else if (a === "test") Xfer.start(id, null, { test: true, mb: 30 });
  else if (a === "go") { const k = ((state[id] && state[id].clips) || []).find((x) => x.id === b.dataset.sid); if (k) Xfer.start(id, k); }
  else if (a === "save") Xfer.save(b.dataset.xid); else if (a === "cancel") Xfer.cancel(b.dataset.xid); else if (a === "resume") Xfer.resume(b.dataset.xid);
});
document.addEventListener("change", (e) => {
  const m = e.target.closest("[data-xm]"); if (m) { Dest.mode = m.dataset.xm; store.set("gdc.dest", Dest.mode); dbg("info", "file", `destinazione: ${Dest.mode}`); Xfer.refresh(); return; }
  if (e.target.matches('[data-xf="prev"]')) { Xfer.keepPrev = e.target.checked; store.set("gdc.xprev", Xfer.keepPrev); dbg("info", "file", `anteprima durante i trasferimenti: ${Xfer.keepPrev ? "accesa" : "sospesa"}`); Xfer.refresh(); Preview.ensureAll(); return; }
  if (e.target.matches('[data-xf="hold"]')) { Xfer.hold = e.target.checked; store.set("gdc.xhold", Xfer.hold); dbg("info", "file", `i file restano sui telefoni: ${Xfer.hold}`); Xfer.refresh(); if (!Xfer.hold) Xfer.autoAll(); return; }
  if (e.target.matches('[data-xf="auto"]')) { Xfer.auto = e.target.checked; store.set("gdc.xauto", Xfer.auto); dbg("info", "file", `trasferimento automatico: ${Xfer.auto}`); Xfer.refresh(); Xfer.autoAll(); return; }
  if (e.target.matches('[data-xf="del"]')) { Xfer.delAfter = e.target.checked; store.set("gdc.xdel", Xfer.delAfter); dbg("info", "file", `elimina dal telefono dopo il trasferimento: ${Xfer.delAfter}`); Xfer.refresh(); }
});
