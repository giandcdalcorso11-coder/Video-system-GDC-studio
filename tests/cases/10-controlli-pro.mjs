import { withEnv, sleep } from "../lib.mjs";
export const name = "Controlli avanzati della fotocamera (con capacità simulate)";
// simula un telefono con torcia, fuoco, bianco ed esposizione manuali e registra ciò che viene applicato
const TELEFONO = () => {
  const T = MediaStreamTrack.prototype, gc = T.getCapabilities, gs = T.getSettings, ac = T.applyConstraints; window.__applied = [];
  window.__set = { torch: false, focusMode: "continuous", focusDistance: 0.4, whiteBalanceMode: "continuous", colorTemperature: 5000, exposureMode: "continuous", exposureCompensation: 0, iso: 100 };
  T.getCapabilities = function () { const b = gc.call(this); return this.kind === "video" ? { ...b, torch: true, focusMode: ["manual", "continuous"], focusDistance: { min: 0, max: 1, step: 0.01 }, whiteBalanceMode: ["continuous", "manual"], colorTemperature: { min: 2500, max: 8000, step: 100 }, exposureMode: ["continuous", "manual"], exposureCompensation: { min: -3, max: 3, step: 0.1 }, iso: { min: 50, max: 1600, step: 1 } } : b; };
  T.getSettings = function () { const b = gs.call(this); return this.kind === "video" ? { ...b, ...window.__set } : b; };
  T.applyConstraints = function (c) { const a = c && c.advanced && c.advanced[0]; if (a && !("zoom" in a)) { window.__applied.push(a); Object.assign(window.__set, a); return Promise.resolve(); } return ac.call(this, c); };
};
export async function run() {
  await withEnv({}, async (t) => {
    const dash = await t.dash(), cam = await t.cam("camA", { init: TELEFONO });
    t.check("camera collegata", await t.ready(dash, "camA"));
    await dash.evaluate(() => { document.body.classList.add("adv"); location.hash = "#/cam/camA"; });
    t.check("il pannello mostra i controlli disponibili", await t.until(() => dash.evaluate(() => { const p = document.querySelector('[data-bind="proUi"]'); return !!p && /Torcia/.test(p.innerText) && /Fuoco/.test(p.innerText) && /Bilanciamento/.test(p.innerText) && /Esposizione/.test(p.innerText); })));
    const ev = (sel, prop, v, tipo) => dash.evaluate(([sel, prop, v, tipo]) => { const e = document.querySelector(sel); e[prop] = v; e.dispatchEvent(new Event(tipo, { bubbles: true })); }, [sel, prop, v, tipo]);
    await ev('[data-pt="torch"]', "checked", true, "change"); await ev('[data-pm="focusMode"]', "value", "manual", "change");
    await ev('[data-pk="focusDistance"]', "value", 0.8, "input"); await ev('[data-pk="exposureCompensation"]', "value", -1.5, "input");
    t.check("i valori arrivano al telefono", await t.until(() => cam.evaluate(() => window.__applied.length >= 4)), await cam.evaluate(() => JSON.stringify(window.__applied)));
    const ap = await cam.evaluate(() => window.__applied);
    t.check("applicati: torcia, modo e distanza di fuoco, correzione", ap.some((a) => a.torch === true) && ap.some((a) => a.focusMode === "manual") && ap.some((a) => a.focusDistance === 0.8) && ap.some((a) => a.exposureCompensation === -1.5), JSON.stringify(ap));
    t.check("il pannello mostra i valori letti dal telefono", await t.until(() => dash.evaluate(() => { const p = document.querySelector('[data-bind="proUi"]'); return p.querySelector('[data-pt="torch"]').checked && p.querySelector('[data-pm="focusMode"]').value === "manual" && p.querySelector('[data-pv="focusDistance"]').textContent === "0.80" && p.querySelector('[data-pv="exposureCompensation"]').textContent === "-1.5"; })));
    // valore non valido: rifiutato
    await dash.evaluate(() => command("camA", { cmd: "pro", set: { focusDistance: "abc", pippo: 1 } })); await sleep(1500);
    t.check("valori non validi o sconosciuti non vengono applicati", !(await cam.evaluate(() => window.__applied.some((a) => "pippo" in a || a.focusDistance === "abc"))));
    // riavvio della camera: i manuali tornano, la torcia no
    await cam.evaluate(async () => { window.__applied.length = 0; window.__set.focusMode = "continuous"; stopCam(); cfg.autoCam = true; await openCam(); });
    await sleep(2500);
    const r = await cam.evaluate(() => window.__applied);
    t.check("dopo il riavvio i valori manuali tornano, la torcia no", r.some((a) => a.focusMode === "manual") && r.some((a) => a.exposureCompensation === -1.5) && !r.some((a) => "torch" in a), JSON.stringify(r));
    await dash.click('[data-pk="reset"]');
    t.check("'Tutto automatico' riporta tutto", await t.until(() => cam.evaluate(() => window.__set.torch === false && window.__set.focusMode === "continuous" && window.__set.exposureCompensation === 0 && Object.keys(pro).length === 0)));
  });
}
