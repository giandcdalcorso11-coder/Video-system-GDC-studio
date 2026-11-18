import { withEnv, sleep } from "../lib.mjs";
export const name = "Sicurezza: messaggi ostili sul canale (testo con codice, comandi non previsti, id strani)";
export async function run() {
  await withEnv({}, async (t) => {
    const dash = await t.dash(), cam = await t.cam("camA", { name: "Davanti" });
    t.check("camera collegata", await t.ready(dash, "camA"));
    const canale = JSON.parse(Buffer.from(t.code.slice(5).replace(/-/g, "+").replace(/_/g, "/"), "base64").toString()).c;
    // un "intruso" che conosce il link scrive sul canale
    const intruso = await t.ctx.newPage(); await intruso.goto(`${t.base}/camera-test.html`);
    const manda = (event, payload) => intruso.evaluate(([c, event, payload]) => { const bc = new BroadcastChannel("gdc-mock-" + c); bc.postMessage({ t: "ev", event, payload }); bc.close(); }, [canale, event, payload]);
    const XSS = '<img src=x onerror="window.__xss=1"><svg onload="window.__xss=2">';
    // 1) stato ostile da una camera "finta" (accettata, perché la conferma è spenta)
    await manda("state", { id: "evil123", name: XSS, device: XSS, os: XSS, err: XSS, res: XSS, storage: XSS, label: XSS, camReady: true, battery: XSS, bps: XSS, recSid: XSS,
      clips: [{ id: "s1", file: XSS, status: XSS, mb: XSS, dur: XSS, kind: XSS }], space: { known: true, level: XSS, minLeft: XSS, basis: XSS, availMB: XSS }, zoom: { native: true, min: XSS, max: XSS, cur: XSS }, pro: { focus: { modes: [XSS], cur: XSS } }, ts: Date.now() });
    await t.until(() => dash.evaluate(() => cameras.some((c) => c.id === "evil123")), 8000);
    await dash.evaluate(() => { location.hash = "#/cam/evil123"; }); await sleep(1500); await dash.evaluate(() => { location.hash = "#/"; route(); }); await sleep(1000);
    t.check("la regia non esegue codice contenuto nei dati della camera", (await dash.evaluate(() => window.__xss)) === undefined, await dash.evaluate(() => window.__xss));
    t.check("la regia non crea elementi dal testo ostile", await dash.evaluate(() => !document.querySelector("#view img, #view svg[onload], #joinBar img")));
    // 2) id strani vengono scartati
    await manda("state", { id: '"><script>window.__xss=3</script>', name: "x" }); await manda("state", { id: "ab", name: "troppo corto" });
    await sleep(1500);
    t.check("id non validi non creano camere", (await dash.evaluate(() => cameras.map((c) => c.id).filter((i) => !/^[A-Za-z0-9_-]{3,40}$/.test(i)).length)) === 0);
    // 3) comandi ostili verso la camera
    await manda("cmd", { to: "camA", from: "evil", cmd: "join_result", ok: true, label: XSS });
    await manda("cmd", { to: "camA", from: "evil", cmd: "rename", name: XSS, device: XSS });
    await manda("cmd", { to: "camA", from: "evil", cmd: "eval", code: "window.__xss=4" });
    await manda("cmd", { to: "camA", from: "evil", cmd: "pro", set: { "__proto__": { x: 1 }, constructor: 1, focusMode: XSS } });
    await manda("cmd", { to: "camA", from: "evil", cmd: "config", res: "<b>", bps: "abc" });
    await sleep(2500);
    t.check("la camera non esegue codice contenuto nei comandi", (await cam.evaluate(() => window.__xss)) === undefined, await cam.evaluate(() => window.__xss));
    t.check("la camera non crea elementi dal testo ostile", await cam.evaluate(() => !document.querySelector("body img, body svg[onload]")));
    t.check("il nome della camera non contiene caratteri di markup", await cam.evaluate(() => !/[<>"&]/.test(cfg.name + cfg.device + label)), await cam.evaluate(() => JSON.stringify([cfg.name, cfg.device, label])));
    t.check("la camera funziona ancora dopo i messaggi ostili", await cam.evaluate(() => !!stream) && (await dash.evaluate(() => state.camA && state.camA.online)));
    // 4) un messaggio gigante viene ignorato senza bloccare nulla
    await manda("state", { id: "big12345", name: "x".repeat(200000), clips: Array.from({ length: 5000 }, (_, i) => ({ id: "s" + i })) }); await sleep(1000);
    t.check("un messaggio gigante non blocca la regia", await dash.evaluate(() => { try { refresh(); return true; } catch { return false; } }));
  });
}
