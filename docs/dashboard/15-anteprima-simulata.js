"use strict";
/* ===== Anteprima simulata (reagisce a pan/tilt) ===== */
function drawPreview(t) {
  $$("canvas[data-prev]").forEach((cv) => {
    if (cv.hidden) return;
    const id = cv.dataset.prev, st = state[id] || { pan: 0, tilt: 0 }, g = cv.getContext("2d"), W = cv.width, H = cv.height;
    if (REAL) { g.fillStyle = "#14161a"; g.fillRect(0, 0, W, H); g.fillStyle = "rgba(255,255,255,.55)"; g.font = "15px sans-serif"; g.textAlign = "center"; g.fillText("Nessuna anteprima", W / 2, H / 2); g.textAlign = "start"; return; }
    const ox = (st.pan / PAN_LIMIT) * -120, oy = (st.tilt / TILT_LIMIT) * 120, hue = 200 + (cameras.findIndex((c) => c.id === id) % 4) * 45;
    const grad = g.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, `hsl(${hue} 35% 22%)`); grad.addColorStop(1, `hsl(${hue + 30} 30% 10%)`);
    g.fillStyle = grad; g.fillRect(0, 0, W, H);
    g.strokeStyle = "rgba(255,255,255,.08)"; g.lineWidth = 1;
    for (let x = -60; x < W + 60; x += 60) { g.beginPath(); g.moveTo(x + (ox % 60), 0); g.lineTo(x + (ox % 60), H); g.stroke(); }
    for (let y = -60; y < H + 60; y += 60) { g.beginPath(); g.moveTo(0, y + (oy % 60)); g.lineTo(W, y + (oy % 60)); g.stroke(); }
    g.fillStyle = `hsl(${hue + 120} 70% 62%)`; g.beginPath(); g.arc(W / 2 + ox + Math.sin(t / 900) * 40, H / 2 + oy + Math.cos(t / 1300) * 30, 34, 0, 7); g.fill();
    g.strokeStyle = "rgba(255,255,255,.35)"; g.setLineDash([6, 6]); g.strokeRect(W * .1, H * .08, W * .8, H * .84); g.setLineDash([]);
    g.fillStyle = "rgba(255,255,255,.85)"; g.font = "600 15px sans-serif"; g.fillText("9:16", 14, H - 34);
    g.font = "13px monospace"; g.fillText(new Date().toLocaleTimeString("it-IT"), 14, H - 14);
  });
  requestAnimationFrame(drawPreview);
}
