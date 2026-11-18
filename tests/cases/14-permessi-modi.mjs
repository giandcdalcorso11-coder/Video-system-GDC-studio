import { withEnv, sleep } from "../lib.mjs";
export const name = "Permesso di avviare/fermare dal telefono e modo di ripresa per camera";
export async function run() {
  await withEnv({ secure: true }, async (t) => {
    const dash = await t.dash(), camA = await t.cam("camA", { name: "Fissa" }), camB = await t.cam("camB", { name: "Libera" });
    t.check("due camere collegate", (await t.ready(dash, "camA")) && (await t.ready(dash, "camB")));
    const visibile = (cam) => cam.evaluate(() => !document.getElementById("recLocal").hidden);
    // --- permesso
    t.check("di default sul telefono non c'è il pulsante REC", !(await visibile(camA)) && !(await visibile(camB)));
    t.check("pannello 'Tutte le camere…' nella home della regia", await dash.evaluate(() => !!document.getElementById("permAllChk")));
    await dash.evaluate(() => { location.hash = "#/cam/camA"; });
    await t.until(() => dash.evaluate(() => !!document.getElementById("localRecChk")));
    await dash.evaluate(() => document.getElementById("localRecChk").click());
    t.check("permesso dato a una sola camera: il pulsante compare solo su quella", await t.until(() => visibile(camA)) && !(await visibile(camB)));
    await camA.evaluate(() => document.getElementById("recLocal").click());
    t.check("il telefono avvia la registrazione da solo", await t.until(() => camA.evaluate(() => !!recording)));
    t.check("la regia vede la camera in REC", await t.until(() => dash.evaluate(() => state.camA.rec)));
    await dash.evaluate(() => command("camA", { cmd: "rec_stop" }));
    t.check("lo STOP della regia ferma comunque la camera", await t.until(() => camA.evaluate(() => !recording)));
    await camA.evaluate(() => document.getElementById("recLocal").click()); await t.until(() => camA.evaluate(() => !!recording));
    await camA.evaluate(() => document.getElementById("recLocal").click());
    t.check("il telefono può anche fermarla da solo", await t.until(() => camA.evaluate(() => !recording)));
    await dash.evaluate(() => document.getElementById("localRecChk").click());
    t.check("permesso tolto: il pulsante sparisce", await t.until(async () => !(await visibile(camA))));
    // tutte le camere
    await dash.evaluate(() => { location.hash = "#/"; route(); }); await t.until(() => dash.evaluate(() => !!document.getElementById("permAllChk")));
    await dash.evaluate(() => document.getElementById("permAllChk").click());
    t.check("'tutte' dà il permesso a entrambe", await t.until(async () => (await visibile(camA)) && (await visibile(camB))));
    const camC = await t.cam("camC", { name: "Nuova" });
    t.check("una camera che entra dopo eredita 'tutte'", await t.until(() => visibile(camC), 20000));
    await dash.evaluate(() => document.getElementById("permAllChk").click());
    t.check("'tutte' spento toglie il permesso a tutte", await t.until(async () => !(await visibile(camA)) && !(await visibile(camB)) && !(await visibile(camC))));
    // se il telefono ha un valore diverso dal voluto, la regia lo riallinea
    await camB.evaluate(() => { cfg.localRec = true; publish(); });
    t.check("la regia riallinea un telefono che ha un permesso diverso", await t.until(async () => !(await visibile(camB)), 30000));
    // la scelta non si può cambiare senza la chiave della regia
    const intruso = await t.ctx.newPage(); await intruso.goto(`${t.base}/camera-test.html`);
    const canale = JSON.parse(Buffer.from(t.code.slice(5).replace(/-/g, "+").replace(/_/g, "/"), "base64").toString()).c;
    await intruso.evaluate((c) => new BroadcastChannel("gdc-mock-" + c).postMessage({ t: "ev", event: "cmd", payload: { to: "camA", from: "evil", cmd: "perm_cfg", localRec: true } }), canale); await sleep(1500);
    t.check("un intruso non può dare il permesso", !(await visibile(camA)));
    // --- modi di ripresa
    await dash.evaluate(() => Mode.setMode("camB", "timelapse"));
    t.check("camB in time-lapse, camA in video", await dash.evaluate(() => Mode.of(camById("camA")) === "video" && Mode.of(camById("camB")) === "timelapse"));
    await dash.evaluate(() => document.getElementById("recAll").click());
    t.check("REC tutte: camA registra in video", await t.until(() => camA.evaluate(() => !!recording)));
    t.check("REC tutte: camB parte in time-lapse (non registra video)", await t.until(() => camB.evaluate(() => !!tl && !recording)), await camB.evaluate(() => lastErr));
    t.check("la regia vede camA in REC e camB in time-lapse", await t.until(() => dash.evaluate(() => state.camA.rec && !state.camB.rec && state.camB.tl && state.camB.tl.stage === "shooting")));
    await sleep(3000);
    await dash.evaluate(() => document.getElementById("stopAll").click());
    t.check("STOP tutte ferma entrambe", await t.until(() => camA.evaluate(() => !recording)) && (await t.until(() => camB.evaluate(() => !tl || tl.stage !== "shooting"), 20000)));
    t.check("camB ha prodotto un video time-lapse", await t.until(() => camB.evaluate(() => sessions.some((s) => s.kind === "timelapse" && s.status === "pronta")), 60000), await camB.evaluate(() => JSON.stringify(sessions.map((s) => [s.kind, s.status]))));
    t.check("camA ha registrato un video normale", await camA.evaluate(() => sessions.some((s) => s.kind !== "timelapse" && s.status === "pronta")));
    // impostazioni del time-lapse ricordate per camera
    await dash.evaluate(() => { location.hash = "#/cam/camB"; }); await t.until(() => dash.evaluate(() => !!document.getElementById("tlInt")));
    await dash.evaluate(() => { const m = document.getElementById("tlMode"); m.value = "man"; m.dispatchEvent(new Event("change", { bubbles: true })); const i = document.getElementById("tlInt"); i.value = "10"; i.dispatchEvent(new Event("change", { bubbles: true })); });
    t.check("le impostazioni del time-lapse restano salvate per la camera", await dash.evaluate(() => { const x = Mode.tl(camById("camB")); return x.mode === "man" && x.int === 10; }));
  });
}
