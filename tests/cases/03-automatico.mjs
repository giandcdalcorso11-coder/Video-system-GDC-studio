import { withEnv, sleep } from "../lib.mjs";
export const name = "Trasferimento automatico, buffer a rotazione, modalità file sui telefoni, anteprima";
export async function run() {
  await withEnv({}, async (t) => {
    const cam = await t.cam("camA"), dash = await t.dash();
    t.check("camera collegata", await t.ready(dash, "camA"));
    await dash.evaluate(() => { window.__fs = {}; Xfer.jobs.clear(); Dest.handle = window.__mkDir("Disco"); Dest.mode = "folder"; Dest.health = null; Xfer.delAfter = true; Xfer.auto = false; Xfer.hold = false; Xfer.refresh(); });
    await t.rec(cam, 4);
    const n = () => cam.evaluate(() => sessions.filter((s) => s.kind !== "timelapse").map((s) => s.status));
    await sleep(2500);
    t.check("automatico spento: nulla parte da solo", (await dash.evaluate(() => Xfer.jobs.size)) === 0 && (await n()).join() === "pronta");
    // hold: l'automatico non parte nemmeno se acceso
    await dash.evaluate(() => { Xfer.hold = true; Xfer.auto = true; }); await sleep(3000);
    t.check("file sui telefoni: l'automatico resta fermo", (await dash.evaluate(() => Xfer.jobs.size)) === 0);
    await dash.evaluate(() => { Xfer.hold = false; Xfer.autoAll(); });
    t.check("automatico acceso: la clip arriva e viene tolta dal telefono", await t.until(async () => (await n()).length === 0, 40000), JSON.stringify(await n()));
    t.check("il file è nella cartella", (await dash.evaluate(() => window.__real("Disco").length)) === 1);
    // durante una ripresa non parte nulla; a ripresa finita parte
    await cam.evaluate(() => document.getElementById("recBtn").click()); await t.until(() => cam.evaluate(() => !!recording));
    await cam.evaluate(async () => { const s = { id: "vecchia1", start: Date.now() - 99999, end: Date.now() - 90000, dur: 9000, bytes: 300000, chunks: 1, mime: "video/mp4", res: "x", bps: 1, status: "pronta" }; await db.putChunk("vecchia1:000001", new Blob([new Uint8Array(300000)])); await db.putSession(s); await loadSessions(); publish(); });
    await sleep(5000);
    t.check("durante la ripresa non parte nessun trasferimento", (await dash.evaluate(() => Xfer.jobs.size)) === 1);
    await cam.evaluate(() => document.getElementById("recBtn").click());
    t.check("a ripresa finita partono tutte", await t.until(async () => (await n()).length === 0, 40000), JSON.stringify(await n()));
    t.check("tre file nella cartella", (await dash.evaluate(() => window.__real("Disco").length)) === 3);
    // anteprima durante i trasferimenti
    await dash.evaluate(() => { Xfer.jobs.set("falso", { id: "falso", camId: "camA", state: "in corso" }); curDetail = "camA"; });
    t.check("anteprima accesa di default durante un trasferimento", (await dash.evaluate(() => Preview.want("camA"))) === "full");
    await dash.evaluate(() => { Xfer.keepPrev = false; });
    t.check("spunta spenta: anteprima sospesa", (await dash.evaluate(() => Preview.want("camA"))) === null);
    await dash.evaluate(() => Xfer.jobs.clear());
    t.check("senza trasferimenti: anteprima di nuovo accesa", (await dash.evaluate(() => Preview.want("camA"))) === "full");
  });
}
