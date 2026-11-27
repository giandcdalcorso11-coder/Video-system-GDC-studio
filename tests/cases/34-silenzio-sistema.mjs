import { withEnv } from "../lib.mjs";
export const name = "Sveglia o chiamata: se la cattura resta silenziata dopo il ritorno in primo piano, la camera si riapre da sola";
export async function run() {
  await withEnv({ approve: false }, async (t) => {
    const dash = await t.dash(), cam = await t.cam("camA");
    await t.until(async () => (await dash.evaluate(() => cameras.length)) === 1, 15000);
    t.check("la camera è aperta", await t.until(() => cam.evaluate(() => !!stream && stream.getTracks().every((x) => x.readyState === "live")), 15000));
    await cam.evaluate(() => { window.__old = stream; stream.getTracks().forEach((x) => Object.defineProperty(x, "muted", { get: () => true, configurable: true })); });
    t.check("dopo 4-5 s di silenzio la camera viene riaperta (nuovo flusso, tracce attive)", await t.until(() => cam.evaluate(() => !!stream && stream !== window.__old && stream.getTracks().every((x) => x.readyState === "live" && !x.muted)), 15000));
    t.check("la camera torna disponibile per la regia", await t.until(() => dash.evaluate(() => { const s = state.camA; return !!s && s.camReady !== false && s.online; }), 15000));
    // scheda di una sessione vecchia (canale diverso): non blocca la scheda della sessione nuova
    t.check("una scheda con un canale di sessione diverso non conta come 'camera già aperta'", await cam.evaluate(() => { const k = Lease.k; const keep = localStorage.getItem(k); localStorage.setItem(k, JSON.stringify({ i: "altra", t: Date.now(), c: "gdc1.vecchio" })); const a = Lease.other(); localStorage.setItem(k, JSON.stringify({ i: "altra", t: Date.now(), c: pairing.c })); const b = Lease.other(); localStorage.setItem(k, keep); return a === null && !!b; }));
    // anteprima nera dopo il ritorno in primo piano (iPhone 15): il video perde il flusso e va ricollegato da solo
    await cam.evaluate(() => { const v = document.getElementById("vid"); v.srcObject = null; stageVerify(); });
    t.check("se l'anteprima resta nera la camera ricollega il flusso e il video torna ad avere dimensioni", await t.until(() => cam.evaluate(() => document.getElementById("vid").videoWidth > 0), 12000));
  });
}
