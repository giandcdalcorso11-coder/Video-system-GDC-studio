import { withEnv, sleep } from "../lib.mjs";
export const name = "Cartella che non risponde: la regia lo dice invece di restare in silenzio";
export async function run() {
  await withEnv({ approve: false }, async (t) => {
    const dash = await t.dash();
    await dash.evaluate(() => { location.hash = "#/"; route(); Dest.mode = "folder"; Dest.health = null; Dest.handle = { name: "disco-finto", queryPermission: () => new Promise(() => {}), requestPermission: () => new Promise(() => {}) }; Xfer.refresh(); });
    t.check("mentre controlla, il riquadro dice 'Controllo della cartella in corso'", await dash.evaluate(() => /Controllo della cartella in corso/.test(document.getElementById("xferGlobal").textContent)));
    await dash.evaluate(() => { window.__chk = Dest.check(); });
    t.check("dopo pochi secondi dice che la cartella non risponde", await t.until(() => dash.evaluate(() => Dest.health && /non risponde da oltre 6 s/.test(Dest.health.msg)), 12000), await dash.evaluate(() => JSON.stringify(Dest.health)));
    t.check("il riquadro mostra il problema", await t.until(() => dash.evaluate(() => /non risponde/.test(document.getElementById("xferGlobal").textContent)), 5000));
    { const hs = await dash.evaluate(() => JSON.stringify(Dest.health)); t.check("il messaggio dice come ridare il permesso (Cambia cartella)", /Cambia cartella/.test(hs), hs); };
    const ok = await dash.evaluate(async () => { Dest.health = null; return await Xfer.ensureDest(); });
    await dash.evaluate(() => { location.hash = "#/cam/camA"; });
    t.check("sul computer il pulsante 'Misura memoria' non c'è (rallenta il computer)", await dash.evaluate(() => !document.querySelector('[data-xf="mem"]')));
    t.check("il trasferimento non parte e c'è un messaggio chiaro nel registro", ok === false && await dash.evaluate(() => adv.some((x) => /non risponde \(permesso\)|chiedendo il permesso/.test(x.m))), String(ok));
  });
}
