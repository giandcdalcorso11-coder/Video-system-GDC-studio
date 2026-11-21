import { withEnv, sleep } from "../lib.mjs";
export const name = "Registro: visibilità, tempo in secondo piano e timer in ritardo (regia e camera)";
export async function run() {
  await withEnv({ approve: false }, async (t) => {
    const dash = await t.dash(), cam = await t.cam("camA");
    const buf = { regia: () => dash.evaluate(() => adv.map((x) => x.m)), camera: () => cam.evaluate(() => dbgBuf.map((x) => x.m)) };
    for (const [nome, pg] of [["regia", dash], ["camera", cam]]) {
      const hide = (h) => pg.evaluate((x) => { Object.defineProperty(document, "hidden", { configurable: true, get: () => x }); Object.defineProperty(document, "visibilityState", { configurable: true, get: () => (x ? "hidden" : "visible") }); document.dispatchEvent(new Event("visibilitychange")); }, h);
      await hide(true);
      await pg.evaluate(() => { PageWatch.last -= 4000; }); await sleep(1300);
      await hide(false);
      const m = await buf[nome]();
      t.check(`${nome}: registra quando la pagina si nasconde`, m.some((x) => /visibilità: nascosta/.test(x)));
      t.check(`${nome}: registra il timer in ritardo con lo stato della pagina`, m.some((x) => /timer in ritardo: \d\.\d s .*nascosta da/.test(x)), m.filter((x) => /timer/.test(x)).join(" | "));
      t.check(`${nome}: al ritorno scrive da quanti secondi e quante volte i timer hanno ritardato`, m.some((x) => /di nuovo visibile dopo [12] s; timer in ritardo \d+ volt/.test(x)), m.filter((x) => /visibile/.test(x)).join(" | "));
    }
    const off = await dash.evaluate(() => { const T = transport; const id = Object.keys(T.s)[0]; if (!id) return "nessuna camera"; T.seen[id] = Date.now() - 9000; T.sweep(); return adv.map((x) => x.m).filter((x) => /la segno offline/.test(x)).pop() || ""; }).catch((e) => String(e));
    t.check("regia: il messaggio 'camera offline' dice se la regia era in secondo piano e lo stato del collegamento", /offline \[regia: .*rete (ok|assente), collegamento /.test(off), off);
  });
}
