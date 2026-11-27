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
    t.check("'Sono la regia' porta a 'Che cosa riprendi?' (passo 1 di 2: 4 tipi, locale, 5 colori, anteprima)", await ev(() => document.querySelectorAll("[data-pre]").length === 4 && !!document.getElementById("pubVenue") && document.querySelectorAll("[data-col]").length === 5 && !!document.getElementById("pubPrevName") && /PASSO 1 DI 2/.test(document.getElementById("pubHome").textContent)));
    await p.click('[data-pre="sport"]'); await p.fill("#pubVenue", "Campo A"); await p.click('[data-col="verde"]');
    t.check("l'anteprima segue il nome del locale", await ev(() => document.getElementById("pubPrevName").textContent === "Campo A"));
    await p.click("#pubNext");
    t.check("il passo 2 è 'Nuova sessione' con durata (4, 12, 24 ore) e approvazione", await ev(() => /PASSO 2 DI 2/.test(document.getElementById("pubHome").textContent) && document.querySelectorAll("[data-h]").length === 3 && !!document.getElementById("pubAppr")));
    await p.fill("#pubName", "Partita di prova"); await p.click('[data-h="4"]'); await p.click("#pubAppr");
    await Promise.all([p.waitForEvent("load", { timeout: 20000 }).catch(() => {}), p.click("#pubGo")]);
    t.check("dopo 'Crea la sessione' la regia è collegata (sessione reale) e la home sparisce", await t.until(() => ev(() => typeof REAL !== "undefined" && REAL === true && !document.getElementById("pubHome")), 20000));
    t.check("la sessione porta nome, tipo, locale e colore", await ev(() => Session.cur.name === "Partita di prova" && Session.cur.activity === "sport" && Session.cur.venue === "Campo A" && Session.cur.color === "verde" && Session.cur.until - Session.cur.start === 4 * 3600000 && store.get("gdc.approve", true) === false));
    t.check("si apre da solo il QR per far entrare le camere", await t.until(() => ev(() => { const m = document.getElementById("addModal"); return !!m && !m.hidden; }), 10000));
    t.check("la modalità resta Pubblica dopo il ricaricamento e il colore scelto è applicato", await ev(() => document.body.classList.contains("pub") && document.documentElement.style.getPropertyValue("--session").trim() === "#3DDC97" && !!document.querySelector(".ps-head") && /Campo A/.test(document.querySelector(".ps-head").textContent) && getComputedStyle(document.body).backgroundColor === "rgb(14, 16, 19)"));
    t.check("la regia in Pubblica nasconde gli strumenti da sviluppatore e mostra la riga dei file", await t.until(() => ev(() => !document.getElementById("permPanel") && !document.getElementById("sum") && getComputedStyle(document.querySelector("header.top")).display === "none" && /Trasferimento automatico/.test(document.getElementById("pubFilesBar").textContent) && !!document.getElementById("pubNewSess") && !!document.getElementById("pubRec") && !!document.getElementById("pubStop") && /0 camere collegate/.test(document.getElementById("pubCnt").textContent)), 5000));
    // camera
    await p.evaluate(() => localStorage.removeItem("gdc.pair")); // in prova regia e camera condividono lo stesso browser: la camera deve partire senza abbinamento
    const c = await t.ctx.newPage(); c.on("pageerror", (e) => t.errs.push("pubblica camera: " + e.message));
    await c.goto(`${t.base}/camera.html?mock=1`); await t.until(() => c.evaluate(() => typeof PubCam !== "undefined" && typeof pairing !== "undefined"));
    t.check("la camera senza abbinamento in modalità Pubblica mostra i tre passi", await t.until(() => c.evaluate(() => !!document.getElementById("pubHome") && /inquadra il QR/.test(document.getElementById("pubHome").textContent)), 8000));
    await c.click("#pubCode");
    t.check("'Ho un codice scritto' mostra il campo per incollare il codice", await c.evaluate(() => !document.getElementById("pubHome") && !document.getElementById("pairBox").hidden));
    // schermata File
    await p.evaluate(() => { location.hash = "#/file"; });
    t.check("'Impostazioni dei file' porta alla schermata File con 'Dove salvare le riprese' e l'elenco clip", await t.until(() => ev(() => /Dove salvare le riprese/.test(document.getElementById("view").textContent) && !!document.getElementById("pfClips") && /Riprese/.test(document.getElementById("pfClips").textContent) && !!document.querySelector('[data-xf="del"]')), 5000));
    await p.evaluate(() => { location.hash = "#/"; });
    // regia con un abbinamento vecchio (prove di prima): la home della Pubblica compare lo stesso
    { const q = await t.ctx.newPage(); q.on("pageerror", (e) => t.errs.push("pubblica vecchio abbinamento: " + e.message));
      await q.goto(`${t.base}/dashboard.html?mock=1`); await q.evaluate(() => { localStorage.setItem("gdc.pair", JSON.stringify({ u: "https://x.supabase.co", k: "sb_publishable_x", c: "gdc1.abcdefghijklmnop" })); localStorage.setItem("gdc.session", JSON.stringify({ name: "Vecchia", start: Date.now() })); localStorage.setItem("gdc.mode", JSON.stringify("pub")); });
      await q.goto(`${t.base}/dashboard.html`); await t.until(() => q.evaluate(() => typeof PubUI !== "undefined" && !!GDC_DEV));
      t.check("all'apertura la Pubblica non parte da sola: si vede il selettore di modalità", await q.evaluate(() => !document.getElementById("pubHome") && !!document.querySelector('#gdcMode [data-mode="pub"]')));
      await q.click('#gdcMode [data-mode="pub"]');
      t.check("con un abbinamento di prove precedenti, scegliendo Pubblica compare la scelta Regia / Camera", await t.until(() => q.evaluate(() => !!document.getElementById("pubRegia") && !!document.getElementById("pubCamera")), 8000));
      await q.click("#pubExit");
      t.check("'Esci dalla prova' torna al selettore di modalità", await q.evaluate(() => !document.getElementById("pubHome") && !document.body.classList.contains("pub")));
      await q.close(); }
    // tornando a Base la home sparisce
    await p.evaluate(() => GDC_DEV.setMode("base"));
    t.check("tornando a Base il corpo non è più in modalità pub", await p.evaluate(() => !document.body.classList.contains("pub")));
  });
}
