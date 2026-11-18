import { withEnv, sleep } from "../lib.mjs";
export const name = "Trasferimento camera → regia con ripresa dopo una caduta (memoria e cartella)";
export async function run() {
  await withEnv({}, async (t) => {
    const dash = await t.dash(), cam = await t.cam("camA");
    t.check("la camera si collega e si accende", await t.ready(dash, "camA"));
    await dash.evaluate(() => { location.hash = "#/cam/camA"; });
    await t.rec(cam, 6);
    const sid = await cam.evaluate(() => sessions[0].id), src = await t.clipHash(cam, sid);
    t.check("la clip registrata ha dei dati", src[0] > 50000, src[0]);
    for (const mode of ["device", "folder"]) {
      await dash.evaluate((mode) => { Xfer.jobs.clear(); window.__fs = {}; Dest.handle = window.__mkDir("Prova"); Dest.health = null; Dest.mode = mode; Xfer.delAfter = false; Xfer.auto = false; Xfer.refresh(); }, mode);
      await cam.evaluate(() => { window.__dropAfter = 150000; }); // la connessione cade dopo circa 150 KB
      await cam.evaluate(async (sid) => { const s = sessions.find((x) => x.id === sid); s.status = "pronta"; await db.putSession(s); await loadSessions(); publish(); }, sid);
      await t.until(() => dash.evaluate((s) => !!document.querySelector(`[data-xf="go"][data-sid="${s}"]:not([disabled])`), sid));
      await dash.evaluate((s) => document.querySelector(`[data-xf="go"][data-sid="${s}"]`).click(), sid);
      const st = await t.until(() => dash.evaluate(() => { const j = [...Xfer.jobs.values()][0]; return j && /^(ok|errore)$/.test(j.state) ? j.state : false; }), 60000);
      t.check(`[${mode}] il trasferimento si conclude`, st === "ok", st);
      const got = await dash.evaluate(async (mode) => { const j = [...Xfer.jobs.values()][0]; if (mode === "device") return j && j.blob ? window.__sha([j.blob]) : null; const f = window.__real("Prova"); return f.length ? window.__sha(f[0][1]) : null; }, mode);
      t.check(`[${mode}] il file arrivato è identico (byte e SHA-256)`, got && got[0] === src[0] && got[1] === src[1], JSON.stringify(got));
    }
    t.check("la camera ha ripreso dal punto di interruzione", await cam.evaluate(() => dbgBuf.some((x) => /ripresa dal byte/.test(x.m))));
  });
}
