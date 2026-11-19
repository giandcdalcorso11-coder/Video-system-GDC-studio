// Modello costi e pricing: legge ipotesi.json e scrive le tabelle. Uso: node docs/costi/calcola.mjs
import fs from "node:fs";
const P = JSON.parse(fs.readFileSync(new URL("./ipotesi.json", import.meta.url), "utf8"));
const eur = (usd) => usd * P.cambio.eurPerUsd, f = (n, d = 2) => n.toLocaleString("it-IT", { minimumFractionDigits: d, maximumFractionDigits: d });
const gbEvento = (P.uso.mbPerMinPerCamera * P.uso.cameraPerEvento * P.uso.minutiPerEvento) / 1000;
const gbProMese = gbEvento * P.uso.eventiPerProAlMese, frazione = P.cloud.giorniConservazione / 30;
// costo cloud per GB caricato (euro): spazio tenuto per i giorni di conservazione + scritture (solo R2)
const spazio = (k) => eur(P.cloud[k].usdPerTbMese / 1000) * frazione;
const scritture = (gb) => (gb * 1000 / P.cloud.mbPerBloccoCaricamento) * eur(P.cloud.r2.usdPerMilioneScritture) / 1e6;
const cloud = (gb, k) => gb * spazio(k) + (k === "r2" ? scritture(gb) : 0);
const netto = (prezzo) => prezzo / (1 + P.ricavi.iva) - (prezzo * P.ricavi.commissionePct + P.ricavi.commissioneFissaEur);
const fissi = eur(P.fissi.supabaseProUsd) + P.fissi.dominioEPostaEur + P.fissi.strumentiEImprevistiEur + P.fissi.contabilitaEur;
const out = [];
out.push(`Evento tipico: ${P.uso.cameraPerEvento} camere × ${P.uso.minutiPerEvento} min × ${P.uso.mbPerMinPerCamera} MB/min = **${f(gbEvento, 1)} GB**. Utente Pro: ${P.uso.eventiPerProAlMese} eventi al mese = **${f(gbProMese, 0)} GB caricati al mese**. Conservazione: ${P.cloud.giorniConservazione} giorni. Costi fissi: **${f(fissi, 0)} €/mese**.\n`);
out.push(`Costo cloud per ogni GB caricato: B2 ${f(cloud(1, "b2") * 100, 2)} centesimi, R2 ${f(cloud(1, "r2") * 100, 2)} centesimi (scritture in blocchi da ${P.cloud.mbPerBloccoCaricamento} MB incluse).\n`);
for (const pr of P.ricavi.prezziProMese) {
  out.push(`\n### Abbonamento Pro a ${f(pr)} €/mese (netto ${f(netto(pr))} € a utente)\n`);
  out.push("| Iscritti Pro | GB caricati/mese | Spazio tenuto in media (TB) | Cloud B2 (€) | Cloud R2 (€) | Incasso netto (€) | Cloud R2 sul netto | Resta dopo fissi e cloud R2 (€) |\n|---|---|---|---|---|---|---|---|");
  for (const n of P.scenari.utentiPro) {
    const gb = n * gbProMese, inc = n * netto(pr), c2 = cloud(gb, "r2");
    out.push(`| ${n} | ${f(gb, 0)} | ${f(gb * frazione / 1000, 2)} | ${f(cloud(gb, "b2"))} | ${f(c2)} | ${f(inc, 0)} | ${f(100 * c2 / inc, 1)}% | ${f(inc - c2 - fissi, 0)} |`);
  }
  const perUtente = netto(pr) - cloud(gbProMese, "r2"), n0 = Math.ceil(fissi / perUtente), n1 = Math.ceil((fissi + P.scenari.obiettivoGuadagnoMensileEur) / perUtente);
  const cap = Math.floor((P.scenari.quotaCloudSulNettoMax * netto(pr)) / cloud(1, "r2"));
  out.push(`\nPer coprire i costi fissi servono **${n0} iscritti**; per guadagnare ${P.scenari.obiettivoGuadagnoMensileEur} €/mese **${n1} iscritti**. Tetto di utilizzo equo per stare nel ${P.scenari.quotaCloudSulNettoMax * 100}% del netto (R2): **${f(cap, 0)} GB caricati al mese** per iscritto.`);
}
out.push(`\n### Pass a ore (costo cloud di un evento da ${f(gbEvento, 1)} GB: B2 ${f(cloud(gbEvento, "b2"), 3)} €, R2 ${f(cloud(gbEvento, "r2"), 3)} €)\n`);
out.push("| Prezzo pass | Netto a pass | Pass al mese per coprire i fissi | Pass al mese per guadagnare " + P.scenari.obiettivoGuadagnoMensileEur + " € |\n|---|---|---|---|");
for (const pr of P.ricavi.prezziPass12h) { const per = netto(pr) - cloud(gbEvento, "r2"); out.push(`| ${f(pr)} € | ${f(netto(pr))} € | ${Math.ceil(fissi / per)} | ${Math.ceil((fissi + P.scenari.obiettivoGuadagnoMensileEur) / per)} |`); }
const testo = out.join("\n");
fs.writeFileSync(new URL("./RISULTATI.md", import.meta.url), "# Risultati del modello costi (generati)\n\nGenerato da `node docs/costi/calcola.mjs` con le ipotesi di `ipotesi.json`. Non modificare a mano: cambia le ipotesi e rilancia.\n\n" + testo + "\n");
console.log(testo);
