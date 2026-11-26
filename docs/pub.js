/* Modalità Pubblica (test): configurazione incorporata, tema scuro del mockup e funzioni comuni a regia e camera.
   La chiave "publishable" di Supabase è pensata per stare nelle pagine pubbliche (non è un segreto); i permessi veri stanno nelle regole del database.
   Quando ci sarà l'account dedicato basterà cambiare questi due valori. */
(function () {
  const CFG = { u: "https://mjcnvpwjvwrucwjptgiu.supabase.co", k: "sb_publishable_yrBSyHO-zale430dzkr1qA_dhssgD5g" };
  // tipi di attività (mockup "Che cosa riprendi?"): per ora solo il nome e la riga; i valori di partenza veri arrivano dopo le prove
  const PRESETS = [
    { id: "generico", name: "Generico", note: "Studio, creator, prove. Camera 1, Camera 2…" },
    { id: "sport", name: "Sport", note: "Partite lunghe: i file restano sui telefoni, REC dal telefono acceso." },
    { id: "kart", name: "Go-kart ed escape room", note: "Camere fisse e POV. Pista 1, Stanza 1… Trasferimento automatico." },
    { id: "locali", name: "Locali ed eventi", note: "Serate e discoteche: luce bassa, torcia e bianco a portata di mano." },
  ];
  const COLORS = [{ id: "verde", hex: "#3DDC97", name: "Verde" }, { id: "rosso", hex: "#FF5A4A", name: "Rosso" }, { id: "arancio", hex: "#FFB84D", name: "Arancio" }, { id: "blu", hex: "#5AA9FF", name: "Blu" }, { id: "viola", hex: "#B58CFF", name: "Viola" }];
  const HOURS = [4, 12, 24];
  const store = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ok */ } } };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const LOGO = `<svg width="26" height="26" viewBox="0 0 28 28" fill="none" aria-hidden="true"><circle cx="14" cy="14" r="12" stroke="#F3F4F6" stroke-width="2"/><circle cx="14" cy="14" r="5" fill="#FF5A4A"/></svg>`;
  const css = `
body.pub{--bg:#0E1013;--panel:#171A1F;--panel-2:#1E232A;--text:#F3F4F6;--muted:#A9B0BB;--line:#2C313A;--rec:#FF5A4A;--bad:#FF5A4A;--ok:#3DDC97;--warn:#FFB84D;--accent:var(--session,#3DDC97);--shadow:none;color-scheme:dark;background:#0E1013;color:#F3F4F6;font-family:'Inter',system-ui,-apple-system,'Segoe UI',sans-serif}
body.pub h1,body.pub h2,body.pub .pb-h{font-family:'Space Grotesk','Inter',system-ui,sans-serif}
body.pub button.primary{color:#0E1013}
body.pub .panel,body.pub .card{border-radius:18px}
#pubHome{position:fixed;inset:0;z-index:40;overflow:auto;background:#0E1013;color:#F3F4F6;font-family:'Inter',system-ui,-apple-system,'Segoe UI',sans-serif;-webkit-text-size-adjust:100%}
#pubHome *{box-sizing:border-box}
#pubHome .pb-top{display:flex;align-items:center;gap:12px;padding:20px max(5vw,16px);padding-top:max(20px,env(safe-area-inset-top))}
#pubHome .pb-top .nm{font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:18px;flex:1}
#pubHome .pb-top .nm span{color:#A9B0BB;font-weight:500}
#pubHome .pb-top.line{border-bottom:1px solid #2C313A}
#pubHome .pb-back{background:none;border:0;color:#A9B0BB;font:inherit;font-size:15px;min-height:44px;padding:0 4px;cursor:pointer}
#pubHome .pb-main{max-width:1180px;margin:0 auto;padding:12px max(5vw,16px) 48px}
#pubHome .pb-hero{display:grid;grid-template-columns:1fr 520px;gap:80px;align-items:center;min-height:60vh}
#pubHome h1{margin:0;font-weight:700;font-size:clamp(34px,6vw,56px);line-height:1.06;letter-spacing:-.5px}
#pubHome .lead{margin:16px 0 0;font-size:clamp(16px,2.2vw,19px);line-height:1.5;color:#A9B0BB;max-width:480px}
#pubHome .pb-cards{display:flex;flex-direction:column;gap:16px}
#pubHome .pb-card{display:flex;align-items:center;gap:16px;width:100%;text-align:left;background:#171A1F;border:1px solid #2C313A;border-radius:20px;padding:24px 22px;color:inherit;font:inherit;cursor:pointer;min-height:44px}
#pubHome .pb-card:active{transform:scale(.99)} #pubHome .pb-card:hover{border-color:#3a414d}
#pubHome .pb-card .tx{flex:1;display:flex;flex-direction:column;gap:6px}
#pubHome .pb-card .tg{font-size:12px;font-weight:600;letter-spacing:1.4px}
#pubHome .pb-card .tt{font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:24px}
#pubHome .pb-card .ds{font-size:15px;line-height:1.45;color:#A9B0BB}
#pubHome .pb-note{font-size:13px;color:#A9B0BB;line-height:1.5;padding:4px 2px}
#pubHome .pb-step{font-size:12px;font-weight:600;letter-spacing:1.4px;color:#3DDC97}
#pubHome h2{margin:6px 0 6px;font-weight:700;font-size:clamp(26px,4.5vw,34px);line-height:1.1;color:#F3F4F6;text-transform:none;letter-spacing:0}
#pubHome .sub{margin:0;font-size:15px;line-height:1.5;color:#A9B0BB}
#pubHome .pb-cols{display:grid;grid-template-columns:1fr 380px;gap:64px;padding-top:24px}
#pubHome .pb-types{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:20px 0}
#pubHome .pb-type{display:flex;flex-direction:column;gap:5px;text-align:left;padding:16px 18px;border-radius:18px;background:#171A1F;border:1px solid #2C313A;color:inherit;font:inherit;cursor:pointer;min-height:44px}
#pubHome .pb-type[aria-pressed="true"]{border:2px solid #F3F4F6;padding:15px 17px}
#pubHome .pb-type b{font-family:'Space Grotesk',sans-serif;font-size:18px} #pubHome .pb-type span{font-size:13px;line-height:1.45;color:#A9B0BB}
#pubHome .pb-row{display:flex;gap:20px;flex-wrap:wrap;align-items:flex-end}
#pubHome label.f{display:block;font-size:13px;color:#A9B0BB;margin:0 0 8px}
#pubHome input[type=text]{width:100%;height:50px;border-radius:14px;background:#171A1F;border:1px solid #2C313A;color:#F3F4F6;font:600 17px 'Inter',sans-serif;padding:0 16px}
#pubHome input[type=text]:focus{outline:2px solid #5AA9FF;outline-offset:1px}
#pubHome .pb-cols-c{display:flex;gap:10px;align-items:center;height:50px}
#pubHome .col{width:34px;height:34px;border-radius:50%;border:3px solid transparent;padding:0;min-height:0;margin:0;cursor:pointer}
#pubHome .col[aria-pressed="true"]{border-color:#F3F4F6}
#pubHome .pb-prev{border-radius:22px;background:#171A1F;border:1px solid #2C313A;padding:20px;display:flex;flex-direction:column;gap:14px}
#pubHome .pb-prev .lb{font-size:12px;font-weight:600;letter-spacing:1.4px;color:#A9B0BB;margin-bottom:10px;display:block}
#pubHome .pb-fake{height:230px;border-radius:12px;background:#0B0D10;display:flex;align-items:center;justify-content:center;overflow:hidden}
#pubHome .pb-fake i{display:block;width:129px;height:230px;background:linear-gradient(180deg,#2f5a4a 0%,#13241d 62%,#0c0f14 100%);position:relative}
#pubHome .pb-fake i:after{content:"";position:absolute;left:34%;width:32%;bottom:30%;height:26%;background:#cfe6da;border-radius:6px;opacity:.88}
#pubHome .pb-btnrow{display:flex;gap:8px} #pubHome .pb-btnrow div{flex:1;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;border:1px solid #2C313A}
#pubHome .pb-pro{padding:14px 16px;border-radius:16px;background:#2A2113;border:1px solid #5A4318;font-size:13px;line-height:1.5;color:#F3D9A8}
#pubHome .pb-cta{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;height:54px;border-radius:14px;border:0;background:#F3F4F6;color:#0E1013;font:600 16px 'Inter',sans-serif;cursor:pointer;margin-top:10px}
#pubHome .pb-ghost{display:flex;align-items:center;justify-content:center;width:100%;height:44px;background:none;border:0;color:#A9B0BB;font:inherit;font-size:14px;cursor:pointer}
#pubHome .pb-seg{display:flex;gap:8px;flex-wrap:wrap} #pubHome .pb-seg button{height:46px;min-width:84px;padding:0 18px;border-radius:12px;background:#171A1F;border:1px solid #2C313A;color:#F3F4F6;font:600 15px 'Inter',sans-serif;cursor:pointer}
#pubHome .pb-seg button[aria-pressed="true"]{background:#F3F4F6;color:#0E1013;border-color:#F3F4F6}
#pubHome .pb-sw{display:flex;align-items:center;gap:14px;padding:16px 18px;border-radius:16px;background:#171A1F;border:1px solid #2C313A;cursor:pointer;width:100%;color:inherit;font:inherit;text-align:left;min-height:44px}
#pubHome .pb-sw b{display:block;font-size:16px} #pubHome .pb-sw span.d{display:block;font-size:13px;color:#A9B0BB;margin-top:2px}
#pubHome .pb-sw .k{margin-left:auto;width:46px;height:28px;border-radius:14px;background:#2C313A;position:relative;flex:none}
#pubHome .pb-sw .k:after{content:"";position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:#A9B0BB;transition:left .15s}
#pubHome .pb-sw[aria-pressed="true"] .k{background:#3DDC97} #pubHome .pb-sw[aria-pressed="true"] .k:after{left:21px;background:#0E1013}
#pubHome .pb-form{max-width:560px;display:flex;flex-direction:column;gap:22px;margin-top:22px}
#pubHome ol.pb-steps{padding:0;margin:22px 0;list-style:none;display:flex;flex-direction:column;gap:14px;counter-reset:s}
#pubHome ol.pb-steps li{counter-increment:s;display:flex;gap:14px;align-items:flex-start;font-size:16px;line-height:1.5;color:#F3F4F6}
#pubHome ol.pb-steps li:before{content:counter(s);flex:none;width:30px;height:30px;border-radius:50%;background:#171A1F;border:1px solid #2C313A;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;color:#FFB84D}
#pubHome textarea{width:100%;min-height:88px;border-radius:14px;background:#171A1F;border:1px solid #2C313A;color:#F3F4F6;font:14px 'Inter',sans-serif;padding:12px 14px}
#pubSessBar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 16px;margin:0 0 12px;border-radius:14px;background:#171A1F;border:1px solid #2C313A;font-size:14px}
#pubSessBar .dot{width:12px;height:12px;border-radius:50%;background:var(--session,#3DDC97);flex:none}
#pubSessBar b{font-family:'Space Grotesk',sans-serif;font-size:16px} #pubSessBar .m{color:#A9B0BB}
/* regia con la sessione aperta (mockup "Sessione") */
body.pub header.top,body.pub footer{display:none !important}
body.pub .wrap{max-width:1400px}
body.pub .ps-head{display:flex;flex-direction:column;gap:14px;padding:16px 20px;border-radius:18px;background:#171A1F;border:1px solid #2C313A;margin-bottom:16px}
body.pub .ps-r1{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
body.pub .ps-r1 .pb-h{font-size:19px} body.pub .ps-r1 .grow{flex:1}
body.pub .ps-chip{padding:6px 12px;border-radius:999px;background:#0E1013;border:1px solid #2C313A;font-size:13px;color:#A9B0BB;letter-spacing:.3px}
body.pub .ps-until{font-size:13px;color:#A9B0BB}
body.pub .ps-pill{display:inline-flex;align-items:center;gap:8px;padding:6px 12px;border-radius:999px;background:#0E1013;border:1px solid #2C313A;font-size:13px;color:#A9B0BB;white-space:nowrap}
body.pub .ps-pill i{width:8px;height:8px;border-radius:50%;background:#2C313A;display:inline-block}
body.pub .ps-timer{font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:28px;letter-spacing:1px;font-variant-numeric:tabular-nums}
body.pub .ps-ghost{background:none;border:1px solid #2C313A;color:#F3F4F6;border-radius:10px;padding:6px 12px;font:inherit;font-size:13px;cursor:pointer;min-height:34px;margin:0}
body.pub .viewbar{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:0}
body.pub .viewbar .seg3{display:inline-flex;padding:4px;border-radius:12px;background:#0E1013;border:1px solid #2C313A;gap:2px}
body.pub .viewbar .seg3 button{padding:8px 12px;border-radius:9px;border:0;background:transparent;color:#A9B0BB;font-size:13px;font-weight:600;margin:0;min-height:0}
body.pub .viewbar .seg3 button[aria-pressed="true"]{background:#F3F4F6;color:#0E1013}
body.pub .viewbar #addCam2{height:48px;padding:0 16px;border-radius:14px;border:1px dashed #A9B0BB;background:transparent;color:#F3F4F6;font-weight:600;font-size:15px;margin:0}
body.pub .viewbar .ps-b{height:48px;padding:0 18px;border-radius:14px;border:1px solid #2C313A;background:#0E1013;color:#F3F4F6;font-weight:600;font-size:15px;margin:0;cursor:pointer}
body.pub .viewbar .ps-b.rec{background:#FF5A4A;border-color:#FF5A4A;color:#0E1013}
body.pub .viewbar .ps-b:disabled{opacity:.4;cursor:default}
body.pub .viewbar .proLbl{font-size:12px;color:#A9B0BB}
body.pub .viewbar #vwReset,body.pub .viewbar #vwMagnet{border-radius:10px;border:1px solid #2C313A;background:#0E1013;color:#F3F4F6;margin:0}
body.pub #homeGrid.v-auto{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:16px}
body.pub .pcard{display:flex;flex-direction:column;gap:10px;padding:14px;border-radius:18px;background:#171A1F;border:1px solid #2C313A;min-width:0}
body.pub .pcard.is-rec{border-color:#5A2A25} body.pub .pcard.is-off{opacity:.6}
body.pub .pcard .card-h{display:flex;align-items:center;gap:8px;padding:0;border:0;background:none}
body.pub .pcard .card-h b{font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:18px;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
body.pub .ps-st{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:600;white-space:nowrap;color:#3DDC97}
body.pub .ps-st i{width:7px;height:7px;border-radius:50%;background:currentColor;display:inline-block}
body.pub .ps-st.rec{color:#FF5A4A} body.pub .ps-st.off{color:#A9B0BB}
body.pub .pcard .card-b{padding:0;display:block}
body.pub .pcard .view.mini{width:100%;max-width:100%;aspect-ratio:9/16;max-height:56vh;margin:0 auto;border-radius:12px;background:#0B0D10;overflow:hidden}
body.pub .ps-meta{display:flex;justify-content:space-between;gap:6px;font-size:12px;color:#A9B0BB}
body.pub .ps-meta span:first-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
body.pub .ps-zoom>div{display:flex;justify-content:space-between;font-size:12px;color:#A9B0BB;margin-bottom:4px} body.pub .ps-zoom b{font-weight:500;color:#A9B0BB}
body.pub .ps-zs{width:100%;height:6px;min-height:0;padding:0;margin:0;accent-color:#F3F4F6;background:transparent}
body.pub .pcard .card-f{display:flex;gap:8px;margin-top:auto;padding:0;border:0;background:none}
body.pub .pcard .card-f button{flex:1;height:44px;border-radius:12px;margin:0;font-weight:700;font-size:14px;min-height:0}
body.pub .pcard .ps-rec{background:#F3F4F6;color:#0E1013;border:0} body.pub .pcard .ps-rec.on{background:#FF5A4A}
body.pub .pcard .ps-rec:disabled{opacity:.4}
body.pub .pcard .ps-det{background:transparent;border:1px solid #2C313A;color:#F3F4F6;font-weight:600}
body.pub #homeGrid .add{border:2px dashed #2C313A;border-radius:18px;background:transparent;color:#A9B0BB;min-height:180px;font-size:15px}
body.pub #homeGrid .add:hover{border-color:#A9B0BB}
body.pub #joinBar .panel,body.pub #joinModalBar .panel{background:#2A2113 !important;border:1px solid #5A4318 !important;border-radius:20px;color:#F3F4F6}
body.pub #joinBar .panel .muted,body.pub #joinModalBar .panel .muted{color:#F3D9A8}
body.pub #joinBar{margin-bottom:12px}
body.pub .modal{background:rgba(6,8,10,.72)} body.pub .modal-card{background:#171A1F;border:1px solid #2C313A;border-radius:22px;width:min(760px,100%)}
body.pub .ps-qrbox{display:flex;flex-wrap:wrap;gap:24px;align-items:center}
body.pub .ps-qrimg{background:#fff;padding:12px;border-radius:14px;width:300px;height:300px;box-sizing:border-box}
body.pub .ps-qrtx{flex:1;min-width:220px;display:flex;flex-direction:column;gap:12px}
body.pub .ps-wait{display:inline-flex;align-items:center;gap:8px;font-size:12px;font-weight:600;letter-spacing:1.2px;color:#FFB84D}
body.pub .ps-wait i{width:8px;height:8px;border-radius:50%;background:#FFB84D;display:inline-block}
body.pub .panel.ps-qr{background:transparent;border:0;padding:8px 0 0}
body.pub #preflight{display:none !important}
body.pub #xferLive{border-radius:16px}
body.pub .ps h2{text-transform:none;letter-spacing:0;color:#F3F4F6}
body.pub #xferGlobal:not(.open){display:none}
#pubFilesBar{display:flex;align-items:center;gap:8px 18px;flex-wrap:wrap;padding:12px 16px;margin:16px 0 0;border-radius:16px;background:#171A1F;border:1px solid #2C313A;font-size:14px;color:#A9B0BB}
#pubFilesBar b{color:#F3F4F6;font-weight:600} #pubFilesBar .st{flex:1}
#pubFilesBar button{background:none;border:1px solid #2C313A;color:#F3F4F6;border-radius:10px;padding:6px 12px;font:inherit;font-size:13px;cursor:pointer;min-height:34px;margin:0}
body.pub #modeHost{margin-top:18px;opacity:.85}
/* camera: Prepara questa camera / Ripresa */
#pubHome .pc{max-width:520px;margin:0 auto;padding:max(24px,env(safe-area-inset-top)) 22px 28px;display:flex;flex-direction:column;gap:16px;min-height:100%}
#pubHome .pc h1{font-size:30px;margin:0;line-height:1.1}
#pubHome .pc-prev{height:150px;border-radius:18px;border:1px solid #2C313A;background:#0B0D10;display:flex;align-items:center;justify-content:center;color:#A9B0BB;font-size:13px;text-align:center;padding:0 16px}
#pubHome .pc-seg{display:flex;gap:8px} #pubHome .pc-seg button{flex:1;height:48px;border-radius:14px;border:1px solid #2C313A;background:#171A1F;color:#A9B0BB;font:inherit;font-size:15px;cursor:pointer}
#pubHome .pc-seg button[aria-pressed="true"]{background:#F3F4F6;color:#0E1013;font-weight:600;border-color:#F3F4F6}
#pubHome .pc-list{display:flex;flex-direction:column;border-radius:18px;background:#171A1F;border:1px solid #2C313A}
#pubHome .pc-list>div{display:flex;align-items:center;gap:12px;padding:14px 16px;border-bottom:1px solid #2C313A;font-size:15px} #pubHome .pc-list>div:last-child{border-bottom:0}
#pubHome .pc-list span{flex:1} #pubHome .pc-list b{font-size:13px;font-weight:400;color:#A9B0BB;text-align:right}
#pubHome .pc-run{height:100dvh;min-height:0;padding-bottom:20px}
#pubHome .pc-top{display:flex;align-items:center;gap:10px;padding:6px 6px 0} #pubHome .pc-top .pb-h{font-size:20px;flex:1}
#pubHome .pc-stage{position:relative;flex:1;min-height:0;display:flex} 
#pubHome .pc-stage #stage{display:block !important;position:relative;flex:1;width:100%;max-width:none;max-height:none;aspect-ratio:auto !important;margin:0;border-radius:22px;border:1px solid #2C313A;overflow:hidden;background:#000}
#pubHome .pc-stage #stage video{width:100%;height:100%;object-fit:cover}
#pubHome .pc-stage .stRec{background:#FF5A4A;color:#0E1013;border-radius:12px;padding:8px 14px;font-size:15px}
#pubHome .pc-stage .stRec i{background:#0E1013}
#pubHome .pc-stage .stZoom{background:#0E1013cc;border:1px solid #2C313A;border-radius:12px;padding:8px 12px;font-size:14px}
#pubHome .pc-stage .stLive{background:#0E1013cc;border-radius:9px;font-size:12px;padding:5px 10px}
#pubHome .pc-tiles{display:flex;gap:10px} #pubHome .pc-tiles>div{flex:1;display:flex;flex-direction:column;gap:2px;padding:12px 14px;border-radius:16px;background:#171A1F;border:1px solid #2C313A}
#pubHome .pc-tiles span{font-size:12px;color:#A9B0BB} #pubHome .pc-tiles b{font-size:18px;font-weight:600}
#pubHome .pc-btns{display:flex;gap:10px} #pubHome .pc-btns button{flex:1;height:52px;border-radius:14px;border:1px solid #2C313A;background:#171A1F;color:#F3F4F6;font:600 16px 'Inter',sans-serif;cursor:pointer}
#pubHome .pc-btns .out{background:transparent}
body.pub [data-jn="acc"]{background:#F3F4F6 !important;color:#0E1013 !important;border-color:#F3F4F6 !important}
/* schermata File */
body.pub .pf-back{color:#A9B0BB;text-decoration:none;font-size:15px;margin-right:6px}
body.pub .pf-h2 h2,body.pub .pf-h h2{margin:22px 0 12px;font-size:24px;text-transform:none;letter-spacing:0;color:#F3F4F6}
body.pub .pf-all{height:46px;padding:0 20px;border-radius:14px;border:0;background:#F3F4F6;color:#0E1013;font:600 15px 'Inter',sans-serif;cursor:pointer;margin:0} body.pub .pf-all:disabled{opacity:.4}
body.pub .pf-opts{display:flex;flex-direction:column;gap:10px}
body.pub .pf-opt{display:flex;align-items:center;gap:14px;padding:16px 18px;border-radius:16px;background:#171A1F;border:1px solid #2C313A;cursor:pointer;margin:0}
body.pub .pf-opt.on{border:2px solid #F3F4F6;padding:15px 17px}
body.pub .pf-opt input{width:auto;min-height:0;margin:0;accent-color:#F3F4F6} body.pub .pf-opt div{flex:1} body.pub .pf-opt b{display:block;font-size:16px} body.pub .pf-opt span{display:block;font-size:13px;color:#A9B0BB;margin-top:2px}
body.pub .pf-health{font-size:13px;margin:8px 4px} body.pub .pf-health.ok{color:#3DDC97} body.pub .pf-health.bad{color:#FF5A4A}
body.pub .pf-sw{display:flex;align-items:flex-start;gap:12px;padding:14px 16px;margin:10px 0 0;border-radius:14px;background:#171A1F;border:1px solid #2C313A;font-size:15px;color:#F3F4F6}
body.pub .pf-sw input{width:auto;min-height:0;margin:3px 0 0;accent-color:#3DDC97} body.pub .pf-sw small{display:block;color:#A9B0BB;font-size:13px;margin-top:2px}
body.pub .pf-clips{margin-top:8px}
body.pub .pf-h{display:flex;align-items:center;gap:14px;flex-wrap:wrap} body.pub .pf-h .m{color:#A9B0BB;font-size:15px} body.pub .pf-h .grow{flex:1}
body.pub .pf-row{display:flex;gap:16px;align-items:center;padding:14px 16px;margin:8px 0;border-radius:16px;background:#171A1F;border:1px solid #2C313A}
body.pub .pf-n{flex:1;min-width:0} body.pub .pf-n b{display:block;font-size:15px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap} body.pub .pf-n span{display:block;font-size:13px;color:#A9B0BB;margin-top:2px}
body.pub .pf-bar{height:6px;border-radius:999px;background:#2C313A;margin-top:8px;overflow:hidden} body.pub .pf-bar i{display:block;height:100%;background:#3DDC97}
body.pub .pf-r{text-align:right;font-size:13px;color:#A9B0BB;display:flex;flex-direction:column;gap:4px;align-items:flex-end} body.pub .pf-r .ok{color:#3DDC97;font-weight:600} body.pub .pf-r .bad{color:#FF5A4A}
body.pub .pf-empty{padding:24px;border:2px dashed #2C313A;border-radius:16px;color:#A9B0BB;text-align:center}
body.pub .pb-pro{padding:14px 16px;border-radius:16px;background:#2A2113;border:1px solid #5A4318;font-size:13px;line-height:1.5;color:#F3D9A8;margin-top:12px}
@media (max-width:900px){#pubHome .pb-hero{grid-template-columns:1fr;gap:28px;min-height:0;padding-top:12px}#pubHome .pb-cols{grid-template-columns:1fr;gap:24px}#pubHome .pb-prev{display:none}#pubHome .pb-types{grid-template-columns:1fr}}`;
  function ensureCss() {
    if (document.getElementById("pubCss")) return;
    const s = document.createElement("style"); s.id = "pubCss"; s.textContent = css; document.head.appendChild(s);
    const l = document.createElement("link"); l.rel = "stylesheet"; l.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;700&display=swap"; document.head.appendChild(l);
  }
  function applyTheme(c) { const hex = (COLORS.find((x) => x.id === c) || {}).hex; if (hex && document.body.classList.contains("pub")) document.documentElement.style.setProperty("--session", hex); else document.documentElement.style.removeProperty("--session"); }
  const css0 = () => ensureCss();
  window.GDC_PUB = { CFG, PRESETS, COLORS, HOURS, LOGO, store, esc, ensureCss: css0, applyTheme, active: () => document.body.classList.contains("pub") };
  // il tema scuro vale in tutta la pagina in modalità Pubblica
  document.addEventListener("gdcmode", (e) => { if (e.detail === "pub") ensureCss(); });
})();
