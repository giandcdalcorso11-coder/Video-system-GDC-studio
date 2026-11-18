"use strict";
/* ===== Identità della camera ===== */
const hashPair = (window.GDC_RT && GDC_RT.Pair.fromHash()) || null; // legge e consuma il link di abbinamento
const idSrc = (() => {
  const lk = hashPair && hashPair.linkId, ls = store.get("gdc.camId", null), ck = getCookie("gdc_camid");
  if (lk) return { id: lk, src: "link" }; if (ls) return { id: ls, src: "memoria locale" }; if (ck) return { id: ck, src: "cookie" };
  return { id: "cam-" + Math.random().toString(36).slice(2, 8), src: "nuova" };
})();
const ID = idSrc.id; store.set("gdc.camId", ID); setCookie("gdc_camid", ID);
const FP = (() => { const s = [navigator.userAgent, screen.width, screen.height, devicePixelRatio, navigator.hardwareConcurrency, Intl.DateTimeFormat().resolvedOptions().timeZone].join("|"); let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return (h >>> 0).toString(16); })();
const FIRST = !store.get("gdc.camCfg", null) && !store.get("gdc.welcomed", false) && !new URLSearchParams(location.search).get("name");
let welcomePending = false;
const cfg = Object.assign({ device: /iPhone/.test(navigator.userAgent) ? "iPhone" : /Android/.test(navigator.userAgent) ? "Android" : "Telefono", name: "cam1", res: "1080p", bps: 20000000, facing: "environment", autoCam: true }, store.get("gdc.camCfg", {}));
{ const qp = new URLSearchParams(location.search); // ?name=...&device=... dal link: nome della camera e del dispositivo
  if (qp.get("name") || qp.get("device")) { if (qp.get("name")) cfg.name = qp.get("name").slice(0, 30); if (qp.get("device")) cfg.device = qp.get("device").slice(0, 40); store.set("gdc.camCfg", cfg); } }
const RES = { "720p": [1280, 720], "1080p": [1920, 1080], "4K": [3840, 2160] };
const MAX_BUF = 700 * 1048576; // limite prudente misurato su iPhone XR con Safari 16 (circa 0,78 GB), usato finché non si misura lo spazio reale
const IS_IOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const MOCK = new URLSearchParams(location.search).has("mock");
const OS = (() => { const m = navigator.userAgent.match(/OS (\d+)[_.](\d+)(?:[_.](\d+))?/); return m ? `iOS ${m[1]}.${m[2]}${m[3] ? "." + m[3] : ""}` : navigator.platform; })();
let joinState = "attesa", joinAt = Date.now();
// nome dei file: <Camera N assegnata dalla regia>_<nome scelto su questo telefono>_<data>_<ora di inizio, corretta con l'orologio della regia>
let label = store.get("gdc.label", ""), clockOff = Number(store.get("gdc.clockOff", 0)) || 0;
const safeN = (t) => String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9]+/g, "").slice(0, 24);
function clipFile(s, ext) {
  const d = new Date(s.start - clockOff), p2 = (n) => String(n).padStart(2, "0"), stamp = `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}_${p2(d.getHours())}-${p2(d.getMinutes())}-${p2(d.getSeconds())}`;
  const a = safeN(label), b = safeN(cfg.name), parts = [a, b && b !== a ? b : ""].filter(Boolean);
  return `${parts.length ? parts.join("_") : "camera"}_${stamp}${s.kind === "timelapse" ? "_timelapse" : ""}${ext ? "." + ext : ""}`;
}
const joinText = () => joinState === "ok" ? "accettata" : joinState === "no" ? "NON accettata dalla regia: chiedi di rientrare" : (Date.now() - joinAt > 10000 ? "in attesa della risposta della regia (può servire una conferma)" : "collegamento…");
let stream = null, recording = null, standby = false, lastErr = "", pairing = null, lastTapT = 0, storageMode = "indexeddb";
const bat = { level: null, charging: null, at: 0 };
try { if (!localStorage.getItem("gdc.batfix1")) { localStorage.removeItem("gdc.bat." + ID); localStorage.setItem("gdc.batfix1", "1"); } } catch { /* ok */ }
try { const o = JSON.parse(localStorage.getItem("gdc.bat." + ID)); if (o && o.level != null) Object.assign(bat, o); } catch { /* ok */ }
function setBat(level, charging, src) {
  let l = Number(level); if (!isFinite(l)) { dbg("warn", `batteria: valore non valido da ${src}: ${JSON.stringify(level)}`); return false; }
  l = Math.max(0, Math.min(100, Math.round(l)));
  const ch = charging === true || charging === "true" || charging === 1 || charging === "1" ? true : charging === false || charging === "false" || charging === 0 || charging === "0" ? false : null;
  bat.level = l; if (ch !== null) bat.charging = ch; bat.at = Date.now();
  try { localStorage.setItem("gdc.bat." + ID, JSON.stringify(bat)); } catch { /* ok */ }
  dbg("info", `batteria da ${src}: ${l}%${ch === null ? "" : ch ? ", in carica" : ", non in carica"}`); publish(); return true;
}
