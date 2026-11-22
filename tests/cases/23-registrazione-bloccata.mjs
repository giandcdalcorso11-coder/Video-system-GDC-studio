import { withEnv, sleep } from "../lib.mjs";
export const name = "Registrazione: microfono interrotto e stop non confermato non lasciano la camera bloccata";
export async function run() {
  await withEnv({ approve: false }, async (t) => {
    const dash = await t.dash(), cam = await t.cam("camA");
    await dash.evaluate(() => { location.hash = "#/"; route(); });
    await t.until(async () => (await dash.evaluate(() => cameras.length)) === 1, 15000);
    // 1) il microfono termina durante la registrazione
    await dash.evaluate(() => command("camA", { cmd: "rec_start" }));
    t.check("la registrazione parte", await t.until(() => cam.evaluate(() => !!recording), 15000));
    await sleep(2500);
    await cam.evaluate(() => { const a = stream.getAudioTracks()[0]; a.dispatchEvent(new Event("ended")); });
    t.check("microfono terminato: la registrazione si ferma da sola e la camera si libera", await t.until(() => cam.evaluate(() => !recording), 12000), await cam.evaluate(() => String(lastErr)));
    t.check("c'è un messaggio chiaro sul microfono", await cam.evaluate(() => /microfono/i.test(lastErr)), await cam.evaluate(() => lastErr));
    // 2) nuova registrazione: la camera si riapre da sola perché il microfono era finito
    await cam.evaluate(() => { stream.getAudioTracks().forEach((a) => { Object.defineProperty(a, "readyState", { configurable: true, get: () => "ended" }); }); });
    await dash.evaluate(() => command("camA", { cmd: "rec_start" }));
    t.check("riparte anche dopo il microfono terminato (camera riaperta)", await t.until(() => cam.evaluate(() => !!recording && stream && stream.getAudioTracks().every((a) => a.readyState !== "ended")), 20000));
    await sleep(2500);
    // 3) il registratore non conferma lo stop
    await cam.evaluate(() => { recording.mr.stop = () => {}; });
    await dash.evaluate(() => command("camA", { cmd: "rec_stop" }));
    t.check("stop non confermato: dopo pochi secondi chiudo io e la camera è libera", await t.until(() => cam.evaluate(() => !recording), 12000));
    await dash.evaluate(() => command("camA", { cmd: "rec_start" }));
    t.check("una nuova registrazione può partire subito dopo", await t.until(() => cam.evaluate(() => !!recording), 15000));
    await dash.evaluate(() => command("camA", { cmd: "rec_stop" }));
    await t.until(() => cam.evaluate(() => !recording), 12000);
  });
}
