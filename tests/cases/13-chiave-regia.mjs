import { withEnv, sleep } from "../lib.mjs";
export const name = "Chiave della regia: solo i comandi firmati dalla regia vengono eseguiti";
export async function run() {
  await withEnv({ secure: true }, async (t) => {
    const b64 = (code) => JSON.parse(Buffer.from(code.slice(5).replace(/-/g, "+").replace(/_/g, "/"), "base64").toString());
    const link = b64(t.code), linkDash = b64(t.codeDash);
    t.check("il link della camera ha la chiave pubblica e non la privata", !!link.p && !link.d);
    t.check("il link della dashboard ha anche la chiave privata", !!linkDash.p && !!linkDash.d && linkDash.p === link.p);
    const dash = await t.dash(), cam = await t.cam("camA");
    t.check("camera collegata", await t.ready(dash, "camA"));
    t.check("la regia non rifà le chiavi del link", await dash.evaluate((p) => pairing.p === p && !!pairing.d, link.p));
    const rec = () => cam.evaluate(() => !!recording);
    // 1) un comando firmato dalla regia viene eseguito
    await dash.evaluate(() => command("camA", { cmd: "rec_start" }));
    t.check("comando firmato dalla regia: REC parte", await t.until(rec, 15000));
    // 1b) con la chiave i trasferimenti funzionano (i campi della firma non devono toccare quelli dei comandi)
    await dash.evaluate(() => command("camA", { cmd: "rec_stop" })); await t.until(async () => !(await rec()), 15000); await sleep(800);
    await dash.evaluate(() => { location.hash = "#/cam/camA"; Dest.mode = "device"; Xfer.jobs.clear(); Xfer.refresh(); });
    const sid = await cam.evaluate(() => sessions[0].id);
    await t.until(() => dash.evaluate((s) => !!document.querySelector(`[data-xf="go"][data-sid="${s}"]:not([disabled])`), sid));
    await dash.evaluate((s) => document.querySelector(`[data-xf="go"][data-sid="${s}"]`).click(), sid);
    t.check("con la chiave: il trasferimento di una clip arriva", await t.until(() => dash.evaluate(() => [...Xfer.jobs.values()].some((j) => j.state === "ok")), 40000), await dash.evaluate(() => [...Xfer.jobs.values()].map((j) => j.state + ":" + (j.error || "")).join()));
    await dash.evaluate(() => command("camA", { cmd: "rec_start" })); await t.until(rec, 15000);
    // 2) un intruso (ha solo il link): comandi senza firma, con firma sbagliata e ripetuti
    const intruso = await t.ctx.newPage(); await intruso.goto(`${t.base}/camera-test.html`);
    await intruso.evaluate(() => { window.__visti = []; window.__bc = new BroadcastChannel("gdc-mock-" + window.__c); });
    await intruso.evaluate((c) => { window.__bc.close(); window.__c = c; window.__bc = new BroadcastChannel("gdc-mock-" + c); window.__bc.onmessage = (e) => { if (e.data.t === "ev" && e.data.event === "cmd") window.__visti.push(e.data.payload); }; }, link.c);
    const manda = (event, payload) => intruso.evaluate(([event, payload]) => window.__bc.postMessage({ t: "ev", event, payload }), [event, payload]);
    await manda("cmd", { to: "camA", from: "evil", cmd: "rec_stop" }); await sleep(1500);
    t.check("senza firma: STOP ignorato", await rec());
    await manda("cmd", { to: "camA", from: "evil", cmd: "rec_stop", as: "x", an: 1, at: Date.now(), sig: "A".repeat(86) }); await sleep(1500);
    t.check("firma falsa: STOP ignorato", await rec());
    // firma con un'altra chiave
    const altra = await intruso.evaluate(async () => { const kp = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign"]); const body = { to: "camA", from: "evil", cmd: "rec_stop", as: "y", an: 1, at: Date.now() }; const sort = (v) => (Array.isArray(v) ? v.map(sort) : v && typeof v === "object" ? Object.keys(v).sort().reduce((o, k) => ((o[k] = sort(v[k])), o), {}) : v); const sig = new Uint8Array(await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, kp.privateKey, new TextEncoder().encode(JSON.stringify(sort(body))))); return { ...body, sig: btoa(String.fromCharCode(...sig)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "") }; });
    await manda("cmd", altra); await sleep(1500);
    t.check("firma con un'altra chiave: STOP ignorato", await rec());
    t.check("la regia viene avvisata del rifiuto", await t.until(() => dash.evaluate(() => logs.some((l) => /non autorizzato|non riuscito/.test(l.msg)) || adv.some((x) => /non autorizzato/.test(x.m))), 8000));
    // 3) ripetizione di un comando firmato già visto
    await dash.evaluate(() => command("camA", { cmd: "zoom", z: 1 })); await sleep(1500);
    const visti = await intruso.evaluate(() => window.__visti);
    const firmato = visti.find((m) => m.sig && m.cmd === "zoom");
    t.check("l'intruso può vedere i comandi firmati sul canale (la firma non nasconde)", !!firmato);
    await dash.evaluate(() => command("camA", { cmd: "rec_stop" }));
    t.check("comando firmato dalla regia: STOP funziona", await t.until(async () => !(await rec()), 15000));
    const stopFirmato = (await intruso.evaluate(() => window.__visti)).find((m) => m.sig && m.cmd === "rec_stop");
    await dash.evaluate(() => command("camA", { cmd: "rec_start" })); t.check("REC di nuovo dalla regia", await t.until(rec, 15000));
    await manda("cmd", stopFirmato); await sleep(1800);
    t.check("un STOP firmato già usato, rimandato dall'intruso, viene ignorato", await rec());
    // 4) una seconda regia aperta con il link della dashboard funziona; con il link della camera no
    const dash2 = await t.dash("&dev=1", t.codeDash); t.check("seconda regia (link dashboard) collegata", await t.until(() => dash2.evaluate(() => state.camA && state.camA.online)));
    await dash2.evaluate(() => command("camA", { cmd: "rec_stop" }));
    t.check("la seconda regia con la chiave privata può comandare", await t.until(async () => !(await rec()), 15000));
    await dash2.close();
    const dash3 = await t.dash("&dev=1", t.code); await t.until(() => dash3.evaluate(() => state.camA && state.camA.online));
    await dash3.evaluate(() => command("camA", { cmd: "rec_start" })); await sleep(2000);
    t.check("una regia aperta con il link della camera (senza chiave privata) non può comandare", !(await rec()));
  });
  // collegamento senza chiave (link vecchi): come prima
  await withEnv({}, async (t) => {
    const dash = await t.dash(), cam = await t.cam("camA"); await t.ready(dash, "camA");
    await dash.evaluate(() => command("camA", { cmd: "rec_start" }));
    t.check("link senza chiave: la camera obbedisce come prima", await t.until(() => cam.evaluate(() => !!recording), 15000));
  });
}
