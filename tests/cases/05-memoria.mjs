import { withEnv, sleep } from "../lib.mjs";
export const name = "Memoria dell'iPad: tetto sui file in attesa di Salva e misura della memoria";
export async function run() {
  await withEnv({}, async (t) => {
    const cam = await t.cam("camA", { init: () => { window.__memMax = 700000; window.__memCapMB = 48; window.__memStepMB = 16; } }), dash = await t.dash();
    t.check("camera collegata", await t.ready(dash, "camA"));
    await dash.evaluate(() => { Xfer.MEMMAX = 700000; location.hash = "#/cam/camA"; });
    await t.rec(cam, 3); await t.rec(cam, 3);
    const clips = await cam.evaluate(() => sessions.filter((s) => s.status === "pronta").map((s) => s.id));
    await dash.evaluate(() => { Dest.mode = "device"; Xfer.jobs.clear(); Xfer.refresh(); });
    const go = (s) => t.until(() => dash.evaluate((s) => !!document.querySelector(`[data-xf="go"][data-sid="${s}"]:not([disabled])`), s)).then(() => dash.evaluate((s) => document.querySelector(`[data-xf="go"][data-sid="${s}"]`).click(), s));
    await go(clips[0]);
    t.check("il primo file arriva in memoria", await t.until(() => dash.evaluate(() => Xfer.jobs.size === 1 && [...Xfer.jobs.values()][0].state === "ok"), 30000));
    await go(clips[1]); await sleep(1500);
    t.check("il secondo non parte: tetto raggiunto", (await dash.evaluate(() => Xfer.jobs.size)) === 1);
    t.check("avviso 'In memoria da salvare' mostrato", await dash.evaluate(() => /In memoria da salvare/.test(document.body.innerText)));
    await dash.evaluate(() => { const j = [...Xfer.jobs.values()][0]; j.saved = true; j.blob = null; Xfer.refresh(); });
    await go(clips[1]);
    t.check("dopo Salva il secondo parte e arriva", await t.until(() => dash.evaluate(() => Xfer.jobs.size === 2 && [...Xfer.jobs.values()].every((j) => j.state === "ok")), 30000));
    // misura della memoria (tetto ridotto per la prova)
    await dash.evaluate(() => { window.__memCapMB = 48; window.__memStepMB = 16; Xfer.memMeasure(); });
    t.check("misura della memoria completata", await t.until(() => dash.evaluate(() => !Xfer.memBusy && adv.some((x) => /MISURA MEMORIA COMPLETATA/.test(x.m))), 40000));
    t.check("nessuna prova lasciata in sospeso", await dash.evaluate(() => localStorage.getItem("gdc.memTest") === "null" || localStorage.getItem("gdc.memTest") === null));
    // pagina chiusa dal sistema durante la misura: alla riapertura viene segnalato
    await dash.evaluate(() => store.set("gdc.memTest", { running: true, mb: 1536, at: Date.now() })); await dash.reload();
    t.check("la prova interrotta viene riportata alla riapertura", await t.until(() => dash.evaluate(() => typeof adv !== "undefined" && adv.some((x) => /INTERROTTA/.test(x.m)))));
  });
}
