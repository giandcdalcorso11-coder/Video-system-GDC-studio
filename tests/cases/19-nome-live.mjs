import { withEnv, sleep } from "../lib.mjs";
export const name = "Nome della camera: se cambia sul telefono la regia lo segue subito; se lo cambia la regia non torna indietro";
export async function run() {
  await withEnv({ approve: false }, async (t) => {
    const dash = await t.dash(), cam = await t.cam("camA", { name: "Primo" });
    t.check("camera collegata", await t.ready(dash, "camA"));
    const nomeRegia = () => dash.evaluate(() => camById("camA").name), nomeTel = () => cam.evaluate(() => cfg.name);
    t.check("all'inizio il nome è quello del telefono", (await nomeRegia()) === "Primo", await nomeRegia());
    // il telefono cambia nome (come scrivendolo nel campo "Nome camera")
    await cam.evaluate(() => { cfg.name = "Davanti"; store.set("gdc.camCfg", cfg); syncForm(); rt?.setMeta({ name: cfg.name, device: cfg.device }); publish(); });
    t.check("cambiato sul telefono: la regia lo segue entro pochi secondi", await t.until(async () => (await nomeRegia()) === "Davanti", 12000), await nomeRegia());
    t.check("il titolo nella home mostra il nuovo nome", await t.until(() => dash.evaluate(() => { location.hash = "#/"; route(); return /Davanti/.test(document.querySelector('[data-bind="title"][data-cam="camA"]').textContent); }), 8000));
    // la regia rinomina: il telefono lo applica e la regia non lo rimette indietro
    await dash.evaluate(() => { const c = camById("camA"); c.name = "Dietro"; c.renamed = true; saveCams(); transport.send("camA", { cmd: "rename", name: c.name, device: c.device }); });
    t.check("rinominato dalla regia: il telefono lo applica", await t.until(async () => (await nomeTel()) === "Dietro", 12000), await nomeTel());
    await sleep(5000);
    t.check("la regia tiene il nome che ha scelto", (await nomeRegia()) === "Dietro", await nomeRegia());
    // e se il telefono lo cambia di nuovo, la regia segue di nuovo
    await cam.evaluate(() => { cfg.name = "Lato"; store.set("gdc.camCfg", cfg); syncForm(); rt?.setMeta({ name: cfg.name, device: cfg.device }); publish(); });
    t.check("cambiato di nuovo sul telefono: la regia segue", await t.until(async () => (await nomeRegia()) === "Lato", 12000), await nomeRegia());
  });
}
