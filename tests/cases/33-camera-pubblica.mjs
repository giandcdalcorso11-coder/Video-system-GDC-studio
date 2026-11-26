import { withEnv, sleep } from "../lib.mjs";
export const name = "Modalità Pubblica (test): camera abbinata, schermata di ripresa e 'Prepara questa camera'";
export async function run() {
  await withEnv({ approve: false }, async (t) => {
    const dash = await t.dash(); await t.cam("camX");
    const cam = await t.cam("camP", { name: "Campo 9", init: () => { localStorage.setItem("gdc.mode", JSON.stringify("pub")); } });
    t.check("la camera abbinata in Pubblica mostra la ripresa con anteprima, riquadri e Esci", await t.until(() => cam.evaluate(() => !!document.getElementById("pcStage") && !!document.querySelector("#pcStage #stage video") && /Batteria/.test(document.getElementById("pubHome").textContent) && !!document.getElementById("pcExit")), 15000));
    await cam.evaluate(() => { cfg.autoCam = false; stopCam(); });
    t.check("fermando la camera compare 'Prepara questa camera' con nome, Posteriore/Anteriore e 'Sono pronta'", await t.until(() => cam.evaluate(() => /Prepara questa camera/.test(document.getElementById("pubHome").textContent) && !!document.querySelector("[data-fc]") && !!document.getElementById("pcGo") && !document.querySelector("#pubHome #stage")), 8000));
    await cam.click("#pcGo");
    t.check("'Sono pronta' riavvia la camera e torna alla schermata di ripresa", await t.until(() => cam.evaluate(() => !!stream && !!document.getElementById("pcStage")), 15000));
  });
}
