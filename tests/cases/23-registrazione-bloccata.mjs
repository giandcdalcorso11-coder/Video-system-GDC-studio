import { withEnv, sleep } from "../lib.mjs";
export const name = "Registrazione: microfono interrotto e stop non confermato non lasciano la camera bloccata";
export async function run() {
  await withEnv({ approve: false }, async (t) => {
    const dash = await t.dash(), cam = await t.cam("camA");
    await dash.evaluate(() => { location.hash = "#/"; route(); });
    await t.until(async () => (await dash.evaluate(() => cameras.length)) === 1, 15000);
    // 1) il microfono termina durante la registrazione: la clip si salva e la ripresa continua da sola in un nuovo file
    await dash.evaluate(() => command("camA", { cmd: "rec_start" }));
    t.check("la registrazione parte", await t.until(() => cam.evaluate(() => !!recording), 15000));
    await sleep(2500);
    const sid0 = await cam.evaluate(() => recording.sid);
    await cam.evaluate(() => { const a = stream.getAudioTracks()[0]; a.dispatchEvent(new Event("ended")); });
    t.check("microfono terminato: la prima clip viene fermata e salvata", await t.until(() => cam.evaluate(async (s0) => (await db.sessions()).some((x) => x.id === s0 && x.status === "pronta"), sid0), 12000));
    t.check("e la ripresa continua da sola in un nuovo file", await t.until(() => cam.evaluate((s0) => !!recording && recording.sid !== s0, sid0), 15000), await cam.evaluate(() => String(lastErr)));
    await sleep(1500);
    await dash.evaluate(() => command("camA", { cmd: "rec_stop" }));
    t.check("con lo stop dalla regia la ripresa si ferma e NON riparte", await t.until(() => cam.evaluate(() => !recording), 12000));
    await sleep(4000);
    t.check("dopo lo stop dalla regia resta ferma", await cam.evaluate(() => !recording));
    t.check("c'è un messaggio chiaro sul microfono", await cam.evaluate(() => dbgBuf.some((x) => /microfono interrotto dal sistema/.test(x.m))));
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
    // 4) il sistema blocca la cattura (nessun dato): stessa cosa, la ripresa continua da sola in un nuovo file
    await dash.evaluate(() => command("camA", { cmd: "rec_start" }));
    await t.until(() => cam.evaluate(() => !!recording), 15000); await sleep(2500);
    const sid1 = await cam.evaluate(() => recording.sid);
    await cam.evaluate(() => { recording.lastData = Date.now() - 20000; });
    t.check("senza dati per 10 s: clip salvata e ripresa in un nuovo file", await t.until(() => cam.evaluate(async (s1) => !!recording && recording.sid !== s1 && (await db.sessions()).some((x) => x.id === s1), sid1), 25000));
    await dash.evaluate(() => command("camA", { cmd: "rec_stop" }));
    await t.until(() => cam.evaluate(() => !recording), 12000);
  });
}
