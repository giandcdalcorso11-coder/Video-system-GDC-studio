"use strict";
/* ===== Camere (nome dispositivo + nome camera, rinominabili) ===== */
const PAN_LIMIT = 90, TILT_LIMIT = 45, STEP = 5, MB_PER_MIN = 100; // stima 1080p30
const pairing = (window.GDC_RT && (GDC_RT.Pair.fromHash() || GDC_RT.Pair.load())) || null;
if (pairing && window.GDC_AUTH) GDC_AUTH.ensure(pairing).catch((e) => console.warn("chiavi della regia: " + e.message));
const REAL = !!pairing, MOCK_RT = new URLSearchParams(location.search).has("mock");
if (window.GDC_DEV) GDC_DEV.init({ role: "dashboard", dev: () => "dashboard", ver: PAGE_VERSION, pairing, log: (l, m) => dbg(l, "ui", m), backlog: () => advSorted().filter((x) => !/^cam /.test(x.s)).slice(-300).map((x) => ({ t: x.t, l: x.l, m: `${x.s}: ${x.m}` })), host: $("#modeHost") });
const CAM_KEY = REAL ? "gdc.cams.real" : "gdc.cameras";
let cameras = store.get(CAM_KEY, null) || (REAL ? [] : [
  { id: "cam1", device: "iPhone XR", name: "cam1", os: "iOS 16.3.1", totalGb: 128, freeGb: 30.6 },
]);
const saveCams = () => store.set(CAM_KEY, cameras);
let connStatus = REAL ? "connessione…" : "—", curDetail = null;
function setConn(s) {
  connStatus = s; const el = $("#connTxt"); if (el) el.textContent = s;
  const m = $("#modeTxt"); if (m) m.textContent = REAL ? (/^connesso/.test(s) ? "collegata · " + s : "collegamento · " + s) : "modalità simulazione";
}
const camById = (id) => cameras.find((c) => c.id === id);
const camTitle = (c) => `${c.num ? "Camera " + c.num + " · " : ""}${c.device} · ${c.name}`;
const nextNum = () => { const u = new Set(cameras.map((c) => c.num).filter(Boolean)); let n = 1; while (u.has(n)) n++; return n; };
const labelOf = (id) => { const c = camById(id); return c && c.num ? "Camera " + c.num : ""; };
if (REAL) { let ch = false; cameras.forEach((c) => { if (!c.num) { c.num = nextNum(); ch = true; } if (!c.seen) { c.seen = Date.now(); ch = true; } }); if (ch) saveCams(); }
