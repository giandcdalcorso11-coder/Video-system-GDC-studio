import { withEnv, sleep } from "../lib.mjs";
export const name = "Riaprire il link della dashboard non fa perdere le chiavi di firma (la camera continua a obbedire)";
export async function run() {
  await withEnv({ approve: false }, async (t) => {
    // link della dashboard SENZA chiavi (come quello da sviluppatore): la regia se le crea al primo avvio
    const b64 = (code) => JSON.parse(Buffer.from(code.slice(5).replace(/-/g, "+").replace(/_/g, "/"), "base64").toString());
    const enc = (o) => "gdc1." + Buffer.from(JSON.stringify(o)).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const base = b64(t.code), nuda = { u: base.u, k: base.k, c: base.c };
    const dash = await t.dash("&dev=1", enc(nuda));
    t.check("la regia si crea le chiavi al primo avvio", await t.until(() => dash.evaluate(() => !!pairing.p && !!pairing.d)));
    const k0 = await dash.evaluate(() => ({ p: pairing.p, d: pairing.d }));
    // la camera entra dal link con la parte pubblica
    const cam = await t.cam("camA"); await dash.evaluate((p) => {}, k0);
    const camLink = enc({ ...nuda, p: k0.p });
    await cam.goto(`${t.base}/camera.html?mock=1#${camLink}~camA`); await sleep(1500);
    t.check("camera collegata", await t.ready(dash, "camA"));
    await dash.evaluate(() => command("camA", { cmd: "rec_start" }));
    t.check("con le chiavi di partenza il REC parte", await t.until(() => cam.evaluate(() => !!recording), 15000));
    await dash.evaluate(() => command("camA", { cmd: "rec_stop" })); await t.until(async () => !(await cam.evaluate(() => !!recording)), 15000);
    // riapro lo STESSO link senza chiavi (come fa Safari quando riporta la pagina): le chiavi devono restare
    await dash.goto(`${t.base}/dashboard.html?mock=1&dev=1#${enc(nuda)}`); await dash.reload();
    await t.until(() => dash.evaluate(() => typeof Join !== "undefined" && !!pairing));
    await sleep(1000);
    const k1 = await dash.evaluate(() => ({ p: pairing.p, d: pairing.d }));
    t.check("riaprendo lo stesso link le chiavi sono le stesse", k1.p === k0.p && k1.d === k0.d, JSON.stringify([k0.p && k0.p.slice(0, 6), k1.p && k1.p.slice(0, 6)]));
    t.check("la camera si ricollega", await t.until(() => dash.evaluate(() => state.camA && state.camA.online), 25000));
    await dash.evaluate(() => command("camA", { cmd: "rec_start" }));
    t.check("dopo aver riaperto il link la camera obbedisce ancora (niente 'firma non valida')", await t.until(() => cam.evaluate(() => !!recording), 15000));
    // un link con un canale DIVERSO sostituisce tutto (è un'altra sessione)
    const altra = { ...nuda, c: nuda.c.slice(0, -3) + "zzz" };
    await dash.goto(`${t.base}/dashboard.html?mock=1&dev=1#${enc(altra)}`); await dash.reload(); await sleep(1500);
    const k2 = await dash.evaluate(() => ({ c: pairing.c, p: pairing.p }));
    t.check("un canale diverso crea chiavi nuove", k2.c === altra.c && k2.p !== k0.p, JSON.stringify(k2).slice(0, 80));
  });
}
