import fs from "node:fs";
import { withEnv, sleep } from "../lib.mjs";
export const name = "Viste delle camere: Automatico, Scorrimento, Personalizzato (Pro in prova), finestra Aggiungi";
const SHOTS = process.env.SHOTS;
export async function run() {
  await withEnv({ approve: false }, async (t) => {
    const dash = await t.dash();
    await dash.setViewportSize({ width: 1280, height: 900 });
    const ev = (f, a) => dash.evaluate(f, a);
    const shot = async (n) => { if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await dash.screenshot({ path: `${SHOTS}/${n}.png`, fullPage: true }); } };
    await t.cam("camA"); await t.cam("camB"); await t.cam("camC");
    t.check("tre camere in elenco", await t.until(async () => (await ev(() => cameras.length)) === 3));
    await ev(() => { location.hash = "#/"; route(); });
    const cls = () => ev(() => document.querySelector("#homeGrid").className);
    t.check("su schermo largo parte Automatico", /v-auto/.test(await cls()), await cls());
    t.check("la barra delle viste c'è e Personalizzato è bloccato senza Pro", await ev(() => !!document.querySelector("#viewBar") && document.querySelector("#vwFree").disabled === true));
    await shot("auto-3");
    // scorrimento
    await dash.click('[data-vw="scroll"]');
    t.check("Scorrimento: la griglia diventa una fila a scorrimento", /v-scroll/.test(await cls()), await cls());
    t.check("compaiono le tessere numerate e 'x di N'", await ev(() => document.querySelectorAll("#vwChips [data-vc]").length === 3 && /di 3/.test(document.querySelector("#vwPos").textContent)), await ev(() => document.querySelector("#vwChips").textContent));
    await shot("scorrimento-3");
    await dash.click('#vwChips [data-vc]:nth-of-type(3)'); await sleep(1200);
    t.check("toccando la tessera 3 la camera 3 va in primo piano", await ev(() => /^3 di 3/.test(document.querySelector("#vwPos").textContent)), await ev(() => document.querySelector("#vwPos").textContent));
    await dash.click('[data-vd="v"]');
    t.check("direzione su/giù", /dir-v/.test(await cls()), await cls());
    await dash.click('[data-vd="h"]');
    t.check("la scelta della vista è ricordata dopo il ricaricamento", await (async () => { await dash.reload(); await t.until(() => ev(() => typeof Views !== "undefined" && !!document.querySelector("#homeGrid"))); await sleep(500); return /v-scroll/.test(await cls()); })(), await cls());
    // Pro in prova
    t.check("l'interruttore Pro compare in Base", await ev(() => getComputedStyle(document.querySelector("#proChk").closest("label")).display !== "none"));
    await dash.check("#proChk");
    t.check("con Pro acceso Personalizzato si può usare", await ev(() => document.querySelector("#vwFree").disabled === false));
    await dash.click("#vwFree");
    t.check("Personalizzato: schede con posizione libera", /v-free/.test(await cls()) && await ev(() => [...document.querySelectorAll("#homeGrid .card")].every((c) => c.style.left && c.style.width)));
    await shot("personalizzato-3");
    // trascinare e ridimensionare
    const box = await (async () => { const h = await dash.$('#homeGrid .card .card-h'); await h.scrollIntoViewIfNeeded(); return h.boundingBox(); })();
    const l0 = await ev(() => document.querySelector("#homeGrid .card").offsetLeft), t0 = await ev(() => document.querySelector("#homeGrid .card").offsetTop);
    await dash.mouse.move(box.x + 40, box.y + 12); await dash.mouse.down(); await dash.mouse.move(box.x + 90, box.y + 60, { steps: 5 }); await dash.mouse.up();
    const l1 = await ev(() => document.querySelector("#homeGrid .card").offsetLeft), t1 = await ev(() => document.querySelector("#homeGrid .card").offsetTop);
    t.check("trascinando la testata la scheda si sposta", l1 - l0 >= 40 && t1 - t0 >= 40, `${l0},${t0} → ${l1},${t1}`);
    t.check("dopo il trascinamento non si apre il dettaglio", (await ev(() => location.hash)) === "" || (await ev(() => location.hash)) === "#/", await ev(() => location.hash));
    const w0 = await ev(() => document.querySelector("#homeGrid .card:nth-of-type(3)").offsetWidth), rb = await (async () => { const h = await dash.$('#homeGrid .card:nth-of-type(3) .rz'); await h.scrollIntoViewIfNeeded(); return h.boundingBox(); })();
    await dash.mouse.move(rb.x + 14, rb.y + 14); await dash.mouse.down(); await dash.mouse.move(rb.x + 74, rb.y + 64, { steps: 5 }); await dash.mouse.up();
    const w1 = await ev(() => document.querySelector("#homeGrid .card:nth-of-type(3)").offsetWidth);
    t.check("trascinando l'angolo la scheda si ridimensiona", w1 - w0 >= 40, `${w0} → ${w1}`);
    await dash.reload(); await t.until(() => ev(() => typeof Views !== "undefined" && !!document.querySelector("#homeGrid .card"))); await sleep(500);
    t.check("la misura resta dopo il ricaricamento", await ev(([w]) => Math.abs(document.querySelector("#homeGrid .card:nth-of-type(3)").offsetWidth - w) < 3, [w1]));
    t.check("posizione e misura restano dopo il ricaricamento", await ev(([a, b, w]) => { const c = document.querySelector("#homeGrid .card"); return Math.abs(c.offsetLeft - a) < 3 && Math.abs(c.offsetTop - b) < 3; }, [l1, t1, w1]));
    await dash.click("#vwReset");
    t.check("Ripristina disposizione rimette la scheda al suo posto", await ev(([a]) => document.querySelector("#homeGrid .card").offsetLeft === a, [0]) || (await ev(() => document.querySelector("#homeGrid .card").offsetLeft)) === l0);
    // calamita: spostando una scheda sopra un'altra, le altre si scostano e non resta nessuna sovrapposizione
    t.check("il pulsante Calamita c'è, spento", await ev(() => document.querySelector("#vwMagnet").getAttribute("aria-pressed") === "false" && !document.querySelector("#vwMagnet").hidden));
    await dash.click("#vwMagnet");
    t.check("Calamita accesa", await ev(() => Views.magnet === true && /magnet/.test(document.querySelector("#homeGrid").className)));
    const hb = await (async () => { const h = await dash.$('#homeGrid .card .card-h'); await h.scrollIntoViewIfNeeded(); return h.boundingBox(); })();
    const c2 = await ev(() => { const c = document.querySelectorAll("#homeGrid .card")[1]; return { x: c.offsetLeft, y: c.offsetTop }; });
    const c1 = await ev(() => { const c = document.querySelector("#homeGrid .card"); return { x: c.offsetLeft, y: c.offsetTop }; });
    await dash.mouse.move(hb.x + 40, hb.y + 12); await dash.mouse.down(); await dash.mouse.move(hb.x + 40 + (c2.x - c1.x) + 20, hb.y + 12 + (c2.y - c1.y) + 30, { steps: 8 }); await sleep(450);
    t.check("durante il trascinamento nessuna scheda ne copre un'altra", await ev(() => { const r = [...document.querySelectorAll("#homeGrid .card")].map((c) => c.getBoundingClientRect()); for (let i = 0; i < r.length; i++) for (let j = i + 1; j < r.length; j++) if (r[i].left < r[j].right - 1 && r[j].left < r[i].right - 1 && r[i].top < r[j].bottom - 1 && r[j].top < r[i].bottom - 1) return false; return true; }));
    t.check("la scheda spinta si è scostata", await ev(([x, y]) => { const c = document.querySelectorAll("#homeGrid .card")[1]; return c.offsetLeft !== x || c.offsetTop !== y; }, [c2.x, c2.y]));
    await dash.mouse.move(hb.x + 40, hb.y + 12, { steps: 8 }); await sleep(500);
    t.check("riportando via la scheda, quella spinta torna al suo posto", await ev(([x, y]) => { const c = document.querySelectorAll("#homeGrid .card")[1]; return Math.abs(c.offsetLeft - x) < 3 && Math.abs(c.offsetTop - y) < 3; }, [c2.x, c2.y]));
    await dash.mouse.move(hb.x + 40 + (c2.x - c1.x) + 20, hb.y + 12 + (c2.y - c1.y) + 30, { steps: 8 }); await sleep(450);
    await dash.mouse.up(); await sleep(450);
    t.check("la scheda toccata si è spostata dal suo posto", await ev(([x, y]) => { const c = document.querySelectorAll("#homeGrid .card")[1]; return c.offsetLeft !== x || c.offsetTop !== y; }, [c2.x, c2.y]));
    t.check("le nuove posizioni di tutte le schede sono salvate", await ev(() => Object.keys(Views.layout).length >= 3));
    await dash.click("#vwMagnet"); await ev(() => store.set("gdc.magnet", false));
    // spegnendo Pro la vista Personalizzata torna a una vista normale
    await dash.uncheck("#proChk");
    t.check("spento Pro, si torna a una vista normale", !/v-free/.test(await cls()), await cls());
    // Avanzata: tutto attivo senza interruttore
    await dash.click('#gdcMode [data-mode="adv"]'); await sleep(300);
    t.check("in Avanzata Personalizzato è disponibile e l'interruttore Pro è nascosto", await ev(() => document.querySelector("#vwFree").disabled === false && getComputedStyle(document.querySelector("#proChk").closest("label")).display === "none"));
    await dash.click('#gdcMode [data-mode="base"]'); await sleep(300);
    // finestra Aggiungi
    await dash.click("#addCam2");
    t.check("Aggiungi camera apre la finestra con il QR", await ev(() => !document.querySelector("#addModal").hidden && document.querySelector("#qrImg").innerHTML.length > 100));
    await shot("aggiungi");
    await dash.keyboard.press("Escape");
    t.check("Esc chiude la finestra", await ev(() => document.querySelector("#addModal").hidden));
    // tante camere: griglia compatta
    await ev(() => { for (let i = 4; i <= 10; i++) cameras.push({ id: "fake" + i, device: "Telefono " + i, name: "fake" + i, num: i, os: "iOS", seen: Date.now() }); location.hash = "#/"; route(); });
    await dash.click('[data-vw="auto"]');
    t.check("con 10 camere la vista Automatico diventa compatta", /dense/.test(await cls()), await cls());
    await shot("auto-10");
    await dash.click('[data-vw="scroll"]'); await shot("scorrimento-10");
    t.check("con 10 camere le tessere sono 10", await ev(() => document.querySelectorAll("#vwChips [data-vc]").length === 10));
    // telefono in verticale: parte da Scorrimento
    await ev(() => { localStorage.removeItem("gdc.view"); }); await dash.setViewportSize({ width: 390, height: 844 }); await dash.reload(); await t.until(() => ev(() => typeof Views !== "undefined")); await sleep(600);
    t.check("su telefono in verticale la vista di partenza è Scorrimento", /v-scroll/.test(await cls()), await cls());
    await shot("telefono");
  });
}
