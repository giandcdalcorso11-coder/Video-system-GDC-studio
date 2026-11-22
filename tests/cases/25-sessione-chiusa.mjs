import { withEnv, sleep } from "../lib.mjs";
export const name = "Nuova sessione: le camere si accorgono, si fermano in sicurezza e chiedono un QR valido; avviso se nessuna regia le comanda";
export async function run() {
  await withEnv({ approve: false }, async (t) => {
    const dash = await t.dash(), cam = await t.cam("camA");
    await t.until(async () => (await dash.evaluate(() => cameras.length)) === 1, 15000);
    // 1) nessuna regia sul canale: dopo un po' la camera lo dice (qui lo simulo accorciando l'attesa)
    await cam.evaluate(() => { regiaPresente = false; regiaVista = Date.now() - 100000; orphanCheck(); });
    t.check("senza regia da oltre 90 s compare l'avviso 'Nessuna regia collegata'", await cam.evaluate(() => !document.getElementById("orphanBar").hidden && /nessuna regia comanda/.test(document.getElementById("orphanTxt").textContent)), await cam.evaluate(() => document.getElementById("orphanTxt").textContent));
    await cam.evaluate(() => { regiaPresente = true; regiaVista = Date.now(); orphanCheck(); });
    t.check("quando la regia c'è l'avviso sparisce", await cam.evaluate(() => document.getElementById("orphanBar").hidden));
    // 2) nuova sessione dalla regia, con la camera in registrazione
    await dash.evaluate(() => { location.hash = "#/"; route(); command("camA", { cmd: "rec_start" }); });
    t.check("la camera registra", await t.until(() => cam.evaluate(() => !!recording), 15000));
    await sleep(1500);
    dash.once("dialog", (d) => d.accept("Seconda sessione"));
    await Promise.all([dash.waitForEvent("load", { timeout: 25000 }).catch(() => {}), dash.evaluate(() => Session.begin("Seconda sessione"))]);
    t.check("la camera esce dalla sessione e chiede un QR valido", await t.until(async () => { try { return await cam.evaluate(() => !document.getElementById("pairBox").hidden && /chiuso la sessione/.test(document.getElementById("pairEnded").textContent)); } catch { return false; } }, 25000), await cam.evaluate(() => document.getElementById("pairEnded").textContent).catch(() => "?"));
    t.check("il messaggio dice di inquadrare il QR valido e che le clip restano", await cam.evaluate(() => /QR valido/.test(document.getElementById("pairEnded").textContent) && /clip già registrate restano/.test(document.getElementById("pairEnded").textContent)));
    t.check("la camera non è più abbinata e il controllo camera è nascosto", await cam.evaluate(() => !pairing && document.getElementById("main").hidden));
    t.check("la clip registrata è stata fermata e salvata sul telefono", await cam.evaluate(async () => (await db.sessions()).some((s) => s.status === "pronta")), await cam.evaluate(async () => JSON.stringify((await db.sessions()).map((s) => s.status))));
  });
}
