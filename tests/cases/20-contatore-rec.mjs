import { withEnv, sleep } from "../lib.mjs";
export const name = "Contatore REC: riparte a ogni registrazione (camera e regia)";
export async function run() {
  await withEnv({ approve: false }, async (t) => {
    const dash = await t.dash(), cam = await t.cam("camA");
    await dash.evaluate(() => { location.hash = "#/"; route(); });
    await t.until(async () => (await dash.evaluate(() => cameras.length)) === 1);
    const camT = () => cam.evaluate(() => document.getElementById("stTime").textContent);
    const dashT = () => dash.evaluate(() => [...document.querySelectorAll('[data-bind="timer"],[data-bind="badge"]')].map((e) => e.textContent).join("|") + " g=" + document.getElementById("globalTimer").textContent);
    for (const v of ["scroll", "free", "auto"]) {
    await dash.evaluate((x) => { location.hash = "#/"; route(); Views.set(x); }, v); await sleep(500);
    for (let i = 1; i <= 2; i++) {
      await dash.evaluate(() => command("camA", { cmd: "rec_start" }));
      await t.until(async () => /REC/.test(await camT()) && await cam.evaluate(() => !!recording), 15000);
      await sleep(1200); const a = await camT(), da = await dashT(); await sleep(2200); const b = await camT(), db = await dashT();
      t.check(`${v} giro ${i}: camera, il tempo avanza (${a} → ${b})`, a !== b);
      t.check(`${v} giro ${i}: regia, il tempo avanza (${da} → ${db})`, da !== db);
      await dash.evaluate(() => command("camA", { cmd: "rec_stop" }));
      await t.until(async () => !(await cam.evaluate(() => !!recording)), 15000); await sleep(800);
    }
    }
  });
}
