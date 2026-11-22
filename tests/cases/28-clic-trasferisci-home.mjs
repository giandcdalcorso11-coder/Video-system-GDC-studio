import { withEnv, sleep } from "../lib.mjs";
export const name = "Home: 'Trasferisci tutte' avvia davvero i trasferimenti e compaiono le barre";
export async function run() {
  await withEnv({ approve: false }, async (t) => {
    const dash = await t.dash(), cam = await t.cam("camA");
    await t.until(async () => (await dash.evaluate(() => cameras.length)) === 1, 15000);
    await dash.evaluate(() => { location.hash = "#/"; route(); Dest.mode = "device"; Xfer.hold = false; Xfer.auto = false; Xfer.refresh(); command("camA", { cmd: "rec_start" }); });
    await t.until(() => cam.evaluate(() => !!recording), 15000); await sleep(2500);
    await dash.evaluate(() => command("camA", { cmd: "rec_stop" }));
    t.check("una clip pronta compare in regia", await t.until(() => dash.evaluate(() => (state.camA.clips || []).some((k) => k.status === "pronta")), 15000));
    t.check("il pulsante 'Trasferisci tutte le clip pronte di tutte le camere' si abilita", await t.until(() => dash.evaluate(() => { const b = document.querySelector('#xferGlobal [data-xf="allcams"]'); return !!b && !b.disabled; }), 10000), await dash.evaluate(() => (document.querySelector('#xferGlobal [data-xf="allcams"]') || {}).outerHTML));
    await dash.click('#xferGlobal [data-xf="allcams"]');
    t.check("dopo il clic parte un trasferimento", await t.until(() => dash.evaluate(() => Xfer.jobs.size > 0), 10000), await dash.evaluate(() => JSON.stringify({ q: Xfer.queueRun, jobs: Xfer.jobs.size, adv: adv.slice(-6).map((x) => x.m) })));
    t.check("la barra compare in home", await t.until(() => dash.evaluate(() => !document.getElementById("xferLive").hidden && /Trasferimenti/.test(document.getElementById("xferLive").textContent)), 10000));
    t.check("il trasferimento arriva in fondo e viene verificato", await t.until(() => dash.evaluate(() => [...Xfer.jobs.values()].some((j) => j.state === "ok")), 40000), await dash.evaluate(() => JSON.stringify([...Xfer.jobs.values()].map((j) => [j.state, j.error]))));
    // stessa cosa dalla pagina della camera: registro un'altra clip e premo "Trasferisci" sulla singola clip
    await dash.evaluate(() => { location.hash = "#/"; route(); command("camA", { cmd: "rec_start" }); });
    await t.until(() => cam.evaluate(() => !!recording), 15000); await sleep(2500);
    await dash.evaluate(() => command("camA", { cmd: "rec_stop" }));
    await t.until(() => dash.evaluate(() => (state.camA.clips || []).some((k) => k.status === "pronta")), 15000);
    await dash.evaluate(() => { location.hash = "#/cam/camA"; route(); });
    await t.until(() => dash.evaluate(() => !!document.querySelector('[data-bind="xferUi"] [data-xf="go"]:not([disabled])')), 10000);
    const n0 = await dash.evaluate(() => Xfer.jobs.size);
    await dash.click('[data-bind="xferUi"] [data-xf="go"]:not([disabled])');
    t.check("dalla pagina della camera il pulsante Trasferisci avvia un trasferimento", await t.until(() => dash.evaluate((n) => Xfer.jobs.size > n, n0), 10000));
  });
}
