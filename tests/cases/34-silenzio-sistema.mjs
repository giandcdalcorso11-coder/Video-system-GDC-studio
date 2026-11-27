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
  });
}
