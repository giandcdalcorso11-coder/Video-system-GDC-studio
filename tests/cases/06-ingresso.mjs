import fs from "node:fs";
import { withEnv, sleep, jsqrPath } from "../lib.mjs";
export const name = "Ingresso dei telefoni: richiesta, accetta, rifiuta, accetta tutte, QR";
export async function run() {
  await withEnv({ approve: true }, async (t) => {
    const dash = await t.dash();
    const cams = () => dash.evaluate(() => cameras.map((c) => c.id).join(","));
    const pend = () => dash.evaluate(() => Object.keys(Join.pending).join(","));
    const regia = (p) => p.evaluate(() => document.querySelector("#stat").textContent);
    const c1 = await t.cam("camA");
    t.check("richiesta di ingresso mostrata, camera non ancora in elenco", await t.until(async () => (await pend()) === "camA") && (await cams()) === "", `${await pend()} / ${await cams()}`);
    t.check("la barra mostra Accetta e Rifiuta", await dash.evaluate(() => !!document.querySelector('[data-jn="acc"]') && !!document.querySelector('[data-jn="rej"]')));
    await dash.evaluate(() => document.querySelector('[data-jn="acc"][data-id="camA"]').click());
    t.check("dopo Accetta la camera è in elenco e la richiesta sparisce", await t.until(async () => (await cams()) === "camA" && (await pend()) === ""), `${await cams()} / ${await pend()}`);
    t.check("la camera mostra 'accettata' e il suo numero", await t.until(async () => /accettata · Camera 1/.test(await regia(c1))), await regia(c1));
    // rifiuto
    const c2 = await t.cam("camB");
    t.check("seconda richiesta", await t.until(async () => (await pend()) === "camB"));
    await dash.evaluate(() => document.querySelector('[data-jn="rej"][data-id="camB"]').click());
    t.check("la camera rifiutata mostra il messaggio", await t.until(async () => /NON accettata/.test(await regia(c2)), 15000), await regia(c2));
    await sleep(8000);
    t.check("dopo il rifiuto non ricompare e non entra", (await pend()) === "" && (await cams()) === "camA", `${await pend()} / ${await cams()}`);
    // dimentica i rifiutati: ricompare
    await dash.evaluate(() => { document.querySelector("#rejClr").click(); });
    t.check("dopo 'Dimentica i rifiutati' la richiesta ricompare", await t.until(async () => (await pend()) === "camB", 20000), await pend());
    await dash.evaluate(() => document.querySelector('[data-jn="acc"][data-id="camB"]').click());
    t.check("accettata: Camera 2", await t.until(async () => /Camera 2/.test(await regia(c2)), 15000), await regia(c2));
    // accetta tutte
    const c3 = await t.cam("camC"), c4 = await t.cam("camD");
    t.check("due richieste insieme: compare 'Accetta tutte'", await t.until(async () => (await pend()).split(",").length === 2 && (await dash.evaluate(() => !!document.querySelector('[data-jn="all"]')))), await pend());
    await dash.evaluate(() => document.querySelector('[data-jn="all"]').click());
    t.check("Accetta tutte le fa entrare entrambe", await t.until(async () => (await cams()).split(",").length === 4), await cams());
    // conferma spenta: entra subito
    await dash.evaluate(() => { const c = document.querySelector("#apprChk"); if (c.checked) c.click(); });
    await t.cam("camE");
    t.check("con la conferma spenta entra subito", await t.until(async () => (await cams()).split(",").includes("camE") && (await pend()) === ""), `${await cams()} / ${await pend()}`);
    // QR: la regia lo mostra e il contenuto si legge identico
    await dash.evaluate(() => { location.hash = "#/"; route(); });
    await dash.evaluate(() => { document.querySelector("#addCam2").click(); if (document.querySelector("#qrBox").hidden) document.querySelector("#qrBtn").click(); });
    const lib = jsqrPath();
    if (!lib) { t.check("QR: libreria di lettura (jsqr) presente: esegui npm install nella cartella tests", false, "jsqr non installato"); return; }
    for (const lunghezza of [0, 500]) {
      await dash.evaluate((n) => { Join.link = n ? () => "http://localhost:1/camera.html?dev=1#gdc1." + "A".repeat(100) + btoa("x".repeat(n)).replace(/=/g, "") : Object.getPrototypeOf(Join).link || (() => ""); if (n) { Join.qrOpen = true; route(); } }, lunghezza);
      if (!lunghezza) { await dash.reload(); await t.until(() => dash.evaluate(() => typeof Join !== "undefined")); await dash.evaluate(() => { document.querySelector("#addCam2").click(); if (document.querySelector("#qrBox").hidden) document.querySelector("#qrBtn").click(); }); }
      if (!(await dash.evaluate(() => typeof jsQR !== "undefined"))) await dash.addScriptTag({ path: lib });
      const link = await dash.evaluate(() => Join.link()), png = await (await dash.$("#qrImg")).screenshot();
      const dec = await dash.evaluate(async (b64) => { const img = new Image(); img.src = "data:image/png;base64," + b64; await img.decode(); const c = document.createElement("canvas"); c.width = img.width; c.height = img.height; const x = c.getContext("2d"); x.drawImage(img, 0, 0); const d = x.getImageData(0, 0, c.width, c.height), r = jsQR(d.data, d.width, d.height); return r ? r.data : null; }, png.toString("base64"));
      t.check(`QR con link di ${link.length} caratteri: letto identico`, dec === link, String(dec).slice(0, 80));
    }
  });
}
