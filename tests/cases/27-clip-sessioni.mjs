import { withEnv, sleep } from "../lib.mjs";
export const name = "Clip: tutte visibili in regia, sessione di appartenenza e avviso di clip non trasferite";
export async function run() {
  await withEnv({ approve: false }, async (t) => {
    const dash = await t.dash(), cam = await t.cam("camA");
    await t.until(async () => (await dash.evaluate(() => cameras.length)) === 1, 15000);
    await dash.evaluate(() => { Session.cur.name = "Prova uno"; Session.save && Session.save(); Join.greeted = {}; Join.greet("camA"); });
    t.check("la camera impara il nome della sessione dalla regia", await t.until(() => cam.evaluate(() => sessName === "Prova uno"), 10000), await cam.evaluate(() => sessName));
    await dash.evaluate(() => { location.hash = "#/"; route(); command("camA", { cmd: "rec_start" }); });
    await t.until(() => cam.evaluate(() => !!recording), 15000); await sleep(1800);
    await dash.evaluate(() => command("camA", { cmd: "rec_stop" }));
    await t.until(async () => !(await cam.evaluate(() => !!recording)), 15000);
    t.check("la clip registrata porta il nome della sessione", await t.until(() => cam.evaluate(() => stateObj().clips.some((k) => k.sn === "Prova uno")), 8000), await cam.evaluate(() => JSON.stringify(stateObj().clips.map((k) => k.sn))));
    t.check("la regia riceve la sessione di ogni clip", await t.until(() => dash.evaluate(() => (state.camA.clips || []).some((k) => k.sn === "Prova uno")), 8000));
    // ora la regia 'cambia sessione': la clip diventa vecchia
    await dash.evaluate(() => { Session.cur.start = Date.now() + 60000; Xfer.refresh(); });
    t.check("la clip di una sessione precedente è segnata con il nome della sessione", await dash.evaluate(() => /da “Prova uno”/.test(Xfer.sessTxt((state.camA.clips || [])[0]))));
    t.check("in home compare l'avviso sulle clip di sessioni precedenti", await t.until(() => dash.evaluate(() => /sessioni precedenti sono ancora sui telefoni/.test(document.getElementById("xferGlobal").textContent)), 8000));
    // oltre 40 clip: lo dice
    await dash.evaluate(() => { state.camA.clipsTot = 55; state.camA.clips = Array.from({ length: 40 }, (_, i) => ({ id: "x" + i, file: "f" + i + ".mp4", dur: 1000, mb: 1, status: "inviata", kind: "video", at: 1, sn: "" })); Xfer.renderGlobal(); });
    t.check("se sul telefono ci sono più di 40 clip lo dice in home", await dash.evaluate(() => /altre 15 clip/.test(document.getElementById("xferGlobal").textContent)), await dash.evaluate(() => document.getElementById("xferGlobal").textContent.replace(/\s+/g, " ").slice(-260)));
    // rientro della camera con clip pronte: avviso nel registro
    const msg = await dash.evaluate(() => { const T = transport; state.camA.clips = [{ id: "p1", file: "a.mp4", dur: 1000, mb: 12, status: "pronta", kind: "video", at: 1, sn: "Vecchia" }]; return new Promise((res) => { T.noteAt = {}; T.s.camA.online = false; setTimeout(() => res(adv.map((x) => x.m).filter((x) => /al rientro/.test(x)).pop() || ""), 3500); }); });
    t.check("al rientro la regia avvisa delle clip non trasferite", /al rientro 1 clip da trasferire/.test(msg), msg);
  });
}
