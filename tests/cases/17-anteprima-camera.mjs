import fs from "node:fs";
import { withEnv, sleep } from "../lib.mjs";
export const name = "Pagina camera: anteprima locale a tutto campo con REC, tempo e qualità";
export async function run() {
  await withEnv({ approve: false }, async (t) => {
    const dash = await t.dash(), cam = await t.cam("camA");
    const vis = (id) => cam.evaluate((i) => { const e = document.getElementById(i), r = e.getBoundingClientRect(); return getComputedStyle(e).display !== "none" && r.width > 0; }, id);
    t.check("camera avviata: compare l'anteprima", await t.until(() => cam.evaluate(() => !!stream && document.getElementById("stage").classList.contains("on") && document.getElementById("stage").getBoundingClientRect().height > 100)));
    t.check("compare 'Anteprima in diretta' con la qualità", await t.until(async () => /Anteprima in diretta/.test(await cam.evaluate(() => document.getElementById("stLive").textContent))), await cam.evaluate(() => document.getElementById("stLive").textContent));
    t.check("fuori dalla registrazione il badge REC è nascosto", !(await vis("stRec")));
    await dash.evaluate(() => { location.hash = "#/"; route(); });
    await t.until(async () => (await dash.evaluate(() => cameras.length)) === 1);
    await dash.evaluate(() => command("camA", { cmd: "rec_start" }));
    t.check("in registrazione compare REC con il tempo", await t.until(async () => (await vis("stRec")) && /REC · 00:0\d/.test(await cam.evaluate(() => document.getElementById("stTime").textContent)), 15000), await cam.evaluate(() => document.getElementById("stTime").textContent));
    await sleep(2500);
    t.check("il tempo avanza", await cam.evaluate(() => { const m = document.getElementById("stTime").textContent.match(/(\d\d):(\d\d)/); return m && Number(m[2]) >= 2; }), await cam.evaluate(() => document.getElementById("stTime").textContent));
    await dash.evaluate(() => command("camA", { cmd: "rec_stop" }));
    t.check("dopo lo STOP il badge REC sparisce", await t.until(async () => !(await vis("stRec")), 15000));
    if (process.env.SHOTS) { fs.mkdirSync(process.env.SHOTS, { recursive: true }); await cam.setViewportSize({ width: 390, height: 844 }); await cam.screenshot({ path: process.env.SHOTS + "/camera.png", fullPage: true }); }
  });
}
