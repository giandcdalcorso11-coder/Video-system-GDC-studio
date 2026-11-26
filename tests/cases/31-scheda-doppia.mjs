import { withEnv, sleep } from "../lib.mjs";
export const name = "Una sola scheda per camera: una seconda scheda con la stessa camera si ferma e non ruba la registrazione";
export async function run() {
  await withEnv({ approve: false }, async (t) => {
    const dash = await t.dash(), cam = await t.cam("camA");
    await t.until(async () => (await dash.evaluate(() => cameras.length)) === 1, 15000);
    await dash.evaluate(() => { command("camA", { cmd: "rec_start" }); });
    t.check("la prima scheda registra", await t.until(() => cam.evaluate(() => !!recording), 15000));
    await sleep(2500);
    // seconda scheda con la stessa camera (come su iPad dopo essere usciti e rientrati da Safari)
    const cam2 = await t.cam("camA");
    t.check("la seconda scheda mostra 'già aperta in un'altra scheda'", await t.until(() => cam2.evaluate(() => !document.getElementById("dupBox").hidden && document.getElementById("main").hidden), 10000));
    t.check("la seconda scheda non apre la camera né si collega", await cam2.evaluate(() => !stream && !rt));
    t.check("la registrazione della prima scheda continua e non è stata 'recuperata'", await cam.evaluate(async () => !!recording && !(await db.sessions()).some((s) => s.recovered)));
    // "Usa questa scheda comunque": la prima si ferma e salva la clip
    cam2.on("dialog", (d) => d.accept());
    await cam2.evaluate(() => document.getElementById("dupBtn").click()); await cam2.waitForLoadState("load").catch(() => {});
    t.check("la seconda scheda, dopo il comando, diventa la camera attiva", await t.until(() => cam2.evaluate(() => document.getElementById("dupBox").hidden && !document.getElementById("main").hidden), 15000));
    t.check("la prima scheda si ferma e dice che è stata sostituita", await t.until(() => cam.evaluate(() => !document.getElementById("dupBox").hidden && !recording && /preso il controllo/.test(document.getElementById("dupTxt").textContent)), 15000));
  });
}
