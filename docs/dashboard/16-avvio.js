"use strict";
/* ===== Avvio ===== */
destAvvio(); setInterval(() => Join.sweep(), 2000);
cameras.forEach((c, i) => transport.add(c, i === 0 ? 600 : null));
transport.start();
route();
requestAnimationFrame(drawPreview);
dbg("info", "avvio", `${PAGE_VERSION}`, { modalita: REAL ? (MOCK_RT ? "mock" : "supabase") : "simulazione", canale: pairing ? "…" + String(pairing.c).slice(-4) : null, camere: cameras.map((c) => `${c.id}=${camTitle(c)}`), dashId: transport.id || null, standalone: navigator.standalone === true, lingua: navigator.language, online: navigator.onLine });
setConn(connStatus); log("", REAL ? "Dashboard avviata (collegamento reale)" : "Dashboard avviata (simulazione)");
