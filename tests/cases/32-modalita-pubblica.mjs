import { withEnv, sleep } from "../lib.mjs";
export const name = "Modalità Pubblica (test): home, creazione della sessione, ingresso della camera, log accesi di default";
export async function run() {
  await withEnv({ approve: false }, async (t) => {
    const p = await t.ctx.newPage(); p.on("pageerror", (e) => t.errs.push("pubblica: " + e.message));
    await p.goto(`${t.base}/dashboard.html?mock=1`); await t.until(() => p.evaluate(() => typeof GDC_DEV !== "undefined" && typeof PubUI !== "undefined"));
    const ev = (f, a) => p.evaluate(f, a);
    t.check("i log tecnici sono accesi di default", await ev(() => GDC_DEV.sending === true));
    t.check("in Base la home pubblica non c'è", await ev(() => !document.getElementById("pubHome")));
    t.check("c'è il pulsante 'Pubblica (test)' accanto a Base e Avanzata", await ev(() => [...document.querySelectorAll("#gdcMode [data-mode]")].map((b) => b.textContent).join("|") === "Base|Avanzata|Pubblica (test)"));
    await p.click('#gdcMode [data-mode="pub"]');
    t.check("scegliendo Pubblica compare la home con 'Sono la regia' e 'Sono una camera'", await ev(() => !!document.getElementById("pubHome") && !!document.getElementById("pubRegia") && !!document.getElementById("pubCamera")));
    t.check("il corpo della pagina ha la modalità pub e non mostra strumenti da sviluppatore", await ev(() => document.body.classList.contains("pub") && !document.body.classList.contains("adv")));
    await p.click("#pubRegia");
    t.check("'Sono la regia' porta alla scelta del tipo di ripresa (4 tipi, nome, locale, colori)", await ev(() => document.querySelectorAll("[name=pubPreset]").length === 4 && !!document.getElementById("pubName") && !!document.getElementById("pubVenue") && document.querySelectorAll("[data-col]").length === 5));
    await p.fill("#pubName", "Partita di prova"); await p.fill("#pubVenue", "Campo A"); await p.check('[name=pubPreset][value="sport"]'); await p.click('[data-col="verde"]');
    await Promise.all([p.waitForEvent("load", { timeout: 20000 }).catch(() => {}), p.click("#pubGo")]);
    t.check("dopo 'Crea la sessione' la regia è collegata (sessione reale) e la home sparisce", await t.until(() => ev(() => typeof REAL !== "undefined" && REAL === true && !document.getElementById("pubHome")), 20000));
    t.check("la sessione porta nome, tipo, locale e colore", await ev(() => Session.cur.name === "Partita di prova" && Session.cur.activity === "sport" && Session.cur.venue === "Campo A" && Session.cur.color === "verde"));
    t.check("si apre da solo il QR per far entrare le camere", await t.until(() => ev(() => { const m = document.getElementById("addModal"); return !!m && !m.hidden; }), 10000));
    t.check("la modalità resta Pubblica dopo il ricaricamento e il colore scelto è applicato", await ev(() => document.body.classList.contains("pub") && document.documentElement.style.getPropertyValue("--accent").trim() === "#12875a"));
    // camera
    await p.evaluate(() => localStorage.removeItem("gdc.pair")); // in prova regia e camera condividono lo stesso browser: la camera deve partire senza abbinamento
    const c = await t.ctx.newPage(); c.on("pageerror", (e) => t.errs.push("pubblica camera: " + e.message));
    await c.goto(`${t.base}/camera.html?mock=1`); await t.until(() => c.evaluate(() => typeof PubCam !== "undefined" && typeof pairing !== "undefined"));
    t.check("la camera senza abbinamento in modalità Pubblica mostra i tre passi", await t.until(() => c.evaluate(() => !!document.getElementById("pubHome") && /inquadra il QR/.test(document.getElementById("pubHome").textContent)), 8000));
    await c.click("#pubCode");
    t.check("'Ho un codice scritto' mostra il campo per incollare il codice", await c.evaluate(() => !document.getElementById("pubHome") && !document.getElementById("pairBox").hidden));
    // tornando a Base la home sparisce
    await p.evaluate(() => GDC_DEV.setMode("base"));
    t.check("tornando a Base il corpo non è più in modalità pub", await p.evaluate(() => !document.body.classList.contains("pub")));
  });
}
