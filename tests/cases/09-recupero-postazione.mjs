import { withEnv, sleep } from "../lib.mjs";
export const name = "Recupero dopo un blocco della pagina e postazione fissa";
// il formato mp4 di Chromium scrive i pezzi solo allo stop: per provare il recupero si usa webm, come fa Safari con pezzi continui
const SOLO_WEBM = () => { const o = MediaRecorder.isTypeSupported.bind(MediaRecorder); MediaRecorder.isTypeSupported = (t) => (/mp4/.test(t) ? false : o(t)); };
export async function run() {
  await withEnv({}, async (t) => {
    const dash = await t.dash(); let cam = await t.cam("camA", { name: "Davanti", init: SOLO_WEBM });
    t.check("camera collegata", await t.ready(dash, "camA"));
    await dash.evaluate(() => { location.hash = "#/cam/camA"; });
    await t.until(() => dash.evaluate(() => !!document.querySelector("#stationChk")));
    await dash.evaluate(() => document.querySelector("#stationChk").click());
    t.check("postazione fissa attivata sulla camera", await t.until(() => cam.evaluate(() => cfg.station === true)));
    await dash.evaluate(() => document.getElementById("recAll").click());
    t.check("la regia avvia la registrazione", await t.until(() => cam.evaluate(() => !!recording && wantRec)));
    await sleep(5000);
    const sid1 = await cam.evaluate(() => recording.sid), pezzi = await cam.evaluate((s) => db.chunkKeys(s).then((k) => k.length), sid1);
    t.check("i pezzi vengono scritti durante la ripresa", pezzi >= 3, pezzi);
    await cam.close(); // la pagina "muore" durante la registrazione
    cam = await t.cam("camA", { name: "Davanti", init: SOLO_WEBM });
    const rec = await t.until(() => cam.evaluate(async (sid) => { const x = (await db.sessions()).find((s) => s.id === sid); return x && x.recovered ? x : false; }, sid1), 15000);
    t.check("la clip interrotta è stata recuperata", !!rec && rec.status === "pronta" && rec.bytes > 50000, JSON.stringify(rec));
    t.check("durata ricostruita vicina ai secondi registrati", rec && rec.dur >= 3000 && rec.dur <= 9000, rec && rec.dur);
    t.check("la camera avvisa del recupero", await cam.evaluate(() => /recuperata/.test(lastErr)), await cam.evaluate(() => lastErr));
    t.check("postazione fissa: la registrazione riparte da sola (nuova clip)", await t.until(() => cam.evaluate((s) => !!recording && recording.sid !== s, sid1), 30000));
    await sleep(3000); // una ripresa vera, non di pochi millisecondi
    await dash.evaluate(() => document.getElementById("stopAll").click());
    t.check("dopo STOP non vuole più registrare", await t.until(() => cam.evaluate(() => !recording && wantRec === false), 10000));
    await cam.reload(); await sleep(9000);
    t.check("dopo una ricarica senza richiesta non registra", await cam.evaluate(() => !recording));
    t.check("le clip sono tutte utilizzabili", await cam.evaluate(() => sessions.length >= 2 && sessions.every((s) => s.status === "pronta")), await cam.evaluate(() => sessions.map((s) => s.status).join()));
  });
}
