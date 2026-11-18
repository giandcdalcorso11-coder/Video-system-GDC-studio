import { withEnv, sleep } from "../lib.mjs";
export const name = "Cartella di destinazione: disco scollegato, disco pieno, cambio cartella";
export async function run() {
  await withEnv({}, async (t) => {
    const cam = await t.cam("camA"), dash = await t.dash();
    t.check("camera collegata", await t.ready(dash, "camA"));
    await t.rec(cam, 5);
    const sid = await cam.evaluate(() => sessions[0].id), src = await t.clipHash(cam, sid);
    const go = () => t.until(() => dash.evaluate((s) => !!document.querySelector(`[data-xf="go"][data-sid="${s}"]:not([disabled])`), sid)).then(() => dash.evaluate((s) => document.querySelector(`[data-xf="go"][data-sid="${s}"]`).click(), sid));
    const state = () => dash.evaluate(() => [...Xfer.jobs.values()].map((j) => j.state).join(","));
    const setup = (h) => dash.evaluate((h) => { Xfer.jobs.clear(); window.__fs = {}; window.__gone = false; window.__full = ""; Dest.handle = window.__mkDir(h); Dest.mode = "folder"; Dest.health = null; Xfer.delAfter = true; Xfer.auto = false; Xfer.hold = false; Xfer.refresh(); }, h);
    const phone = () => cam.evaluate(() => sessions.map((s) => s.status).join());
    await dash.evaluate(() => { location.hash = "#/cam/camA"; });
    // A) disco scollegato prima di iniziare
    await setup("Disco"); await dash.evaluate(() => { window.__gone = true; }); await go(); await sleep(1500);
    t.check("A) nessun trasferimento parte", (await dash.evaluate(() => Xfer.jobs.size)) === 0);
    t.check("A) la regia segnala la cartella non raggiungibile", await dash.evaluate(() => !!(Dest.health && !Dest.health.ok && /disco scollegato/.test(Dest.health.msg))));
    t.check("A) la clip resta sul telefono", (await phone()) === "pronta", await phone());
    // B) il disco sparisce a metà: pausa e ripartenza da solo
    await dash.evaluate(() => { window.__gone = false; Dest.health = null; }); await go(); await sleep(300);
    await dash.evaluate(() => { window.__gone = true; });
    t.check("B) il trasferimento passa a interrotto", await t.until(async () => /interrotto/.test(await state()), 20000), await state());
    t.check("B) durante il guasto la clip resta sul telefono", (await phone()) === "pronta", await phone());
    await sleep(5000); await dash.evaluate(() => { window.__gone = false; });
    t.check("B) al ritorno del disco riparte e arriva", await t.until(async () => (await state()) === "ok", 40000), await state());
    const f = await dash.evaluate(async () => { const r = window.__real("Disco"); return r.length ? window.__sha(r[0][1]) : null; });
    t.check("B) file identico all'originale", f && f[0] === src[0] && f[1] === src[1], JSON.stringify(f));
    t.check("B) la clip viene tolta dal telefono solo dopo l'arrivo", (await phone()) === "", await phone());
    // C) disco pieno: pausa, si cambia cartella, riparte nella nuova
    await t.rec(cam, 4); const sid2 = await cam.evaluate(() => sessions[0].id);
    await setup("Pieno"); await dash.evaluate(() => { window.__full = "Pieno"; });
    await t.until(() => dash.evaluate((s) => !!document.querySelector(`[data-xf="go"][data-sid="${s}"]:not([disabled])`), sid2));
    await dash.evaluate((s) => document.querySelector(`[data-xf="go"][data-sid="${s}"]`).click(), sid2);
    t.check("C) disco pieno: il trasferimento si ferma con una nota chiara", await t.until(() => dash.evaluate(() => [...Xfer.jobs.values()].some((j) => j.state === "interrotto" && /disco pieno/.test(j.note))), 25000));
    await dash.evaluate(() => { Dest.handle = window.__mkDir("Libero"); Dest.health = null; });
    t.check("C) cambiata cartella, il trasferimento riparte e finisce", await t.until(async () => (await state()) === "ok", 40000), await state());
    t.check("C) il file è nella nuova cartella e non nella vecchia", await dash.evaluate(() => window.__real("Libero").length === 1 && window.__real("Pieno").length === 0));
  });
}
