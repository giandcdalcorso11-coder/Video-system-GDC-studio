import { withEnv, sleep } from "../lib.mjs";
export const name = "Segnali per il montaggio: posizione nelle clip, note, CSV ed EDL";
export async function run() {
  await withEnv({}, async (t) => {
    const dash = await t.dash(), cam = await t.cam("camA", { name: "Davanti" });
    t.check("camera collegata", await t.ready(dash, "camA"));
    t.check("pulsante Segna visibile", await dash.evaluate(() => !document.getElementById("markBtn").hidden));
    await dash.click("#markBtn"); await sleep(300);
    t.check("segnale senza registrazione: registrato senza camere", await dash.evaluate(() => Marks.list.length === 1 && Marks.list[0].cams.length === 0));
    await cam.evaluate(() => document.getElementById("recBtn").click()); await t.until(() => cam.evaluate(() => !!recording));
    await t.until(() => dash.evaluate(() => state.camA.rec && state.camA.recSid)); await sleep(3000);
    await dash.keyboard.press("m"); await sleep(2000); await dash.click("#markBtn"); await sleep(1000);
    await cam.evaluate(() => document.getElementById("recBtn").click());
    t.check("clip salvata e nome noto alla regia", await t.until(() => dash.evaluate(() => Object.keys(Marks.files).length > 0 && /\.mp4$|\.webm$/.test(Object.values(Marks.files)[0]))), await dash.evaluate(() => JSON.stringify(Marks.files)));
    const m = await dash.evaluate(() => Marks.list.map((x) => [x.n, x.cams.map((c) => Math.round(c.off))]));
    t.check("due segnali con posizione dentro la clip (M e pulsante)", m.length === 3 && m[1][1].length === 1 && m[2][1].length === 1, JSON.stringify(m));
    t.check("posizioni coerenti (circa 3 s e 5 s, tolleranza 1,5 s)", Math.abs(m[1][1][0] - 3300) < 1500 && Math.abs(m[2][1][0] - 5300) < 1500, JSON.stringify(m));
    await dash.evaluate(() => { Marks.list[1].note = "Gol | primo"; });
    const csv = await dash.evaluate(() => Marks.csv());
    t.check("CSV: intestazione, riga senza camere e righe con file e posizione", /segnale";"ora_regia/.test(csv) && /"1";"\d\d:\d\d:\d\d";"";"";"";"";""/.test(csv) && /"2";[^\n]*"Gol \| primo";"Camera 1 · Telefono · Davanti";"Camera1_Davanti_[^"]+\.(mp4|webm)";"00:00:0\d:\d\d"/.test(csv), csv);
    const edl = await dash.evaluate(() => Marks.edl("camA"));
    t.check("EDL: marcatori da 01:00:00:00 con la nota senza barre", /FCM: NON-DROP FRAME/.test(edl) && /001  001      V     C        01:00:0\d:\d\d/.test(edl) && /\|M:Gol   primo \|D:1/.test(edl) && /\|M:Segnale 3 \|D:1/.test(edl), edl);
    await dash.evaluate(() => { location.hash = "#/"; route(); });
    t.check("pannello Segnali in home con pulsante di esportazione", await t.until(() => dash.evaluate(() => !!document.querySelector('[data-mk="exp"]'))));
  });
}
