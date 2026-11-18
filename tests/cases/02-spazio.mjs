import { withEnv, sleep } from "../lib.mjs";
export const name = "Spazio: minuti rimasti, controllo iniziale, arresto sicuro, liberazione facoltativa";
export async function run() {
  await withEnv({}, async (t) => {
    const cam = await t.cam("camA"), dash = await t.dash();
    t.check("camera collegata", await t.ready(dash, "camA"));
    const sp = () => dash.evaluate(() => state.camA && state.camA.space);
    const stub = (q, u) => cam.evaluate(([q, u]) => { Object.defineProperty(navigator.storage, "estimate", { value: async () => ({ quota: q * 1048576, usage: u * 1048576 }), configurable: true }); }, [q, u]);
    const pre = () => dash.evaluate(() => { const e = document.querySelector("#preflight"); return e ? e.innerText : ""; });
    const a = await t.until(async () => { const s = await sp(); return s && s.known ? s : false; });
    t.check("stato normale: livello ok e minuti > 5", a && a.level === "ok" && a.minLeft > 5, JSON.stringify(a));
    t.check("controllo iniziale: Tutto pronto", await t.until(async () => /Tutto pronto/.test(await pre()), 8000), await pre());
    for (let i = 0; i < 3; i++) await t.rec(cam, 3);
    // poco spazio
    await stub(2000, 1900); await cam.evaluate(() => spaceTick());
    const b = await t.until(async () => { const s = await sp(); return s && s.level === "crit" ? s : false; }, 10000);
    t.check("poco spazio: livello crit", !!b, JSON.stringify(await sp()));
    t.check("controllo iniziale: Da sistemare", await t.until(async () => /Da sistemare/.test(await pre()), 8000), await pre());
    t.check("avviso nel registro della regia", await dash.evaluate(() => logs.some((l) => /spazio quasi finito/.test(l.msg))));
    // REC rifiutato
    await dash.evaluate(() => command("camA", { cmd: "rec_start" })); await sleep(2500);
    t.check("REC rifiutato con poco spazio", await cam.evaluate(() => !recording && /Spazio insufficiente/.test(lastErr)), await cam.evaluate(() => lastErr));
    // liberazione: spenta non cancella, accesa cancella solo le "inviata"
    await cam.evaluate(async () => { const st = ["inviata", "pronta", "inviata"]; sessions.forEach((s, i) => { s.status = st[i]; }); for (const s of sessions) await db.putSession(s); lastErr = ""; });
    await cam.evaluate(() => spaceTick()); await sleep(800);
    t.check("liberazione spenta: nessuna clip cancellata", await cam.evaluate(() => sessions.length === 3));
    await dash.evaluate(() => command("camA", { cmd: "space_cfg", autoFree: true })); await sleep(2500);
    const left = await cam.evaluate(async () => (await db.sessions()).map((s) => s.status));
    t.check("liberazione accesa: restano solo le clip non trasferite", left.length === 1 && left[0] === "pronta", JSON.stringify(left));
    // arresto sicuro durante la ripresa
    await stub(5000, 100); await cam.evaluate(() => spaceRefresh());
    await cam.evaluate(() => document.getElementById("recBtn").click()); await t.until(() => cam.evaluate(() => !!recording)); await sleep(2000);
    await stub(2000, 1900); await cam.evaluate(() => spaceRefresh());
    t.check("arresto sicuro: la registrazione si ferma da sola", await t.until(() => cam.evaluate(() => !recording), 8000));
    const clip = await cam.evaluate(() => sessions.filter((s) => s.status === "pronta").map((s) => s.bytes));
    t.check("la clip fermata è salvata e valida", clip.length >= 2 && clip.every((x) => x > 1000), JSON.stringify(clip));
    t.check("messaggio chiaro sulla camera", await cam.evaluate(() => /Spazio esaurito/.test(lastErr)), await cam.evaluate(() => lastErr));
    // misura reale con tetto piccolo
    await cam.evaluate(() => { window.__spaceCapMB = 96; lastErr = ""; }); await stub(100000, 10);
    await cam.evaluate(() => spaceMeasure());
    t.check("misura reale completata e memorizzata", await t.until(() => cam.evaluate(() => SPACE.measuredMB === 96 && dbgBuf.some((x) => /MISURA SPAZIO COMPLETATA/.test(x.m))), 40000), await cam.evaluate(() => SPACE.measuredMB));
  });
}
