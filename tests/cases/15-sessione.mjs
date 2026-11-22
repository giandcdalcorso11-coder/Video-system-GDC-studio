import { withEnv, sleep } from "../lib.mjs";
export const name = "Sessione: nome, nuova sessione (nuovo canale, nuove chiavi, elenco camere vuoto)";
export async function run() {
  await withEnv({ approve: false }, async (t) => {
    const dash = await t.dash();
    const ev = (f) => dash.evaluate(f);
    const stato = () => ev(() => ({ c: pairing.c, p: pairing.p, name: Session.cur.name, cams: cameras.map((c) => c.id).join(","), hdr: document.querySelector("#sessTxt").textContent, qr: Join.link() }));
    await t.cam("camA");
    t.check("camera entra", await t.until(async () => (await stato()).cams === "camA"));
    const s0 = await stato();
    t.check("senza nome: l'intestazione dice 'Sessione senza nome'", /Sessione senza nome/.test(s0.hdr), s0.hdr);
    // nome: scritto nel campo, ricordato e mostrato in intestazione
    await ev(() => { location.hash = "#/"; route(); });
    await dash.click("#addCam2");
    await dash.fill("#sessName", "Set di domenica"); await dash.dispatchEvent("#sessName", "change");
    const s1 = await stato();
    t.check("il nome compare in intestazione", /Set di domenica/.test(s1.hdr), s1.hdr);
    t.check("il nome è salvato", (await ev(() => JSON.parse(localStorage.getItem("gdc.session")).name)) === "Set di domenica");
    await dash.fill("#sessName", "<b>X</b>&\"y\""); await dash.dispatchEvent("#sessName", "change");
    t.check("caratteri di markup tolti dal nome", !/[<>&"]/.test((await stato()).name), (await stato()).name);
    await dash.fill("#sessName", "Set di domenica"); await dash.dispatchEvent("#sessName", "change");
    await dash.keyboard.press("Escape"); await sleep(300); // la finestra si chiude: il pulsante 'Nuova sessione' è in home
    // annullo la nuova sessione: non cambia niente
    dash.once("dialog", (d) => d.dismiss());
    await dash.click("#sessNewHome"); await sleep(800);
    const s2 = await stato();
    t.check("annullando, canale, chiavi e camere restano", s2.c === s0.c && s2.p === s0.p && s2.cams === "camA", JSON.stringify(s2));
    // nuova sessione con nome
    dash.once("dialog", (d) => d.accept("Partita di padel"));
    await Promise.all([dash.waitForEvent("load", { timeout: 20000 }).catch(() => {}), dash.click("#sessNewHome")]);
    await t.until(async () => { try { return !!(await dash.evaluate(() => window.Session && Session.cur && document.querySelector("#sessTxt"))); } catch { return false; } });
    await sleep(1500);
    const s3 = await stato();
    t.check("la nuova sessione ha il nuovo nome", s3.name === "Partita di padel" && /Partita di padel/.test(s3.hdr), JSON.stringify(s3));
    t.check("il canale è cambiato (nuovo QR)", s3.c !== s0.c && s3.qr !== s0.qr, `${s0.c} → ${s3.c}`);
    t.check("le chiavi della regia sono nuove", !!s3.p && s3.p !== s0.p, `${s0.p} → ${s3.p}`);
    t.check("l'elenco delle camere è vuoto", s3.cams === "", s3.cams);
    t.check("il QR nuovo contiene il canale nuovo", s3.qr.length > 40 && s3.qr !== s0.qr);
    t.check("il pulsante 'Nuova sessione' è nella home e non più nella finestra 'Aggiungi dispositivo'", await ev(() => !!document.getElementById("sessNewHome") && !document.getElementById("sessNew") && !document.getElementById("addModal").contains(document.getElementById("sessNewHome"))));
    t.check("dopo la nuova sessione si apre da sola la finestra con il QR nuovo", await t.until(() => ev(() => !document.getElementById("addModal").hidden && !!document.querySelector("#addModal #qrImg")), 8000));
  });
}
