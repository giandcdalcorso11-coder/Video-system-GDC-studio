# Prove automatiche

Aprono le pagine reali (`docs/camera.html` e `docs/dashboard.html`) in un browser con **camera finta** e verificano il comportamento: trasferimento dei file, spazio, trasferimento automatico, cartella scollegata o piena, memoria, ingresso dei telefoni e QR, nomi e orologio, segnali, recupero e postazione fissa, controlli avanzati.
Non usano Internet né telefoni veri: il canale tra camera e regia è simulato. **Non sostituiscono le prove sui dispositivi** (vedi `piano-test-interno.md`).

## Come si lanciano

```
cd tests
npm install              # una sola volta (Playwright e jsQR)
npx playwright install chromium   # una sola volta, se manca il browser
npm test                 # tutte le prove (circa 5 minuti)
node run.mjs cartella    # solo le prove il cui nome file contiene "cartella"
```

Se Playwright è già installato altrove: `PLAYWRIGHT_DIR=/percorso/node_modules npm test`.

Il risultato elenca ogni controllo (✓ / ✗) e termina con "TUTTE OK" o "FALLITE" (codice di uscita 1).

## Quando lanciarle

Prima di ogni modifica importante a `camera.html`, `dashboard.html`, `xfer.js` o `rt.js`, e dopo.

## Struttura

- `lib.mjs`: strumenti comuni (server locale, browser, cartella finta con disco scollegabile o pieno, hash dei file, attese).
- `run.mjs`: esegue le prove in `cases/` in ordine.
- `cases/NN-nome.mjs`: una prova per area; esporta `name` e `run()`; usa `withEnv()` e `t.check(descrizione, condizione, dettaglio)`.

## Cose da sapere

- Gli id delle camere nelle prove hanno almeno 3 caratteri (`camA`, `camB`).
- La prova del recupero forza il formato webm perché in Chromium l'mp4 consegna i pezzi solo allo stop.
- I valori dei controlli avanzati (torcia, fuoco…) sono simulati: la prova dice che il pannello funziona, non che un telefono li abbia.
