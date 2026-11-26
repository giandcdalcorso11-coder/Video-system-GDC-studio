/* Modalità Pubblica (test): configurazione incorporata e funzioni comuni a regia e camera.
   La chiave "publishable" di Supabase è pensata per stare nelle pagine pubbliche (non è un segreto); i permessi veri stanno nelle regole del database.
   Quando ci sarà l'account dedicato basterà cambiare questi due valori. */
(function () {
  const CFG = { u: "https://mjcnvpwjvwrucwjptgiu.supabase.co", k: "sb_publishable_yrBSyHO-zale430dzkr1qA_dhssgD5g" };
  // tipi di attività: per ora solo il nome e una riga; i valori di partenza veri (REC dal telefono, file) arrivano dopo le prove
  const PRESETS = [
    { id: "generico", name: "Generico", note: "Per qualsiasi ripresa." },
    { id: "sport", name: "Sport", note: "Più camere sul campo, il REC parte anche dal telefono." },
    { id: "kart", name: "Go-kart ed escape room", note: "Camere fisse, riprese brevi e frequenti." },
    { id: "locali", name: "Locali ed eventi", note: "Camere che restano accese a lungo." },
  ];
  const COLORS = [{ id: "blu", hex: "#2457d6", name: "Blu" }, { id: "verde", hex: "#12875a", name: "Verde" }, { id: "arancio", hex: "#d9730d", name: "Arancio" }, { id: "viola", hex: "#7b3fe4", name: "Viola" }, { id: "rosso", hex: "#d92d20", name: "Rosso" }];
  const store = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ok */ } } };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const css = `#pubHome{position:fixed;inset:0;z-index:40;overflow:auto;background:var(--bg,#f3f4f6);color:var(--text,#14161a);padding:max(20px,env(safe-area-inset-top)) 16px 40px}
#pubHome .wrap{max-width:560px;margin:0 auto}
#pubHome h1{font-size:26px;margin:18px 0 4px} #pubHome .sub{color:var(--muted,#5f6672);margin:0 0 22px}
#pubHome .big{display:block;width:100%;text-align:left;padding:18px;margin:0 0 12px;border-radius:16px;border:1px solid var(--line,#d9dde3);background:var(--panel,#fff);color:inherit;font:inherit;min-height:0}
#pubHome .big b{display:block;font-size:19px;margin-bottom:4px} #pubHome .big span{color:var(--muted,#5f6672);font-size:14px}
#pubHome .big:active{transform:scale(.99)}
#pubHome .opt{display:block;padding:12px;margin:0 0 8px;border:1px solid var(--line,#d9dde3);border-radius:12px;background:var(--panel,#fff);cursor:pointer}
#pubHome .opt input{width:auto;min-height:0;margin-right:8px} #pubHome .opt small{display:block;color:var(--muted,#5f6672)}
#pubHome .cols{display:flex;gap:10px;flex-wrap:wrap;margin:6px 0 16px} #pubHome .col{width:44px;height:44px;border-radius:50%;border:3px solid transparent;padding:0;min-height:0;margin:0}
#pubHome .col[aria-pressed="true"]{border-color:var(--text,#14161a)}
#pubHome label.f{display:block;font-size:13px;color:var(--muted,#5f6672);margin:10px 0 4px}
#pubHome input[type=text]{width:100%;font:inherit;padding:11px 12px;border-radius:10px;border:1px solid var(--line,#d9dde3);background:var(--panel-2,#eef0f3);color:inherit;min-height:44px}
#pubHome .go{display:block;width:100%;padding:15px;border-radius:12px;border:0;background:var(--accent,#2457d6);color:#fff;font:inherit;font-weight:700;font-size:17px;min-height:50px;margin:16px 0 8px}
#pubHome .back{background:transparent;border:0;color:var(--muted,#5f6672);font:inherit;padding:8px 0;min-height:0;margin:0}
#pubHome ol{padding-left:20px;line-height:1.6} #pubHome .note{font-size:12px;color:var(--muted,#5f6672);margin-top:22px}`;
  function ensureCss() { if (document.getElementById("pubCss")) return; const s = document.createElement("style"); s.id = "pubCss"; s.textContent = css; document.head.appendChild(s); }
  function applyTheme(c) { const hex = (COLORS.find((x) => x.id === c) || {}).hex; if (hex && document.body.classList.contains("pub")) document.documentElement.style.setProperty("--accent", hex); else document.documentElement.style.removeProperty("--accent"); }
  window.GDC_PUB = { CFG, PRESETS, COLORS, store, esc, ensureCss, applyTheme, active: () => document.body.classList.contains("pub") };
})();
