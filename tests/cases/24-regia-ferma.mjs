import { withEnv, sleep } from "../lib.mjs";
export const name = "Regia ferma per qualche secondo: le camere non vengono segnate offline per sbaglio";
export async function run() {
  await withEnv({ approve: false }, async (t) => {
    const dash = await t.dash(), cam = await t.cam("camA");
    await t.until(async () => (await dash.evaluate(() => cameras.length)) === 1, 15000);
    t.check("camera online", await t.until(() => dash.evaluate(() => Object.values(state).some((s) => s.online)), 15000));
    const r = await dash.evaluate(() => { const T = transport, id = Object.keys(T.s)[0]; T.seen[id] = Date.now() - 6000; T.lastSweep = Date.now() - 12000; T.sweep(); return { online: T.s[id].online, msg: adv.map((x) => x.m).filter((x) => /rimasta ferma/.test(x)).pop() || "" }; });
    t.check("dopo un blocco di 12 s la camera resta online", r.online === true, JSON.stringify(r));
    t.check("il registro lo spiega", /rimasta ferma/.test(r.msg), r.msg);
    const r2 = await dash.evaluate(() => { const T = transport, id = Object.keys(T.s)[0]; T.seen[id] = Date.now() - 9000; T.lastSweep = Date.now() - 2000; T.sweep(); return T.s[id].online; });
    t.check("senza blocco, una camera muta da 9 s viene segnata offline come prima", r2 === false);
  });
}
