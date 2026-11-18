import { withEnv, sleep } from "../lib.mjs";
export const name = "Benvenuto della camera, nomi dei file, orologio, camere vecchie, Base e Avanzata";
export async function run() {
  await withEnv({ welcomed: false }, async (t) => {
    const dash = await t.dash();
    // camera con un orologio sfasato di +5 s
    const cam = await t.cam("camA", { init: () => { const d = Date.now; Date.now = () => d.call(Date) + 5000; } });
    t.check("prima apertura: compare il benvenuto", await t.until(() => cam.evaluate(() => !document.getElementById("welcome").hidden)));
    t.check("finché non completa il benvenuto la camera non si collega", (await dash.evaluate(() => cameras.length)) === 0 && (await cam.evaluate(() => !stream && rt === null || !stream)));
    await cam.fill("#wName", "Davanti sala"); await cam.click("#wGo");
    t.check("dopo il benvenuto la camera è collegata e accesa, con numero e nome", await t.ready(dash, "camA") && (await dash.evaluate(() => camTitle(camById("camA")))) === "Camera 1 · Telefono · Davanti sala", await dash.evaluate(() => cameras.map((c) => camTitle(c)).join()));
    t.check("la camera conosce il suo numero", await t.until(() => cam.evaluate(() => label === "Camera 1")));
    const off = await t.until(() => cam.evaluate(() => clockOff), 20000);
    t.check("orologio: scarto misurato di circa +5 s", off && Math.abs(off - 5000) < 400, off);
    t.check("la regia mostra l'orologio nel dettaglio (Avanzata)", await dash.evaluate(() => /\+5\.\d\d s/.test(Clock.note("camA"))), await dash.evaluate(() => Clock.note("camA")));
    await t.rec(cam, 3);
    const info = await cam.evaluate(() => { const s = sessions[0], f = clipFile(s, "mp4"); return { f, ora: new Date(s.start - clockOff) }; });
    t.check("nome file: Camera1_Davantisala_data_ora.mp4", /^Camera1_Davantisala_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.mp4$/.test(info.f), info.f);
    const diff = await cam.evaluate(() => { const s = sessions[0], m = clipFile(s, "mp4").match(/_(\d{4})-(\d\d)-(\d\d)_(\d\d)-(\d\d)-(\d\d)/); const d = new Date(+m[1], m[2] - 1, +m[3], +m[4], +m[5], +m[6]); return Math.abs(d.getTime() - (s.start - clockOff)); });
    t.check("l'ora nel nome è quella corretta della regia (non quella sfasata)", diff < 1000, diff);
    // seconda camera: numero 2, nome scelto con ?name
    await t.cam("camB", { name: "Pista" });
    t.check("la seconda camera prende il numero 2", await t.until(() => dash.evaluate(() => cameras.map((c) => camTitle(c)).join("|") === "Camera 1 · Telefono · Davanti sala|Camera 2 · Telefono · Pista")), await dash.evaluate(() => cameras.map((c) => camTitle(c)).join("|")));
    // camere vecchie
    await dash.evaluate(() => { cameras.find((c) => c.id === "camB").seen = Date.now() - 3 * 86400000; state.camB.online = false; location.hash = "#/"; route(); });
    t.check("avviso per la camera non collegata da giorni", await t.until(() => dash.evaluate(() => { const b = document.querySelector("#staleRm"); return !!b && /Camera 2/.test(b.parentNode.textContent); })));
    await dash.evaluate(() => document.querySelector("#staleRm").click());
    t.check("'Rimuovi dall'elenco' la toglie", await t.until(() => dash.evaluate(() => cameras.length === 1)), await dash.evaluate(() => cameras.length));
    // Base: strumenti di precauzione nascosti
    const base = await cam.evaluate(() => document.body.innerText);
    t.check("camera in Base: niente dettagli tecnici", !/ID camera|Archivio|Spazio usato dal buffer|Bitrate|Dispositivo/.test(base), base.match(/ID camera|Archivio|Spazio usato dal buffer|Bitrate|Dispositivo/g)?.join());
    t.check("camera in Base: informazioni utili presenti", /Regia/.test(base) && /Registrazione/.test(base) && /Spazio per registrare/.test(base) && /Batteria/.test(base));
    await dash.evaluate(() => { location.hash = "#/cam/camA"; }); await sleep(1500);
    const dtxt = await dash.evaluate(() => document.body.innerText);
    t.check("dashboard in Base: niente strumenti di precauzione", !/Orientamento|Schermo del telefono|Camera reale|Prova velocità rete|Misura memoria|Pan \/ Tilt|Registro/.test(dtxt), dtxt.match(/Orientamento|Schermo del telefono|Camera reale|Prova velocità rete|Misura memoria|Pan \/ Tilt|Registro/g)?.join());
    await dash.evaluate(() => { document.body.classList.add("adv"); });
    t.check("in Avanzata gli strumenti compaiono", await dash.evaluate(() => /Prova velocità rete/.test(document.body.innerText)));
  });
}
