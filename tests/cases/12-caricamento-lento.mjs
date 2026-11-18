import { withEnv } from "../lib.mjs";
export const name = "Caricamento lento dei moduli (rete debole): nessuna esecuzione a metà";
export async function run() {
  // ogni modulo arriva con un ritardo casuale; stati salvati che attivano codice all'apertura (prova di memoria interrotta, postazione fissa)
  await withEnv({ delay: (u) => (/\/(camera|dashboard)\/\d\d-/.test(u) ? Math.floor(Math.random() * 700) : 0) }, async (t) => {
    await t.ctx.addInitScript(() => { try { localStorage.setItem("gdc.memTest", JSON.stringify({ running: true, mb: 512, at: Date.now() })); localStorage.setItem("gdc.wantRec", "true"); localStorage.setItem("gdc.camCfg", JSON.stringify({ station: true, autoCam: true, name: "Davanti" })); } catch { /* ok */ } });
    const dash = await t.dash(), cam = await t.cam("camA");
    t.check("la regia si carica e riporta la prova di memoria interrotta", await t.until(() => dash.evaluate(() => typeof adv !== "undefined" && adv.some((x) => /INTERROTTA/.test(x.m))), 15000));
    t.check("la camera si collega alla regia nonostante il carico lento", await t.ready(dash, "camA"));
    t.check("la postazione fissa riparte con lo stato salvato", await t.until(() => cam.evaluate(() => !!recording), 40000));
  });
}
