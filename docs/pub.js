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
/* regia con la sessione aperta (mockup "Sessione"): meno strumenti, impostazioni dei file riassunte in una riga */
body.pub #permPanel,body.pub #marksPanel,body.pub #sum,body.pub #sessRow,body.pub #preflight,body.pub footer{display:none !important}
body.pub header.top{background:#171A1F;border:1px solid #2C313A;border-radius:18px;padding:14px 18px}
body.pub header.top h1{font-size:19px;letter-spacing:-.2px} body.pub header.top .sub{display:none}
body.pub .timer{font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:24px}
body.pub #xferGlobal:not(.open){display:none}
body.pub #xferLive{border-radius:16px}
body.pub .grid .card{border-radius:20px}
body.pub .grid .add{border-radius:20px;border-color:#2C313A;color:#A9B0BB}
body.pub .viewbar .seg3 button[aria-pressed="true"],body.pub #gdcMode .seg button[aria-pressed="true"]{background:#F3F4F6;color:#0E1013}
#pubSessBar .nb{margin-left:8px;background:none;border:1px solid #2C313A;color:#F3F4F6;border-radius:10px;padding:6px 12px;font:inherit;font-size:13px;cursor:pointer;min-height:34px}
#pubFilesBar{display:flex;align-items:center;gap:8px 18px;flex-wrap:wrap;padding:12px 16px;margin:16px 0 0;border-radius:16px;background:#171A1F;border:1px solid #2C313A;font-size:14px;color:#A9B0BB}
#pubFilesBar b{color:#F3F4F6;font-weight:600} #pubFilesBar .st{flex:1}
#pubFilesBar button{background:none;border:1px solid #2C313A;color:#F3F4F6;border-radius:10px;padding:6px 12px;font:inherit;font-size:13px;cursor:pointer;min-height:34px;margin:0}
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
