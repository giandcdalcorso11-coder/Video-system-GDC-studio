import { withEnv, sleep } from "../lib.mjs";
export const name = "Home: le barre di avanzamento dei trasferimenti si vedono per tutte le camere";
export async function run() {
  await withEnv({ approve: false }, async (t) => {
    const dash = await t.dash(), cam = await t.cam("camA");
    await t.until(async () => (await dash.evaluate(() => cameras.length)) === 1, 15000);
    await dash.evaluate(() => { location.hash = "#/"; route(); });
    await sleep(500);
    t.check("senza trasferimenti il riquadro è nascosto", await dash.evaluate(() => document.getElementById("xferLive").hidden));
    await dash.evaluate(() => { Xfer.jobs.set("jt", { id: "jt", camId: "camA", name: "Camera1_prova.mp4", state: "in corso", got: 5e6, size: 10e6, speed: 1.5e6, at: Date.now() }); Xfer.renderLive(); });
    t.check("durante un trasferimento compare la barra con camera, file, percentuale e velocità", await dash.evaluate(() => { const e = document.getElementById("xferLive"); return !e.hidden && /Camera1_prova/.test(e.textContent) && /50%/.test(e.textContent) && /Mbps/.test(e.textContent) && e.querySelector('[data-gp="jt"] i').style.width === "50%"; }), await dash.evaluate(() => document.getElementById("xferLive").textContent.replace(/\s+/g, " ")));
    await dash.evaluate(() => { const j = Xfer.jobs.get("jt"); j.got = 8e6; Xfer.renderLive(); });
    t.check("la barra avanza senza ricostruire il riquadro", await dash.evaluate(() => document.querySelector('#xferLive [data-gp="jt"] i').style.width === "80%"));
    await dash.evaluate(() => { const j = Xfer.jobs.get("jt"); j.state = "ok"; j.where = "cartella"; j.got = 10e6; Xfer.renderLive(); });
    t.check("a fine trasferimento la barra è piena e dice 'verificato'", await dash.evaluate(() => { const e = document.getElementById("xferLive"); return !e.hidden && e.querySelector('[data-gp="jt"] i').style.width === "100%" && /verificato/.test(e.textContent); }));
    await dash.evaluate(() => { Xfer.jobs.get("jt").endSeen = Date.now() - 100000; Xfer.renderLive(); });
    t.check("dopo 90 s dalla fine sparisce", await dash.evaluate(() => document.getElementById("xferLive").hidden));
  });
}
