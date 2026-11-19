# Costi, cloud e pricing

Documento vivo per ragionare su costi e prezzi. **Nessuna di queste scelte è già costruita nel prodotto**: oggi i video passano direttamente dal telefono alla regia e non c'è cloud, né login, né pagamenti. Le decisioni sono nello storico del documento di sessione.

Aggiornato al 2026-11-19.

## Come si usa

1. I numeri stanno in [`docs/costi/ipotesi.json`](costi/ipotesi.json). Ogni voce dice se è una **stima** o se è **verificata** (con data e fonte).
2. Dopo aver cambiato un numero: `node docs/costi/calcola.mjs`. Scrive le tabelle in [`docs/costi/RISULTATI.md`](costi/RISULTATI.md).
3. Quando arrivano dati veri (prove, primi clienti, prezzi aggiornati) si correggono le ipotesi, si rilancia e si annota qui sotto cosa è cambiato.

## Cosa abbiamo deciso (direzione, non ancora codice)

- **Due strade insieme:** abbonamento mensile **Pro** (richiede account) e **pass a ore** (blocchi di 4, 12 o 24 ore, senza account). Il pass parte da un'attivazione esplicita.
- **Mai perdere materiale per colpa del pagamento:** alla scadenza le registrazioni e i trasferimenti in corso continuano; si bloccano solo le funzioni Pro; i file restano sul telefono.
- **Il flusso di base è gratis**, senza cloud: è la vetrina.
- **Il cloud è solo nei piani a pagamento**, con **conservazione di 4 o 7 giorni** dopo la fine della sessione e **tetto di utilizzo per cliente**.
- **Spazio a consumo, non comprato:** conto a consumo (Backblaze B2 o Cloudflare R2), nessun TB acquistato in anticipo. Il costo cresce da solo con i GB caricati.
- **Budget del cloud:** non oltre circa il **10% dell'incasso netto**.
- **Il primo pagante** (locale/struttura o creator) e **i prezzi** si decidono dopo i test e i primi clienti.

## Cosa dice il modello (con le ipotesi attuali)

Ipotesi chiave: 3 camere per 1 ora = 18 GB a evento; un Pro fa 4 eventi al mese = 72 GB caricati; 7 giorni di conservazione.

- **Il costo dello spazio è piccolo:** circa 0,15 centesimi per GB caricato con B2, 0,37 con R2. Un evento da 18 GB conservato 7 giorni costa meno di 7 centesimi.
- **Il costo cloud pesa circa il 2–6% dell'incasso netto** per un abbonato Pro, a seconda del prezzo.
- **Quello che pesa davvero:** costi fissi (circa 61 €/mese), IVA, commissioni di pagamento, tempo di lavoro e supporto.
- **Soglia di 1 TB tenuto alla volta:** circa 60 iscritti Pro con questo uso. Prima non serve avere "1 TB".
- Abbonati per coprire i fissi: da **7 a 15** a seconda del prezzo (12 € o 6 €). Pass: da **12 a 22 al mese**. I numeri precisi e per più prezzi sono in `RISULTATI.md`.

## Attenzione a queste insidie

1. **Le scritture** (R2 fa pagare le operazioni): caricare in pezzi da 60 kB costerebbe più dello spazio. Si carica a blocchi grandi (8–10 MB). Con B2 le scritture sono gratis.
2. **Più qualità, più peso:** il 4K a 40 Mbps pesa circa 3 volte la stima.
3. **Limiti del tempo reale di Supabase** (verificati il 2026-11-19): gratis 200 collegamenti contemporanei e 100 messaggi al secondo, 2 milioni di messaggi al mese; Pro 500 collegamenti, 500 messaggi al secondo, 5 milioni al mese; oltre, 10 $ ogni 1.000 collegamenti e 2,50 $ ogni milione di messaggi. Ogni camera e ogni regia occupano un collegamento. Stima (da misurare): con 3 camere che mandano lo stato ogni 2 s siamo a circa 20.000 messaggi all'ora se si contano anche i messaggi ricevuti; non è confermato che Supabase li conti. Si può ridurre mandando lo stato solo quando cambia.
4. **Salita (upload) di rete:** un telefono a 100 MB/min ha bisogno di circa 13 Mbps; con 3 camere circa 40 Mbps. Molti wifi di locali non reggono: potrebbe limitare il cloud più dei costi.
5. **Privacy:** si riprendono persone. Servono informativa, durata massima di conservazione, dati in area europea, possibilità di cancellare tutto.
6. **Mai chiavi del cloud nella pagina:** serve un piccolo servizio che dà permessi temporanei di caricamento, legato agli account.

## Idee di prezzo da testare (non verificate sul mercato)

- **Gratis:** flusso di base, senza cloud.
- **Pass 12 ore:** 4,99–6,99 €. **Pass 24 ore:** 7,99–9,99 €. Include cloud 7 giorni e funzioni Pro per quelle ore. Primo pass gratis (costa meno di 7 centesimi).
- **Pro mensile:** 9–12 €, con tetto di circa 50–100 GB conservati alla volta e un tetto mensile equo.
- **Pro annuale:** per esempio due mesi gratis.
- Variante: **cloud personale dell'utente** (Drive, Dropbox) a costo quasi zero per noi.

## Gradini del percorso

- **Oggi:** niente cloud. Solo le prove.
- **Primo passo:** file piccoli (momenti segnati, anteprime leggere): costano poco e danno già valore a distanza.
- **Poi:** caricamento completo, solo piano Pro, con scadenza e tetto.
- **Da 100 iscritti in su:** controllare i limiti di connessioni in tempo reale, i prezzi del servizio dei comandi e quelli dello spazio.
- **Da 500 in su:** valutare un contratto a lungo termine con il provider di spazio.

## A cosa serve Supabase Pro (e alternative)

Pro (25 $/mese fissi) non serve per i video: serve per comandi in tempo reale, archivio di account, sessioni e pass, login, e una funzione che dà i permessi temporanei di caricamento e riceve gli avvisi dei pagamenti. Sul piano gratuito un progetto si ferma dopo circa una settimana con poca attività (ripristinabile): non adatto a un servizio pubblico. Alternative a consumo (Cloudflare Durable Objects + R2, Ably, Firebase, un piccolo server proprio) costano meno di fisso ma richiedono di riscrivere il livello dei comandi (oggi sul tempo reale di Supabase) e di costruire login e archivio. **Scelta provvisoria:** primo test esterno su un nuovo account gratuito; apertura al pubblico su Pro; rivalutare vicino a 500 collegamenti contemporanei o se i costi a consumo superano un'alternativa. Il tetto di spesa di Pro (attivo di default) evita sforamenti.

## Da verificare (aperti)

- Quanti MB/min pesano davvero i video (prova C).
- Quanta salita reggono i posti dove si riprende.
- Se Supabase conta anche i messaggi ricevuti (cambia di molto la stima dei messaggi).
- Prezzi e limiti di Cloudflare Durable Objects, Ably e Firebase (letti solo da pagine di confronto).
- Commissioni del servizio di pagamento scelto e aliquote con un commercialista.
- Prezzi dei concorrenti.
- Costi fissi reali (contabilità, strumenti).
- Prezzi di B2 e R2 e dei piani Supabase: rileggere le pagine ufficiali prima di decidere.

## Una dashboard per te (molto più avanti)

Hai detto di volere una dashboard chiara che ti tenga aggiornato su tutto. Quando si farà: costi cloud del mese, GB caricati, utenti attivi, sessioni, incassi, connessioni in tempo reale, avvisi di spesa. Per ora i numeri vivono qui.

## Fonti usate per i prezzi (lette il 2026-11-19)

- Cloudflare R2: https://developers.cloudflare.com/r2/pricing
- Backblaze B2: https://www.backblaze.com/cloud-storage/pricing
- Supabase: https://supabase.com/docs/guides/realtime/limits , https://supabase.com/docs/guides/platform/free-project-pausing , https://supabase.com/pricing.md , https://supabase.com/docs/guides/platform/manage-your-usage/egress

## Storico delle revisioni

- **2026-11-19:** prima versione del modello (ipotesi, script, risultati).
- **2026-11-19:** aggiunti limiti verificati del tempo reale di Supabase, a cosa serve Pro e le alternative.
