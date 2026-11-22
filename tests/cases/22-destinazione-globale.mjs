import { withEnv, sleep } from "../lib.mjs";
export const name = "File: la destinazione e le opzioni di trasferimento si scelgono dalla home, per tutte le camere";
export async function run() {
  await withEnv({ approve: false }, async (t) => {
    const dash = await t.dash(), cam = await t.cam("camA");
    await dash.evaluate(() => { location.hash = "#/"; route(); });
    t.check("nella home c'è il riquadro 'File dei video · tutte le camere'", await t.until(() => dash.evaluate(() => /tutte le camere/.test((document.getElementById("xferGlobal") || {}).textContent || "")), 15000));
    t.check("ci sono destinazione, 'Tieni i file', 'Elimina dal telefono', automatico e anteprima", await dash.evaluate(() => { const e = document.getElementById("xferGlobal"); return !!e.querySelector('[data-xm="device"]') && !!e.querySelector('[data-xf="hold"]') && !!e.querySelector('[data-xf="del"]') && !!e.querySelector('[data-xf="auto"]') && !!e.querySelector('[data-xf="prev"]') && !!e.querySelector('[data-xf="allcams"]'); }));
    await dash.evaluate(() => { document.querySelector('#xferGlobal [data-xf="del"]').click(); });
    t.check("la spunta 'Elimina dal telefono' dalla home cambia l'impostazione globale", await t.until(() => dash.evaluate(() => Xfer.delAfter === true)));
    await dash.evaluate(() => { const r = document.querySelector('#xferGlobal [data-xm="device"]'); r.checked = true; r.dispatchEvent(new Event("change", { bubbles: true })); });
    t.check("la destinazione scelta dalla home vale per tutti (Dest.mode)", await dash.evaluate(() => Dest.mode === "device"));
    await dash.evaluate(() => { location.hash = "#/cam/camA"; route(); });
    await sleep(600);
    t.check("la pagina della camera mostra le stesse impostazioni e lo dice", await dash.evaluate(() => { const e = document.querySelector('[data-bind="xferUi"]'); return !!e && /valgono per tutte le camere/.test(e.textContent) && e.querySelector('[data-xm="device"]').checked && e.querySelector('[data-xf="del"]').checked; }));
  });
}
