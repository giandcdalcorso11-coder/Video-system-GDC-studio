import { withEnv, sleep } from "../lib.mjs";
export const name = "Audio interrotto: il registro scrive la diagnosi completa (pagina, anteprime, dispositivi, audioSession)";
export async function run() {
  await withEnv({ approve: false }, async (t) => {
    const dash = await t.dash(), cam = await t.cam("camA", { init: () => { let st = "active", type = "auto"; const l = []; window.__as = { fire: (s) => { st = s; l.forEach((f) => f()); } }; Object.defineProperty(navigator, "audioSession", { configurable: true, value: { get type() { return type; }, set type(v) { type = v; }, get state() { return st; }, addEventListener: (e, f) => l.push(f) } }); localStorage.setItem("gdc.audioSess", JSON.stringify("play-and-record")); } });
    await t.until(async () => (await dash.evaluate(() => cameras.length)) === 1, 15000);
    t.check("la sessione audio richiesta viene impostata", await t.until(() => cam.evaluate(() => navigator.audioSession.type === "play-and-record"), 8000), await cam.evaluate(() => navigator.audioSession.type));
    await cam.evaluate(() => window.__as.fire("interrupted"));
    t.check("il cambio di stato della sessione audio viene registrato", await t.until(() => cam.evaluate(() => dbgBuf.some((x) => /audioSession cambiata: tipo play-and-record, stato interrupted/.test(x.m))), 5000));
    await cam.evaluate(() => { stream.getAudioTracks()[0].dispatchEvent(new Event("ended")); });
    t.check("alla fine della traccia audio compare la DIAGNOSI AUDIO", await t.until(() => cam.evaluate(() => dbgBuf.some((x) => /DIAGNOSI AUDIO/.test(x.m))), 5000));
    const m = await cam.evaluate(() => (dbgBuf.find((x) => /DIAGNOSI AUDIO/.test(x.m)) || {}).m || "");
    t.check("la diagnosi contiene visibilità, anteprime, età della camera, sessione audio e dispositivi", /visibilita/.test(m) && /anteprime/.test(m) && /cameraAperta_s/.test(m) && /audioSession/.test(m) && /dispositivi/.test(m) && /stato interrupted/.test(m), m.slice(0, 400));
  });
}
