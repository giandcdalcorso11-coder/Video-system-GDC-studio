# Documento di Sessione — Video System GDC Studio

**Versione:** 47
**Ultimo aggiornamento:** 2026-11-19 09:00

## Vision

Un sistema multicamera per riprendere i propri progetti da più punti di vista e montarne reel verticali (9:16) in DaVinci Resolve. Le camere restano montate in posizioni scomode: il set si tocca solo per mettere in carica il telefono e (finché non sarà automatico) recuperare i file. Da una dashboard (PC con Edge, iPad) si vede lo stato di ogni camera, si vede l'anteprima, si avvia e si ferma la registrazione e il time-lapse, si scelgono le impostazioni e si trasferiscono i file nella cartella del PC, con una barra di avanzamento e l'indicazione di quando si può chiudere in sicurezza.

Punto di partenza: due telefoni (iPhone XR e un secondo telefono) usati a mano; si vuole ridurre il tempo di preparazione del set. Obiettivo iniziale di 5 camere ridimensionato a 2 angolazioni, estendibile. Il PC è acceso solo quando si gira.

Il software (dashboard, pagina camera, canale di comunicazione) è il valore principale del progetto; l'hardware extra (ESP32, servo) è opzionale.

Direzione di prodotto (2026-11-15): oltre allo strumento personale, l'idea è portarla a un livello successivo, come app con piano gratuito (qualità massima e numero di dispositivi limitati, file solo sul dispositivo) e piano Pro (più dispositivi, qualità alta, slow-mo, time-lapse, archiviazione a scelta anche in cloud). Punti di forza da curare: uso senza installare nulla, multi-dispositivo (Apple, Android, PC; in prospettiva action cam), file sul dispositivo madre in una cartella scelta (anche disco esterno). Ancora da fare: lavorare sul funzionamento, sulla grafica e sui limiti di rete.

Primi utenti terzi (2026-11-18): attività che offrono esperienze, a cui proporre il sistema come strumento per il lavoro sui social e come banco di prova reale: go-kart (camera POV al petto), escape room (camere panoramiche fisse della struttura), serate, bar, discoteche, eventi. Idea: personalizzazione in base all'attività (preset di qualità, orientamento, zoom, bilanciamento, torcia; in prospettiva logo e colori dell'attività).

## Pipeline

Stato dettagliato in `docs/PIPELINE.md`, risultati dei test in `docs/RISULTATI-TEST.md`.

### Step 1 — Scelta dell'architettura e della camera

**Stato:** completato

**Obiettivo:** decidere con quale hardware e quale software registrare le riprese.

**Decisioni progettuali:** camera = telefono (iPhone XR) che registra dal browser (pagina web); ESP32 opzionale. Vedi voce di sessione del 2026-10-15.

**Criterio di completamento:** confermato dai test sull'XR (Step 2) e dall'utente.

**Note (cronologia dello step):**
- [2026-10-13] Ricerca componenti: l'ESP32-CAM non arriva al 1080p reale, i moduli camera adatti costano circa 300 €, i moduli CSI sono per Raspberry Pi.
- [2026-10-14] Passaggio a una soluzione con telefoni usati come camere, dopo aver chiarito l'uso (reel verticali, montaggio in DaVinci, due angolazioni).

### Step 2 — Test delle capacità dell'iPhone XR

**Stato:** completato

**Obiettivo:** sapere cosa può fare Safari (iOS 16.3.1) come camera: risoluzioni, fps, formati, spazio, WebRTC.

**Decisioni progettuali:** pagina di test pubblicata con GitHub Pages (`docs/camera-test.html`), con report copiabile.

**Criterio di completamento:** due report ricevuti e analizzati (sintesi in `docs/RISULTATI-TEST.md`).

**Note (cronologia dello step):**
- [2026-10-15] Primo giro: 1080p e 4K a 30 fps, MP4 H.264 + AAC, WebRTC ok, niente batteria né Wake Lock.
- [2026-10-15] Secondo giro: 60 fps solo a 720p, foto 12 MP ok, ripresa lunga a pezzi ok, limite di scrittura circa 0,78 GB, OPFS non utilizzabile.

### Step 3 — Dashboard

**Stato:** in corso

**Obiettivo:** home con le camere, dettaglio per camera, comandi reali, destinazione dei file e barra di scaricamento.

**Decisioni progettuali:** pagina web statica (nessun server), con livello di trasporto sostituibile (simulazione o Supabase). Nome camera = dispositivo + nome, entrambi rinominabili.

**Criterio di completamento:** l'utente comanda le camere reali dalla dashboard e scarica i file nella cartella del PC.

**Note (cronologia dello step):**
- [2026-10-14] Prototipo simulato con home e dettaglio.
- [2026-10-15] Collegata alle camere reali (Supabase), con anteprima WebRTC, impostazioni, schermo nero: provata solo con simulazione locale.
- Da fare: barra batteria reale, selettore destinazione, barra di scaricamento.
- [2026-10-15] Dashboard r5: i due registri sono fusi in un unico pannello con tab "Registro" e "Attività avanzata" (stesso spazio in home e nel dettaglio, la scheda scelta viene ricordata; Copia e Svuota valgono per la scheda aperta).
- [2026-10-15] Dashboard r4: anteprime live nella home (interruttore), pannello Time-lapse nel dettaglio, stato "Time-lapse"/"Creo video" nel pill, registro avanzato con campionamento dei messaggi di stato.
- [2026-10-15] Provata con i dispositivi veri (XR e telefono personale): REC/STOP, stato e impostazioni funzionano. Aggiunti: registro attività avanzato con copia, pulsante Copia nel registro base, banner "Stesso telefono?" per unire camere duplicate, link per singola camera, indicatore dello schermo nero.

### Step 4 — Pagina camera (telefono)

**Stato:** in corso

**Obiettivo:** pagina che si abbina alla dashboard, mostra l'anteprima, registra a pezzi su disco e invia lo stato.

**Decisioni progettuali:** buffer locale con tetto di sicurezza di 700 MB; i pezzi vanno su IndexedDB durante la registrazione; scarico continuo verso il PC da implementare.

**Criterio di completamento:** registrazione di una ripresa lunga con trasferimento al PC senza perdere pezzi.

**Note (cronologia dello step):**
- [2026-10-15] `docs/camera.html` v1: abbinamento, camera, REC/STOP, anteprima, impostazioni, schermo nero, elenco registrazioni.
- Da fare: file in attesa, trasferimento.
- [2026-10-15] Seconda prova con i dispositivi veri: anteprima WebRTC ok (collegamento diretto host→host, RTT circa 8 ms, 1080p a circa 20 fps), REC, schermo nero e avvio automatico ok. Camera r4: time-lapse (automatico come iPhone e manuale) con immagini su disco e video creato sul telefono; anteprima "mini" (home) e "full" (dettaglio); parametri di invio applicati dopo la negoziazione.
- [2026-10-15] Camera r3: avvio automatico della camera all'apertura della pagina (opzione attiva di default; si disattiva con "Ferma camera" a mano, si riattiva con "Avvia camera"; riprova al ritorno in primo piano). Permesso fotocamera/microfono: va impostato su "Consenti" per il sito nelle impostazioni di Safari. Da provare sull'XR.
- [2026-10-15] Provata sull'XR: REC/STOP dalla dashboard e salvataggio in galleria ok. Problemi segnalati: camera duplicata alla riapertura del link, "Archivio non disponibile: InvalidStateError", tasto schermo nero non funzionante. Corretti/instrumentati in camera r2 (riapertura automatica di IndexedDB, identità da link/cookie, registro attività inviato alla dashboard).

### Step 5 — Canale di comunicazione

**Stato:** completato

**Obiettivo:** far comunicare pagina camera e dashboard (comandi, presenza, segnalazione WebRTC).

**Decisioni progettuali:** Supabase Realtime con canale segreto; video e file passano direttamente tra telefono e PC.

**Criterio di completamento:** camera e dashboard si trovano e si comandano con Supabase vero.

**Note (cronologia dello step):**
- [2026-10-15] Progetto scelto per ora: GDC-thumbnail-generator. Codice in `docs/rt.js`. Provato solo con una simulazione locale: da provare sui dispositivi.
- [2026-10-15] Provato con dispositivi veri: funziona (XR e telefono personale).

### Step 6 — Trasferimento file e destinazioni

**Stato:** in corso (provato con successo su iPhone 15 → iPad su rete molto debole; mancano prove su PC con cartella, su rete locale veloce e su file grandi)

**Obiettivo:** arrivo dei file nella cartella del PC (Edge, File System Access) con barra di avanzamento e "sicuro da chiudere"; poi destinazioni alternative.

**Decisioni progettuali:** destinazione principale = cartella del PC; galleria dell'iPad con un tocco sull'iPad; galleria del telefono con un tocco sul telefono; cloud come segnaposto.

**Criterio di completamento:** file verificato (dimensione) e scritto nella cartella; il file viene cancellato dal telefono solo dopo la conferma.

**Note (cronologia dello step):**
- [2026-10-15] Fattibilità chiarita per ogni destinazione.
- [2026-11-17] Prova reale iPhone 15 → iPad (rete del telefono molto debole, 0,2-0,9 Mbps): clip da 6,3 MB arrivata e verificata dopo 3 riprese automatiche (byte 1 140 000, 2 640 000, 4 440 000, CRC ok) e una manuale; video visto dalla galleria dell'iPad, qualità ottima.
- [2026-11-17] Ripresa automatica dopo un'interruzione: il ricevente conserva quanto ricevuto (destinazione aperta e CRC32 progressivo), a ogni tentativo ricevente e mittente si accordano sul byte di ripartenza e la camera controlla il CRC32 dei byte già consegnati prima di continuare; fino a 6 tentativi automatici a distanza di 6 s, poi pulsante "Riprendi". Coda di invio ridotta (1 MB) perché i byte "inviati" siano quasi quelli arrivati.
- [2026-11-18] Trasferimento automatico dopo ogni clip e buffer a rotazione (dashboard r16), provati in simulazione; da provare su dispositivi reali con una cartella del PC.
- [2026-11-15] Prima versione: invio diretto camera → dashboard con WebRTC data channel (segnalazione su Supabase, evento `xrtc`), a blocchi da 60 KB con controllo della coda, controllo finale di dimensione e CRC32; destinazioni: cartella del computer (File System Access, solo Edge/Chrome desktop; la cartella è ricordata) oppure memoria del dispositivo + Salva/Condividi; opzione "elimina dal telefono dopo il trasferimento verificato" (spenta di default); barra di avanzamento con velocità e tempo residuo; indicatore "Sicuro da chiudere"; prova di velocità da 30 MB con tipo di percorso (rete locale/relay). Provato in Chromium con camera e dashboard simulate: SHA-256 identico sia in memoria sia con cartella simulata, eliminazione dopo la verifica ok. Non ancora fatta: ripresa dopo interruzione, coda in background, TURN.
- [2026-11-15] Chiarito il limite di Safari su iPad: non può scegliere una cartella; i file si salvano da Condividi → File (anche su disco esterno). Su PC con Edge/Chrome la cartella si sceglie. Il trasferimento diretto sulla stessa rete è il percorso principale; tra reti diverse servirebbe un relay (a pagamento).

### Step 7 — Time-lapse nella pagina camera

**Stato:** in corso

**Obiettivo:** time-lapse comandabile dalla dashboard, in modalità automatica (emula l'app Fotocamera) e manuale.

**Decisioni progettuali:** automatica = 2 immagini al secondo, poi intervallo raddoppiato a 10, 20, 40 minuti scartando un'immagine su due; video a 30 fps. Prototipo già in `docs/camera-test.html`.

**Criterio di completamento:** time-lapse avviato e fermato dalla dashboard, con file inviato al PC.

**Note (cronologia dello step):**
- [2026-10-15] Prototipo nel test. Limite: circa 1300 immagini a 1080p nel buffer locale.
- [2026-10-15] Integrato in camera r4 e dashboard r4 (comandi tl_start e tl_stop, modalità automatica e manuale, video creato sul telefono, "Ricrea il video" se la creazione fallisce). Provato solo con simulazione locale: da provare sull'XR, in particolare la creazione del video con canvas e MediaRecorder su iOS 16.3.
- [2026-10-15] Provato sull'XR (iOS 16.3.1): modalità automatica, 72 s di ripresa, 145 immagini (2 al secondo, circa 600 KB l'una), video 1080×1920 a 30 fps di 4,8 s (×15), 19 MB, creato in 9 s e salvato in Foto con "Salva in Foto / File". Funziona; aspetto diverso dalla camera nativa (esposizione e messa a fuoco automatiche, nessun blocco possibile in Safari 16.3), ma giudicato accettabile. Per ritmi più lenti usare la modalità manuale: velocità = intervallo × fps. Limite buffer 700 MB: circa 8-9 minuti a 2 immagini al secondo.
- [2026-10-15] Segnalato dall'utente: il video del time-lapse web è più scattoso del nativo. Causa trovata nel registro: il video veniva creato in tempo reale con attesa + decodifica di ogni immagine (9 s per 145 immagini invece di 4,8 s), quindi tempi irregolari. Camera r5: immagini decodificate in anticipo, ogni fotogramma disegnato alla sua scadenza esatta (30 fps) con `requestFrame`; il registro riporta i fotogrammi in ritardo. Da riprovare sull'XR.

### Step 8 — App Comandi sull'XR (batteria)

**Stato:** da fare

**Obiettivo:** la dashboard mostra livello e stato di carica della batteria, inviati da automazioni di Comandi alle soglie 100, 90, 80, 70, 60, 50, 40, 35, 30, 25, 20, 15, 10, 5, 4, 3, 2, 1 % e quando il caricabatterie viene collegato o scollegato.

**Decisioni progettuali:** il browser non espone la batteria; si usa l'app Comandi (confermata presente sull'XR).

**Criterio di completamento:** automazioni che partono senza conferma su iOS 16.3.1 e barra batteria reale.

**Note (cronologia dello step):**
- [2026-10-15] Messo in pipeline. Circa 20 automazioni da creare a mano.
- [2026-10-15] Scelto il canale: Comandi invia un POST all'API REST di Supabase Realtime (`/realtime/v1/api/broadcast`, evento `battery`, canale del progetto) con id camera e livello (e opzionalmente `charging`). Camera r6 riceve l'evento, salva e rimanda lo stato alla dashboard con l'ora della misura. Pulsanti "Dati per Comandi (batteria)" e "Prova invio batteria" nella pagina camera. Il POST REST non è stato provato dal vivo (rete della sandbox bloccata): da verificare sull'XR con "Prova invio batteria".
- [2026-11-18] Test Android (Pixel 8 Pro, Chrome 157): `navigator.getBattery` presente, livello 77% in carica letto dal browser e mostrato sulla dashboard senza Comandi.
- [2026-11-17] Sonda camera r20 sull'iPhone 15 (Safari 27.2, iOS 18.7): `navigator.getBattery` assente (log 15:21). Test da fare più avanti: aprire la camera da Chrome su un telefono Android (dove l'API dovrebbe esistere e dare la batteria senza Comandi); su iPhone tutti i browser usano WebKit, quindi Chrome iOS non cambia (da verificare solo se in UE esistesse un motore diverso).

### Step 10 — Modalità Base/Avanzata e log inviati a Claude

**Stato:** in corso (implementato, da verificare sui dispositivi veri)

**Obiettivo:** una sola web app con due modalità: Base (solo i comandi utili a tutti) e Avanzata (impostazioni, test, registri: quella di sviluppo); in Avanzata i log possono arrivare in un database che Claude legge, per evitare il passaggio copia e incolla.

**Decisioni progettuali:** interruttore Base/Avanzata in cima a camera e dashboard, ricordato sul dispositivo; elementi avanzati marcati `adv-only`. Invio dei log solo con modalità Avanzata e interruttore "Invia i log a Claude" attivi; tabella `gdc_dev_logs` nel progetto Supabase del titolare (che contiene anche altre tabelle: non toccate), scrittura anonima, nessuna lettura con la chiave pubblica, cancellazione automatica dopo 7 giorni; link e chiavi vengono oscurati nel testo.

**Criterio di completamento:** una prova sull'iPad e sull'iPhone 15 con invio attivo, e Claude che legge le righe dalla tabella.

**Note (cronologia dello step):**
- [2026-11-15] Creata la tabella con verifica dei permessi (insert anonimo ok, lettura anonima negata). Camera r8 e dashboard r6 con il nuovo interruttore. Provato in un browser di prova con rete simulata; la scrittura vera verso Supabase non è provabile dalla sandbox (proxy).

### Step 11 — Uso pubblico: sessioni con QR e codice

**Stato:** da fare (mockup approvati nella forma, flusso reale non ancora costruito)

**Obiettivo:** un percorso per terzi, separato dal link developer: pagina iniziale con scelta del ruolo, creazione di una sessione dalla regia con QR e codice, ingresso delle camere con nome e permessi, accettazione dalla regia, comandi essenziali, file; nessuno strumento da sviluppatore.

**Decisioni progettuali:** pagine pubbliche con configurazione incorporata (nessuna chiave nei link) e, quando si apre davvero, progetto Supabase dedicato con canali con prefisso diverso e senza tabella di log; il link attuale resta "developer" (Avanzata, log, sonda). Ingresso con QR e anche con codice scritto di 8 caratteri; sessione a scadenza (4, 12 o 24 ore); la regia sceglie con un interruttore se approvare ogni camera che entra (modificabile anche durante la sessione). Limiti gratuito/Pro e account rimandati a dopo i test; grafica e personalizzazione per attività più avanti.

**Criterio di completamento:** una persona che non conosce il sistema crea una sessione, fa entrare due telefoni, registra e riceve i file senza aiuto.

**Note (cronologia dello step):**
- [2026-11-18] Mockup a 8 schermate (scelta ruolo, camera: entra/nome e permessi/in ripresa, regia: nuova sessione/accetta/tutte le camere/file) pubblicati come tela di lavoro; confermati QR e codice insieme e l'interruttore di approvazione sulla regia; grafica e Gratis/Pro rimandati ai test.
- [2026-11-18] QR e conferma accetta/rifiuta (dashboard r22, camera r23); schermata di benvenuto della camera con nome e permessi (camera r24). Codice a 8 caratteri rimandato.
- **DA RICORDARE ALL'UTENTE:** prima del primo test esterno l'utente creerà un nuovo account Supabase dedicato (progetto per il pubblico) e va ricordato di farlo prima di aprire la sessione a persone esterne; con il nuovo account si decide anche dove vive la tabella dei codici a 8 caratteri.
- **DA RICORDARE ALL'UTENTE (al passaggio al nuovo account Supabase):** (1) spostare tutto ciò che c'è in GDC-project 2 (`mjcnvpwjvwrucwjptgiu`: tabella `gdc_dev_logs` con le sue regole, trigger di pulizia e antiduplicati) nel nuovo progetto e aggiornare l'indirizzo e la chiave usati dalle pagine e nei link; (2) **NON eliminare GDC-project 2**, e **attenzione: ospita anche un'altra app** (tabelle `thumb_*`, funzioni `is_master`, `owns_client`, `owns_storage_path`, regole relative): non toccarle. Va rimosso solo ciò che ha creato questo progetto: tabella `gdc_dev_logs` (con la sua regola `gdc_dev_logs_insert`, indici, vincoli), funzioni `gdc_dev_logs_cleanup` e `gdc_dev_logs_dedupe`, trigger `gdc_dev_logs_cleanup_trg` e `gdc_dev_logs_dedupe_trg`; prima di cancellare mostrare l'elenco e avere conferma; farlo solo dopo aver verificato che il nuovo funziona e con conferma esplicita dell'utente prima di cancellare dati; (3) controllare anche GDC-project (`pnzabwfsgkvejnrtrjcp`, l'altra app) per essere sicuri che non siano rimasti resti di questo progetto (tabelle, regole, funzioni, canali), senza toccare ciò che appartiene all'altra app.

### Step 9 — Hardware opzionale

**Stato:** rimandato

**Obiettivo:** ESP32 (pulsante REC fisico, servo pan/tilt, telecomando Bluetooth), altri telefoni.

**Decisioni progettuali:** nessuna ancora.

**Criterio di completamento:** da definire se servirà.

**Note (cronologia dello step):**
- [2026-10-15] Standby/schermo nero già fatto via web. Controllo dell'XR dall'iPad accantonato.

## Storico sessioni

### [2026-11-19 09:00] Permesso REC/STOP del telefono e modo di ripresa per camera

**Riepilogo:** la regia decide se ogni telefono può avviare e fermare la registrazione da solo (per camera o per tutte) e assegna a ogni camera un modo di ripresa (Video o Time-lapse); "REC tutte" rispetta il modo di ciascuna (camera r30, dashboard r31).

**Cosa è stato fatto:**
- Permesso: comando firmato `perm_cfg`; sul telefono compare un pulsante grande REC/STOP solo se il permesso è dato (default spento); spunta per camera nel dettaglio e spunta "tutte" nella home (vale anche per i telefoni nuovi); il valore voluto sta nel record della camera e viene riallineato se il telefono dice altro; il STOP della regia vale sempre; un intruso non può cambiarlo.
- Modo per camera: selettore "Modo" (Video / Time-lapse) nel dettaglio, modo mostrato nella scheda in home; "REC tutte", "STOP tutte" e i pulsanti REC/STOP di ogni camera avviano e fermano nel modo scelto; impostazioni del time-lapse ricordate per camera; STOP attivo anche per time-lapse in corso.
- Riordino: aggiunto il modulo `13-permessi-modi.js` (la regia ora ha 17 moduli, rinumerati).
- Prove: gruppo 14 (23 controlli): permesso per camera e per tutte, camera che entra dopo, riallineamento, intruso, REC dal telefono, STOP della regia, modi misti con video time-lapse prodotto.

**Decisioni prese:**
- Contesto: l'utente vuole poter scegliere sempre, per camera o per tutte. Decisione: scelta sempre disponibile dalla regia; default spento. Il ralenti è rimandato ("più avanti"): dal browser non esistono 120/240 fps, solo 60 dove il telefono li dà (iPhone XR solo a 720p, Pixel 8 Pro fino a 60, iPhone 15 da misurare).

**File consegnati/modificati:** docs/dashboard/13-permessi-modi.js (nuovo) e moduli 14-17 rinumerati, 05, 08, 14 (viste), 15 (router); docs/camera/12-stato.js, 15-comandi.js, 16-interfaccia.js; docs/camera.html, docs/dashboard.html; docs/ARCHITETTURA.md, docs/PIPELINE.md, piano-test-interno.md; tests/cases/14-permessi-modi.mjs; documento v47.

---

### [2026-11-19 07:00] Chiave della regia: solo la regia può comandare le camere

**Riepilogo:** i comandi della regia sono ora firmati e le camere con link nuovo eseguono solo comandi firmati (camera r29, dashboard r30, nuovo `docs/auth.js`).

**Cosa è stato fatto:**
- Coppia di chiavi ECDSA P-256 generata dalla regia al primo avvio. Chiave pubblica nei link delle camere e nel QR; chiave privata solo nel link della dashboard ("Copia link dashboard"). Il link della camera non contiene mai la chiave privata.
- Ogni comando (anche anteprima) parte firmato con numero progressivo (`an`), ora (`at`) e id di sessione (`as`); la camera verifica firma, ripetizione (ultimi 64 numeri per sessione, 20 sessioni ricordate) ed età (massimo 10 minuti); altrimenti ignora e risponde "non autorizzato" (al massimo una volta ogni 10 s). I link vecchi senza chiave funzionano come prima.
- Interfaccia: riga "Protezione" sulla camera (Avanzata) e stato della chiave nel pannello Collegamento della regia; "Nuovo canale" rifà anche le chiavi.
- Prove (13 gruppi → 14): link con e senza chiave privata, comando firmato eseguito, intruso senza firma / con firma falsa / con un'altra chiave / con un comando già usato rimandato, seconda regia con il link della dashboard (funziona) e con quello della camera (non comanda), collegamento senza chiave invariato. Senza la difesa 6 controlli falliscono.

**Decisioni prese:**
- Contesto: per cambiare regia (iPad poi computer) serve condividere la chiave. Decisione: la chiave privata viaggia nel link della dashboard, che resta segreto come già era il canale. Alternative scartate: chiave scambiata alla prima accettazione del telefono (il primo che arriva vince, un intruso potrebbe prendere la camera) e firma con segreto condiviso (la camera potrebbe falsificare comandi e il segreto starebbe nel link della camera).
- **Bug: trasferimenti falliti con la chiave** — **Sintomo:** la suite completa mostrava tutti i trasferimenti in errore. **Causa:** i campi della firma (`sid`, `n`, `ts`) si scontravano con quelli dei comandi (`sid` = clip da trasferire). **Fix applicato:** campi propri `as`, `an`, `at`; prova nuova che trasferisce una clip con la chiave attiva. Verificato.
- Limiti dichiarati: il canale non è cifrato (chi ha il link legge stato e comandi firmati), una camera finta può ancora presentarsi (la conferma resta il filtro), i telefoni con orologio sfasato di oltre 10 minuti rifiutano i comandi.

**File consegnati/modificati:** docs/auth.js (nuovo), docs/rt.js, docs/camera.html, docs/dashboard.html, docs/camera/12-stato.js, 15-comandi.js, 16-interfaccia.js, docs/dashboard/04-camere.js, 05-trasporto.js, 09-viste-base.js, 13-viste.js, docs/ARCHITETTURA.md, docs/PIPELINE.md, piano-test-interno.md, tests/lib.mjs e cases/13-chiave-regia.mjs; documento v46.

---

### [2026-11-19 05:00] Riordino in moduli e rinforzo della sicurezza dei messaggi

**Riepilogo:** camera e dashboard divisi in 16 moduli ciascuno (stesso comportamento), avvii spostati a fine caricamento, messaggi del canale ripuliti prima di arrivare alle pagine (camera r28, dashboard r29).

**Cosa è stato fatto:**
- **Riordino:** `docs/camera/` e `docs/dashboard/` con 16 moduli numerati, caricati in ordine con `defer` e `?v=<versione>` (anche rt.js, dev.js, xfer.js, qr.js). Le pagine HTML restano con struttura e stile. Nessuna modifica di logica nello spostamento.
- **Bug: errore se la pagina si riapre dopo una prova di memoria interrotta**
  **Sintomo:** dopo il riordino, la riapertura della regia con una prova di memoria "in corso" dava "renderLogs is not defined" (trovato dalla suite).
  **Causa:** codice eseguito all'apertura (nel modulo 06) chiamava funzioni definite in un modulo successivo; nel file unico di prima le funzioni erano disponibili subito.
  **Fix applicato:** tutti gli avvii (ripristino della cartella e della prova di memoria, timer dell'ingresso, timer della postazione fissa sulla camera) sono ora funzioni lanciate dall'ultimo modulo. Regola nuova: un modulo definisce, non avvia. Prova nuova con caricamento lento e stati salvati. Verificato.
- **Sicurezza:** `rt.js` ripulisce stato, comandi, risposte, esiti e batteria in arrivo (niente `<`, `>`, `&`, virgolette e caratteri di controllo; testi max 400 caratteri, liste max 40, chiavi semplici, messaggi oltre 40 kB ignorati); la regia scarta id camera non validi; i nomi dei file in arrivo sono resi sicuri. Prova con un intruso che manda testo con codice, comandi non previsti, id strani e un messaggio enorme: senza le difese 6 controlli falliscono, con le difese passano tutti.
- Prove: 13 gruppi, circa 200 controlli; la suite ora segnala anche richieste fallite e errori di console della pagina.

**Limite noto:** chi ha il link può ancora mandare comandi (REC, STOP, rinomina, "non accettata"). Per impedirlo serve una chiave della regia scambiata all'accettazione: non ancora fatta.

**Da rivedere se:** si volesse limitare ulteriormente (CSP, controllo di integrità della libreria Supabase dal CDN).

**File consegnati/modificati:** docs/camera.html, docs/dashboard.html, docs/camera/*.js, docs/dashboard/*.js, docs/rt.js, docs/xfer.js, docs/ARCHITETTURA.md, docs/PIPELINE.md, tests/ (lib, run, cases 00, 11, 12), documento v45.

---

### [2026-11-19 03:00] Prove salvate nel repository, controllo di sicurezza del database, documenti tecnici aggiornati

**Riepilogo:** le prove automatiche ora vivono in `tests/` (11 gruppi, comando unico); controllato il database Supabase (ben protetto, ma il progetto ospita anche un'altra app); riscritti i documenti tecnici in `docs/`; la nuova suite ha trovato e fatto correggere un bug.

**Cosa è stato fatto:**
- `tests/`: libreria comune, runner (`npm test` o `node run.mjs <filtro>`) e 11 gruppi di prove con controlli espliciti: sintassi, trasferimento con caduta (memoria e cartella, SHA-256), spazio, automatico e anteprima, cartella scollegata/piena, memoria, ingresso e QR, nomi e orologio e Base/Avanzata, segnali, recupero e postazione fissa, controlli avanzati. README in italiano.
- **Bug trovato dalle prove:** dopo "Accetta" la camera non riceveva il proprio numero (la regia lo mandava prima di creare la camera). Corretto (dashboard r28): la camera viene creata, poi riceve ingresso e numero.
- Controllo di sicurezza di GDC-project 2 (sola lettura): su `gdc_dev_logs` protezione di riga attiva, solo inserimento per i client (nessuna lettura), limiti di lunghezza, ruoli controllati, cancellazione a 7 giorni, anti-duplicati. Rischio residuo: inserimenti illimitati con la chiave pubblica fino alla pulizia; per il pubblico i log sono spenti di default e servirà informativa e consenso. Gli avvisi di Supabase riguardano l'altra app (funzioni `is_master`, `owns_client`, `owns_storage_path` eseguibili da utenti non autenticati, protezione contro le password trapelate spenta), non il nostro codice: da segnalare al proprietario di quell'app.
- GDC-WEBAPP (`pnzabwfsgkvejnrtrjcp`, sola lettura): nessun oggetto di questo progetto rimasto (nessuna tabella, funzione, regola o trigger `gdc*`).
- Documenti: `docs/ARCHITETTURA.md` riscritto, `docs/PIPELINE.md` aggiornato, `docs/RISULTATI-TEST.md` con iPhone 15, Pixel 8 Pro e revisione del database.

**Decisioni prese:**
- Contesto: l'utente ha rimandato la precisione degli avvii sincronizzati ("REC alle hh:mm:ss") a più avanti: prima funzionamento sicuro e buona struttura. Decisione: nessun REC sincronizzato per ora.
- Contesto: GDC-project 2 contiene un'altra app. Decisione: la pulizia futura toccherà solo gli oggetti `gdc_*` (elenco nel promemoria dello Step 11).

**File consegnati/modificati:** tests/ (nuova cartella: package.json, README, lib.mjs, run.mjs, cases/*), docs/ARCHITETTURA.md, docs/PIPELINE.md, docs/RISULTATI-TEST.md, docs/dashboard.html (r28); documento v44.

---

### [2026-11-19 01:30] Controlli avanzati della fotocamera

**Riepilogo:** pannello "Controlli camera" (dashboard r27, solo Avanzata; camera r27) con torcia, fuoco, bilanciamento del bianco ed esposizione, mostrati solo se il telefono li dichiara.

**Cosa è stato fatto:** la camera legge le capacità della traccia video (torcia, modo e distanza di fuoco, modo e temperatura del bianco, modo, correzione, ISO e otturatore dell'esposizione) e le invia nello stato; la dashboard costruisce il pannello solo con ciò che esiste. Comando `pro` con validazione dei valori, applicati uno alla volta; i valori manuali (non la torcia) si riapplicano quando la camera si riavvia; "Tutto automatico" riporta modi in automatico, correzione 0 e torcia spenta. Provato in Chromium con capacità simulate: torcia, modo e distanza di fuoco, correzione di esposizione, riapplicazione dopo il riavvio della camera e reset.

**Limiti noti:** non provato su telefoni reali. Le unità dell'otturatore variano tra browser (assunte 100 µs come in Chrome). Su iOS i controlli disponibili dipendono dalla versione di Safari: iPhone 15 con Safari 27.2 espone torcia, distanza di fuoco e bianco manuale; l'iPhone XR probabilmente quasi nulla. Il pannello è in Avanzata: si sposta in Base se serve.

**File consegnati/modificati:** docs/camera.html (r27), docs/dashboard.html (r27); documento v43.

---

### [2026-11-19 00:30] Recupero delle registrazioni dopo un blocco e postazione fissa

**Riepilogo:** corretto un buco serio (una registrazione interrotta dalla chiusura della pagina andava persa) e aggiunta la "postazione fissa" che riprende da sola dopo blocchi (camera r26, dashboard r26).

**Bug: registrazione persa se la pagina viene chiusa durante la ripresa**

**Sintomo:** se il sistema chiudeva la pagina camera mentre registrava (memoria, blocco, riavvio), i pezzi restavano nell'archivio ma la clip non compariva mai.
**Causa:** il registro della clip veniva scritto solo allo STOP.
**Fix applicato:** al REC si scrive subito un registro "in corso", aggiornato ogni 10 s; all'apertura della pagina `recoverOrphans` ricostruisce le clip "in corso" e anche i pezzi senza registro (anche quelli di blocchi passati), durata stimata a un pezzo al secondo, e avvisa "recuperata dopo un blocco: la fine potrebbe mancare". Verificato in Chromium con webm (6 pezzi recuperati, 6 s). Su Safari i pezzi arrivano in continuazione (iPhone 15: 8 pezzi in 10 s), quindi il recupero dovrebbe funzionare; **da provare** sul telefono (chiudere la pagina durante la ripresa). In Chromium con mp4 i pezzi sono arrivati solo allo STOP (osservato in prova con camera finta): su Android va verificato se il recupero è efficace.

**Cosa è stato fatto (postazione fissa):**
- Controllo periodico: se la camera si spegne da sola (traccia interrotta) e non è stata fermata a mano, la camera prova a riaccendersi, con intervalli crescenti fino a 60 s.
- Collegamento: se resta giù oltre 60 s lo ricrea; lo ricrea anche al ritorno della rete.
- Spunta in dettaglio camera: "Postazione fissa: se la camera si blocca o la pagina si chiude, riprende da sola a registrare" (comando `station_cfg`). La volontà di registrare è salvata sul telefono: nasce con REC dalla regia e si cancella con STOP o "Ferma camera" (non con arresti automatici). Nuova clip a ogni ripresa (le parti sono file separati). Se il riavvio fallisce per lo spazio, rinuncia.
- Provato in Chromium: REC con spunta attiva, pagina camera chiusa durante la ripresa, riaperta: clip recuperata e registrazione ripartita da sola; dopo STOP e ricarica non registra.

**File consegnati/modificati:** docs/camera.html (r26), docs/dashboard.html (r26); documento v42.

---

### [2026-11-18 23:50] Idea: comando da orologio smart e scenario partita di padel

**Riepilogo:** idea dell'utente di gestire le riprese e i segnali da un orologio smart (scenario: partita di padel, 4 telefoni in 4 angolazioni); valutata la fattibilità senza app native e il possibile primo test esterno senza orologio.

**Valutazione (non ancora implementata):**
- Apple Watch non ha un browser per pagine web: una pagina come la dashboard non gira. Strada senza scaricare nulla: Comandi (Shortcuts) sull'orologio che invia una richiesta HTTP al canale (come già previsto per la batteria su iPhone): un tocco per "Segna", "REC tutte", "STOP tutte". Le camere accettano già comandi indirizzati a tutte (`to: "*"`). Mancano: evento `mark` ricevuto dalle camere (e dalla regia), che registrano la posizione dentro la clip in autonomia; ritardo previsto 1-3 s (Comandi parte lento), da compensare con un'impostazione.
- Alternativa: pagina "telecomando" con pulsanti grandi (Segna, REC, STOP) per qualsiasi schermo piccolo.
- Partita di padel: 4 telefoni fissi da 60-90 minuti; con 1080p a 8-10 Mbps circa 5-7 GB a telefono: è necessario tenere i file sui telefoni e scaricarli dopo. Idea da verificare: registrazione a segmenti e trasferimento solo dei momenti segnati (±15-30 s), per ridurre molto i tempi; richiede una prova sulla compatibilità dei frammenti MP4 con DaVinci Resolve.
- Destinazione dei file: cloud (piano Pro), file sui telefoni, oppure un telefono/computer di destinazione scelto.
- Senza orologio lo scenario è un buon candidato per il primo test esterno (4 telefoni, QR, conferma, segnali, file sui telefoni), dopo il nuovo account Supabase.

**Decisioni prese:** nessuna ancora (solo idea).

**File consegnati/modificati:** documento v41.

---

### [2026-11-18 23:30] Revisione del codice e segnali per il montaggio

**Riepilogo:** rilettura del codice aggiunto oggi con quattro correzioni (dashboard r24, camera r24), poi nuova funzione "Segna" per ritrovare i momenti nel montaggio (dashboard r25, camera r25).

**Cosa è stato fatto:**
- Revisione, correzioni: (1) con più dashboard sullo stesso canale (iPad poi PC) ogni camera riparte da zero e chiedeva di nuovo l'ingresso, con numeri diversi: ora la camera ricorda il suo numero (`Camera N`) e lo comunica, la regia lo riusa se libero; aggiunto "Accetta tutte" quando le richieste sono più di una. (2) Se durante l'attesa della cartella si cambia destinazione, il trasferimento si ferma con un messaggio invece di restare in attesa all'infinito. (3) Benvenuto: tolto il doppio avvio della camera (race tra avvio automatico e avvio manuale). (4) Nome file nello stato con estensione corretta (mp4 o webm).
- Segnali: pulsante "⚑ Segna" nell'intestazione della regia (anche tasto M). Un tocco registra l'istante su tutte le camere che stanno registrando, come posizione dentro la clip (la camera ora comunica l'id della registrazione in corso). Pannello "Segnali" in home con elenco, note modificabili, "Esporta segnali" e "Cancella". Esportazione: un CSV (segnale, ora della regia, nota, camera, file, posizione hh:mm:ss:ff a 30 fps e secondi) e, per ogni camera, un file dei marcatori per DaVinci Resolve (formato EDL dei marcatori, tempo che parte da 01:00:00:00: **da provare in Resolve**). I file vanno nella cartella dei file se disponibile, altrimenti si scaricano.
- Precisione: circa mezzo secondo (ritardo del canale). Non dipende dagli orologi dei telefoni.
- Provato in Chromium: segnali con e senza registrazione, scorciatoia M, note, CSV ed EDL corretti, regressioni join/QR/nomi ok.

**Limiti noti:** l'EDL dei marcatori non è stato provato in DaVinci Resolve; se non si importa, si usa il CSV. I segnali sono salvati nel browser della regia (ultimi 500).

**File consegnati/modificati:** docs/dashboard.html (r25), docs/camera.html (r25); documento v40.

---

### [2026-11-18 22:45] Correzione del promemoria: project 2 si pulisce, non si elimina

**Riepilogo:** corretto il promemoria Supabase: GDC-project 2 non va eliminato, va solo ripulito da tutto ciò che questo progetto vi ha messo.

**Decisioni prese:**
- Supera la decisione del: 2026-11-18 22:30 (eliminare project 2) — l'utente ha precisato che il progetto deve restare e va solo pulito. Il controllo di GDC-project (l'altra app) resta com'era: solo verifica che non siano rimasti resti, senza toccare ciò che appartiene all'altra app.

**File consegnati/modificati:** documento v39 (nota in Step 11).

---

### [2026-11-18 22:30] Promemoria: pulizia dei progetti Supabase

**Riepilogo:** registrato nel documento il promemoria per il passaggio al nuovo account Supabase: spostare tutto da GDC-project 2, eliminarlo (con conferma) e controllare GDC-project per eventuali resti.

**Decisioni prese:**
- Contesto: l'utente creerà un nuovo account Supabase dedicato per il primo test esterno. Decisione: in quel momento si sposta tutto da GDC-project 2, lo si elimina e si controlla anche GDC-project (l'altra app) per sicurezza, senza toccare ciò che non è di questo progetto. L'eliminazione richiede conferma esplicita dell'utente.

**File consegnati/modificati:** documento v38 (nota in Step 11).

---

### [2026-11-18 22:00] Nomi dei file, orologio, nomi unici, "file sui telefoni", benvenuto e Base/Avanzata

**Riepilogo:** preparazione del test interno con più telefoni: file con nome completo (Camera N + nome scelto dal telefono + data e ora di inizio corrette), misura dello scarto degli orologi, camere con numero unico, modalità "i file restano sui telefoni", benvenuto della camera (nome e permessi), pulizia delle camere vecchie e separazione Base/Avanzata (dashboard r23, camera r24).

**Cosa è stato fatto:**
- Nome file: `Camera2_Davanti_2026-11-18_14-03-22.mp4` (numero assegnato dalla regia + nome scelto sul telefono, senza spazi né accenti + data e ora di inizio; i time-lapse hanno `_timelapse`). L'ora di inizio è corretta con lo scarto dell'orologio rispetto alla regia (si presume lo stesso fuso orario).
- Orologio: la regia manda 6 ping a distanza di 0,7 s, tiene la misura con il tempo di andata e ritorno più breve, comunica lo scarto alla camera (comando `clock`) e lo scrive nel registro; si ripete ogni 10 minuti. In Avanzata, nel dettaglio camera, riga "Orologio". Provato con un orologio sfasato di 5 s: misurato +5,00 s (±1 ms in simulazione).
- Numeri unici: ogni camera nuova prende il numero libero più basso ("Camera 1 · Telefono · nome"), assegnato anche alle camere già note; il numero è mostrato sul telefono nella riga "Regia".
- Pulizia: avviso in home per le camere non collegate da più di un giorno, con "Rimuovi dall'elenco".
- Modalità "Tieni i file sui telefoni": spunta nel pannello File; blocca il trasferimento automatico e l'eliminazione dal telefono; il trasferimento a mano resta.
- Benvenuto della camera (solo alla prima apertura): nome della camera, spiegazione di permessi, schermo acceso e dove restano i video; la camera si collega alla regia solo dopo, così la richiesta di ingresso mostra già il nome scelto. Chi aveva già usato la camera o usa `?name=` salta la schermata.
- Base/Avanzata: in Base la camera mostra solo nome, avvio/stop, regia, camera, trasferimento, registrazione, spazio e batteria; in Avanzata dispositivo, qualità e bitrate, buffer, archivio, time-lapse, schermo nero, collegamento e ID. Sulla dashboard in Avanzata anche schermo del telefono, orientamento, "Camera reale" e "Copia link di questa camera".

**Decisioni prese:**
- Contesto: il montatore deve avere tutte le informazioni nel nome del file. Decisione: nome = numero assegnato dalla regia + nome scelto dal telefono + data e ora. Alternative scartate: solo nome del telefono (duplicati) o solo numero (si perde l'informazione scelta sul telefono).
- Contesto: codice a 8 caratteri. Decisione dell'utente: rimandato al primo test esterno, con un nuovo account Supabase dedicato (da ricordargli quando sarà il momento).

**File consegnati/modificati:** docs/dashboard.html (r23), docs/camera.html (r24); documento v37.

---

### [2026-11-18 21:00] QR per aggiungere un telefono e conferma accetta/rifiuta

**Riepilogo:** la dashboard (r22) mostra un QR che apre la pagina camera già collegata e, con una spunta decisa dalla regia, chiede conferma (Accetta / Rifiuta) prima di far entrare un telefono nuovo; camera r23 mostra l'esito.

**Cosa è stato fatto:**
- Libreria `docs/qr.js` (qrcode-generator, MIT, copiata nel repository). Pannello "Aggiungi un telefono" in home: pulsante Mostra/Nascondi QR (340 px, correzione errori bassa), "Copia link", spunta "Chiedi conferma prima di far entrare un telefono nuovo" (accesa di default, salvata nel browser). Il link include `?dev=1` se la dashboard è aperta con `?dev=1`.
- Conferma: un telefono sconosciuto non entra nell'elenco ma compare in una barra "“nome” vuole entrare" (modello, sistema, batteria, spazio) con Accetta e Rifiuta. Se la spunta è spenta, entra subito; spegnendola le richieste in attesa sono accettate. I telefoni già conosciuti rientrano da soli.
- Rifiuto: il telefono è ricordato come rifiutato (salvato nel browser), la camera mostra "NON accettata dalla regia", sospende l'invio dello stato (un segnale ogni 5 s) e la regia lo ignora; "Dimentica i rifiutati" permette di riprovare.
- Comando `join_result` regia → camera; riga "Regia" nello stato della camera (collegamento…, accettata, in attesa, non accettata).
- Prove in Chromium (camera e dashboard simulate): richiesta → Accetta → camera in elenco; richiesta → Rifiuta → non in elenco e non ricompare; Dimentica rifiutati → ricompare e si accetta; conferma spenta → entra subito; QR decodificato con una libreria di lettura (link da 143 e da 652 caratteri), identico. Regressione del trasferimento ok.

**Limiti noti:** il rifiuto è lato regia (chi ha il link può ancora inviare messaggi sul canale; la regia li ignora). La sicurezza vera è il canale segreto nel link. Il codice a 8 caratteri non c'è ancora: serve una tabella e la scelta del progetto Supabase.

**File consegnati/modificati:** docs/dashboard.html (r22), docs/camera.html (r23), docs/qr.js (nuovo); documento v36.

**Impatto su Pipeline:** Step 11 (uso pubblico): iniziato con QR e conferma; mancano codice a 8 caratteri, nome e permessi nella camera, sessioni con scadenza.

---

### [2026-11-18 20:00] Misura della memoria dell'iPad e verso il test interno

**Riepilogo:** aggiunto il pulsante "Misura memoria di questo dispositivo" (dashboard r21, solo Avanzata) e impostata la direzione del test interno con dashboard e camere da sviluppatore: strumenti di precauzione in Avanzata, strumenti utili al test in Base, log sempre attivi.

**Cosa è stato fatto:** il pulsante tiene in memoria blocchi da 256 MB fino a 4 GB, come i file ricevuti senza cartella, rilegge un pezzo per ogni passo e scrive un log (inviato prima del passo successivo). Se la pagina viene chiusa dal sistema, alla riapertura il registro riporta l'ultimo valore retto ("la prova di memoria precedente si è interrotta dopo X MB"). Provata in Chromium con tetto ridotto.

**Decisioni prese:**
- Contesto: per i test interni servono tutti gli strumenti disponibili, per il pubblico solo quelli utili. Decisione: link da sviluppatore con log sempre attivi (`?dev=1`, invio anche in Base); separare gli strumenti di precauzione (Avanzata) da quelli realmente utili al test (Base). Il tetto di 1,5 GB di memoria resta una stima: si imposta dopo la misura reale sull'iPad.

**File consegnati/modificati:** docs/dashboard.html (r21); documento v35.

---

### [2026-11-18 19:00] Protezione della regia, punti 2 e 3: disco pieno e memoria dell'iPad

**Riepilogo:** la dashboard (r20) gestisce il disco pieno (pausa, scelta di un'altra cartella, ripartenza da sola) e mette un tetto di 1,5 GB ai file che sull'iPad restano in memoria in attesa di Salva.

**Cosa è stato fatto:**
- Disco pieno (QuotaExceededError in scrittura): il trasferimento passa a "interrotto" con la nota "Libera spazio o scegli un'altra cartella (Cambia cartella): riparto da solo"; se nel frattempo si cambia cartella il trasferimento usa la nuova e riparte da solo. Il file resta sul telefono.
- Memoria (modalità "questo dispositivo"): tetto `MEMMAX` 1,5 GB sui file arrivati e non ancora salvati; un nuovo trasferimento che lo supererebbe non parte ("tocca Salva sui file arrivati, poi riprova"; i file restano sul telefono); riga "In memoria da salvare: X su Y" nel pannello File, in rosso oltre il 70%; avviso per un singolo file più grande del tetto. Stima della dimensione di una clip arrotondata per eccesso a 1 MB (la camera invia i MB interi).
- Prove in Chromium (tetto ridotto per il test): il secondo file non parte finché il primo non è salvato, poi parte; disco pieno → pausa → cambio cartella → file arrivato nella nuova, nulla nella vecchia. Regressioni t26 e t33 ok.

**Decisioni prese:**
- Contesto: lo spazio libero di una cartella su disco esterno non è leggibile dal browser (la stima del browser riguarda il profilo, non il disco). Decisione: niente controllo preventivo sullo spazio del disco, si rileva il disco pieno alla scrittura e si gestisce con pausa e cambio cartella. Alternative scartate: usare navigator.storage.estimate (darebbe falsi allarmi o falsa sicurezza). Da rivedere se: un browser espone lo spazio libero delle cartelle scelte.

**File consegnati/modificati:** docs/dashboard.html (r20); documento v34. Camera invariata (r22).

**Impatto su Pipeline:** Step 6, parte D: fatti i punti 1, 2 e 3; resta la modalità "i file restano sui telefoni" (4).

---

### [2026-11-18 18:00] Protezione della regia, punto 1: cartella non raggiungibile

**Riepilogo:** la dashboard (r19) verifica con una scrittura reale che la cartella dei file sia raggiungibile e, se il disco sparisce o si riempie, mette in pausa i trasferimenti e riparte da sola al ritorno, senza perdere nulla.

**Cosa è stato fatto:**
- `Dest.check()`: scrive e cancella un piccolo file di prova nella cartella (permesso, disco scollegato, disco pieno); eseguita al caricamento, alla scelta della cartella, ogni 15 s (non durante un trasferimento in corso) e prima di ogni trasferimento.
- Prima di iniziare: se la cartella non risponde nessun trasferimento parte, il registro lo dice e i file restano sui telefoni; anche l'automatico non parte.
- Durante il trasferimento: gli errori della destinazione (marcati `err.sink` in xfer.js) non contano come errori di rete; il file parziale viene scartato, il trasferimento passa a "interrotto" con nota ("Riconnettila: riparto da solo. Il file resta sul telefono"), controlla la cartella ogni 4 s e ricomincia da capo appena torna (la clip è ancora sul telefono, eliminata solo dopo la verifica).
- Interfaccia: riga di stato sotto la cartella (✓ raggiungibile / ⚠ motivo), pulsante "Verifica cartella" (serve anche per rinnovare il permesso con un tocco), riga sulla cartella nel "Controllo prima di iniziare".
- Prove in Chromium con cartella finta: disco scollegato prima di iniziare (nessun job, clip intatte); disco che sparisce a metà (stato interrotto, clip sul telefono, poi file identico per byte e clip eliminata solo dopo l'arrivo). Regressioni t26 e t31 ok.

**Limiti noti:** lo spazio libero di un disco esterno non è leggibile dal browser: il disco pieno si scopre solo scrivendo. Un guasto lungo fa solo ricominciare il file da zero (non riprende a metà), perché il file parziale va scartato.

**File consegnati/modificati:** docs/dashboard.html (r19), docs/xfer.js (errori di destinazione marcati); documento v33. Camera invariata (r22).

**Impatto su Pipeline:** Step 6: parte D, punto 1 fatto; restano spazio sulla regia (2), memoria iPad (3), modalità "i file restano sui telefoni" (4), riga regia nel controllo iniziale (5, in parte fatta per la cartella).

---

### [2026-11-18 17:00] Avviso anteprima: nessun file perso

**Riepilogo:** l'avviso della spunta sull'anteprima (dashboard r18) ora dice che i file non si perdono: restano sul telefono finché non sono arrivati e verificati e il trasferimento riprende da dove si era fermato.

**File consegnati/modificati:** docs/dashboard.html (r18); documento v32.

---

### [2026-11-18 16:40] Anteprima durante i trasferimenti: scelta con avviso

**Riepilogo:** la sospensione dell'anteprima durante i trasferimenti, prima fissa, ora è una spunta decisa dall'utente (dashboard r17), accesa di default con avviso sul rischio per la rete.

**Cosa è stato fatto:** spunta "Tieni l'anteprima accesa durante i trasferimenti" nel pannello File di ogni camera; accesa = anteprima sempre attiva con avviso "con rete debole il trasferimento può rallentare o interrompersi"; spenta = comportamento precedente (anteprima sospesa e ripresa a fine trasferimento). Scelta salvata nel browser (gdc.xprev). Provata in simulazione.

**Decisioni prese:**
- Contesto: l'utente considera un problema perdere l'anteprima durante i trasferimenti. Decisione: decidibile, default acceso con avviso. Supera la decisione del: 2026-11-17 (anteprima sospesa durante i trasferimenti, fissa). Da rivedere se: i test su rete debole mostrano trasferimenti che falliscono con l'anteprima accesa (allora default spento).

**File consegnati/modificati:** docs/dashboard.html (r17); documento v31.

---

### [2026-11-18 16:00] Misura spazio iPhone 15 e trasferimento automatico con buffer a rotazione

**Riepilogo:** la misura sull'iPhone 15 ha scritto 4 GB senza errori (quota dichiarata 39 GB) e la camera è passata da 700 MB prudenti a 3642 MB; la dashboard (r16) ora trasferisce da sola ogni clip pronta nella cartella scelta e, con "elimina dal telefono", tiene sul telefono solo ciò che non è ancora arrivato.

**Cosa è stato fatto:**
- Letti i log della misura (camera r22, iPhone 15, Safari 27.2): 4096 MB scritti in 32 s, quota 39322 MB, usato tornato a 0 dopo la pulizia; livello spazio da "crit" (circa 4 min) a "ok" (circa 25 min). Il tetto del test (4 GB) è un minimo, non il limite reale.
- Dashboard r16: spunta "Trasferisci da solo ogni clip appena fermo la registrazione" (spenta di default, richiede una cartella di questo computer, non attiva in modalità "questo dispositivo"). Parte la clip più vecchia pronta quando la camera non registra e non ha un time-lapse in corso; al massimo 2 camere in parallelo, una clip per volta per camera; dopo un errore riprova dopo 1, poi 2 minuti, poi si ferma (3 tentativi) e lascia il pulsante manuale; se la cartella perde il permesso lo segnala nel registro senza insistere; un annullamento manuale non viene ritentato.
- Buffer a rotazione = automatico + "Elimina dal telefono dopo il trasferimento verificato": il telefono tiene solo le clip non ancora arrivate.
- Prove in Chromium (camera e dashboard simulate, cartella finta): con automatico spento non parte nulla; acceso, le clip arrivano, sono eliminate dal telefono e finiscono nella cartella; durante una ripresa non parte nessun trasferimento; a ripresa finita partono. Regressione del trasferimento con ripresa dopo caduta (t26) ok, byte identici.

**Decisioni prese:**
- Contesto: serviva decidere dove far partire l'automatico. Decisione: sulla dashboard (che ha la cartella e il permesso), non sulla camera. Alternative scartate: automatico verso la memoria dell'iPad (riempirebbe la memoria e richiede un tocco per salvare). Da rivedere se: si implementa il salvataggio automatico su iPad o il cloud.

**File consegnati/modificati:** docs/dashboard.html (r16); documento-sessione-video-system-gdc-studio.md (v30). Camera invariata (r22).

**Impatto su Vision/Pipeline:** Step 6 (trasferimento): aggiunta nelle note la parte automatica; restano da fare invio durante la ripresa (C), protezioni della regia (D), cloud per Pro (E).

---

### [2026-11-18 14:00] Gestione dello spazio: minuti rimasti, controllo prima di iniziare, arresto sicuro, liberazione facoltativa (camera r22, dashboard r15)

**Riepilogo:** il titolare ha posto il problema dello spazio (telefoni pieni, dispositivo di controllo pieno) per l'uso da parte di terzi; implementato il primo blocco: ogni camera sa quanto può ancora registrare, la regia lo mostra con avvisi e un "Controllo prima di iniziare", la camera si ferma in modo sicuro prima di finire lo spazio e una spunta (spenta di default) permette di liberare spazio eliminando solo clip già trasferite e verificate.

**Decisioni prese:**
- Contesto: i video pesano molto (1080p: circa 60 MB/min a 8 Mbps, 150 MB/min a 20 Mbps, 300 MB/min a 40 Mbps) e su web lo spazio disponibile è la quota del browser, non il disco del telefono (iPhone XR: circa 0,78 GB; Android Chrome: circa 10 GB stimati; iPhone 15: da misurare).
- Decisione: principio fisso "mai eliminare dal telefono un video non ancora arrivato e verificato"; comportamento predefinito quando lo spazio finisce = fermarsi in modo sicuro e avvisare; la liberazione automatica delle clip più vecchie già verificate è una spunta per camera, spenta di default.
- Alternative scartate: eliminare in automatico di default (perde la copia sul telefono); fermarsi senza margine (rischio di file danneggiati).
- Da rivedere se: la misura reale sull'iPhone 15 mostra una quota molto più ampia (alzare il limite) o il web risulta insufficiente (app nativa).

**Cosa è stato fatto:**
- Camera r22: calcolo dello spazio disponibile = minimo tra quota del browser meno una riserva di 200 MB e il limite (misurato o prudente di 700 MB su iOS e dove manca la stima), conteggiando anche le clip già trasferite che occupano ancora spazio; livelli ok/attenzione/critico (sotto 15 e 5 minuti, oppure 80% e 95% del disponibile); controllo ogni 8 s; arresto sicuro di REC e time-lapse sotto 30 MB; rifiuto di avviare REC con meno di 1 minuto disponibile; comando `space_cfg` per la spunta; pulsante in Avanzata "Misura spazio reale" (scrive fino a 4 GB in un archivio di prova, poi lo elimina e ricorda il valore).
- Dashboard r15: minuti rimasti nelle schede, nel riepilogo ("Spazio minimo") e nel dettaglio con colore, spunta "elimina le clip più vecchie già trasferite e verificate", pannello "Controllo prima di iniziare" (collegamento, batteria, spazio, verdetto) in home, voci nel registro quando lo spazio scende.
- Provato in Chromium con camera e dashboard simulate e con la stima della quota sostituita da valori di prova: livelli corretti; REC rifiutato con poco spazio; con la spunta spenta non si elimina nulla, con la spunta accesa si eliminano solo le clip "inviata" e resta la "pronta"; arresto sicuro in registrazione con file salvato; misura con tetto ridotto completata.

**Da fare:** misurare lo spazio reale sull'iPhone 15 (pulsante in Avanzata); trasferimento automatico dopo ogni clip e buffer a rotazione; invio durante la ripresa per sessioni lunghe; protezione della regia (cartella piena, memoria iPad); modalità "i file restano sui telefoni".

**File consegnati/modificati:** `docs/camera.html` (r22), `docs/dashboard.html` (r15), `documento-sessione-video-system-gdc-studio.md`.

---

### [2026-11-18 12:30] Uso da parte di terzi: separazione developer/pubblico, mockup e primi utenti

**Riepilogo:** impostata la separazione tra link developer e uso pubblico, disegnati 8 mockup del flusso (telefono e regia) e fissate le prime decisioni; individuati i primi utenti reali (attività di esperienze) e le implicazioni per il prodotto.

**Decisioni prese:**
- Contesto: aprire il sistema a terzi senza esporre strumenti da sviluppatore né le chiavi nei link.
- Decisione: nuovo percorso pubblico (scelta ruolo, sessione con QR e codice, accettazione dalla regia a scelta con interruttore, scadenza della sessione); il link attuale resta developer. QR e codice scritto insieme.
- Alternative scartate: account obbligatorio fin dall'inizio (rimandato alla fase Pro); codice breve non indovinabile solo se lungo e con scadenza.
- Da rivedere se: servono limiti Gratis/Pro applicabili (servono account e controlli lato server), o la sicurezza dei canali pubblici non basta (canali privati con autenticazione).

**Implicazioni emerse per i primi utenti (da valutare nei test):** postazioni fisse sempre accese (escape room, locali): collegamento permanente senza scadenza, riconnessione automatica, alimentazione, schermo sempre acceso; preset per attività (go-kart POV al petto in 9:16, panoramiche fisse, bar e discoteche con luce scarsa e torcia/bilanciamento); marcatura dei momenti durante la ripresa per ritrovare i migliori; personalizzazione con logo e colori dell'attività; consenso e privacy dei clienti ripresi.

**File consegnati/modificati:** tela di lavoro con i mockup (8 schermate); `documento-sessione-video-system-gdc-studio.md`.

**Impatto su Vision/Pipeline:** Vision con i primi utenti terzi; nuovo Step 11.

---

### [2026-11-18 10:30] Prova su Android (Pixel 8 Pro): batteria dal browser, controlli completi della camera, anteprima ok

**Riepilogo:** il telefono Android si è collegato con il link di prova (sessione `261117-1529-fpf3`, camera r21): batteria letta dal browser e visibile sulla dashboard, anteprima a 31 fps su rete mobile, e la sonda mostra controlli molto più ampi di iPhone (zoom 1-30×, messa a fuoco manuale, ISO, tempo di posa, bilanciamento del bianco, torcia).

**Cosa è stato fatto (risultati della sonda):**
- **Dispositivo:** Pixel 8 Pro, Chrome 157 (Chromium 157.0.8103.78), sistema indicato dal browser 17.0.0 (lo User-Agent ridotto dice Android 10), 9 core, 8 GB, schermo 448×998@2,25, italiano. Rete: mobile 4G, stima 1,45 Mbps, RTT 300 ms.
- **Batteria:** `getBattery` presente: 77%, in carica; sulla dashboard `batt=77`.
- **Funzioni:** Wake Lock (attivo, rilasciato dal sistema e riottenuto), condivisione file, `showDirectoryPicker` e `showSaveFilePicker`, Bluetooth, vibrazione, WebRTC, `requestVideoFrameCallback`, `captureStream`, IndexedDB; quota di archivio stimata 10 GB.
- **Registrazione:** MediaRecorder con mp4 (avc1 + AAC), webm vp9/vp8/h264; codec WebRTC VP8, H264, AV1, VP9, H265.
- **Camera posteriore ("camera 0, facing back"):** zoom 1-30× (passo 0,1), torcia, messa a fuoco manuale/singola/continua con distanza 0,105-5,9, tempo di posa 0,26-160000 (unità del browser), ISO 21-10666, compensazione esposizione ±4, esposizione manuale, bilanciamento del bianco manuale con temperatura 2850-7000 K, frame rate fino a 60, risoluzione fino a 4080×3072; anche camera anteriore e tre ingressi audio (mono, 48 kHz).
- **Anteprima verso l'iPad:** connessione diretta (prflx→srflx), 406×720 a 31 fps, 270-630 kbps, RTT 130-240 ms, nessun pacchetto perso; apertura della camera 14,4 s la prima volta (permessi), 0,4-1,9 s dopo. 4K aperto senza errori (non misurati fps in ripresa).
- Durante la prova qualcuno ha cambiato qualità (4K e 1080p) e fermato/riavviato la camera dalla pagina.

**Cosa è emerso per il prodotto:**
- Android con Chrome dà la batteria senza Comandi; iPhone no (Safari non espone `getBattery`).
- Il pannello Zoom della dashboard dovrebbe funzionare su Android da 1× a 30× (non provato dal vivo); i controlli manuali (fuoco, ISO, posa, bilanciamento, torcia) aprono la strada a un pannello "Controlli pro" generato dalle capacità del dispositivo (iPhone 15 con Safari 27.2 espone torcia, distanza di fuoco, bilanciamento manuale e zoom).
- Non ancora provati su Android: REC, trasferimento file, zoom da dashboard.

**File consegnati/modificati:** `documento-sessione-video-system-gdc-studio.md`.

---

### [2026-11-18 10:00] Link di prova per un telefono Android (camera r21)

**Riepilogo:** preparato un link che, aperto su un telefono Android altrui, invia da solo i log tecnici con una sonda completa del dispositivo (modello, browser, rete, funzioni disponibili, controlli della camera, formati di registrazione, batteria dal browser), perché c'è una sola prova a disposizione.

**Cosa è stato fatto:**
- `dev.js`: parametro `?dev=1` nel link = invio dei log anche in modalità Base (nessuna scelta da fare sul telefono), con avviso "Modalità prova" sulla pagina.
- Camera r21: parametri `?name=` e `?device=` per nominare la camera dal link; sonda all'avvio in 4 righe (identità e schermo con User-Agent Client Hints, rete, funzioni del browser, formati del registratore/codec WebRTC/quota di archivio) e sonda dopo l'apertura della camera (capacità e impostazioni della traccia video e audio, dispositivi multimediali), chiusa dalla riga "=== SONDA DISPOSITIVO COMPLETATA ==="; Wake Lock dello schermo quando disponibile (anche su iPhone con Safari recente) con log; ricerca batteria dal browser già in r20.
- Provato in Chromium con profilo Pixel 7: le righe di sonda arrivano alla tabella dei log, camera chiamata "Android" con id `android1`, API batteria presente.

**File consegnati/modificati:** `docs/camera.html` (r21), `docs/dev.js`, `documento-sessione-video-system-gdc-studio.md`.

---

### [2026-11-17 18:20] Verificato: niente API batteria su Safari 27.2 (iPhone 15)

**Riepilogo:** la sonda della camera r20 ha registrato `navigator.getBattery` assente su iPhone 15 (Safari 27.2, iOS 18.7); la batteria su iPhone resta affidata a Comandi. Il titolare proverà più avanti ad aprire la camera da un altro browser.

**Cosa è stato fatto:**
- Lettura del log: `API batteria del browser (navigator.getBattery): assente {"versione":"Version/27.2","os":"iOS 18.7"}`.
- Registrato come test da fare: camera aperta da Chrome su Android (API attesa presente). Nota: su iPhone tutti i browser usano il motore di Safari, quindi Chrome iOS non dovrebbe cambiare il risultato.

**File consegnati/modificati:** `documento-sessione-video-system-gdc-studio.md`.

---

### [2026-11-17 18:00] Chiarito il test batteria: sonda sull'API del browser (camera r20)

**Riepilogo:** il titolare voleva sapere se Safari più recente (iPhone 15) invia la batteria da solo rispetto all'iPhone con Safari vecchio; la scorciatoia di Comandi non è ancora stata creata. Il pulsante "Prova invio batteria" non leggeva la batteria (provava solo il canale). Aggiunta una sonda che registra se `navigator.getBattery` esiste e, se c'è, la usa.

**Cosa è stato fatto:**
- Ricerca: `navigator.getBattery()` non è supportata da Safari né da Safari su iOS (nessuna novità trovata per il 2026, fonti non datate 2026); Chrome sì dal 38, Firefox no.
- Camera r20: all'avvio registra "API batteria del browser: presente/assente" con versione di Safari e iOS; se presente legge livello e carica e li aggiorna con gli eventi `levelchange` e `chargingchange` (sorgente "browser"). Provato in Chromium (livello 100, in carica). Da verificare sull'iPhone 15: se l'API è assente, resta Comandi.

**File consegnati/modificati:** `docs/camera.html` (r20), `documento-sessione-video-system-gdc-studio.md`.

---

### [2026-11-17 17:40] Batteria "50" sulla dashboard: era il valore di prova del pulsante, non Comandi (camera r19)

**Riepilogo:** la dashboard mostrava 50% con il telefono al 69%; il 50 era un valore segnaposto inviato dal pulsante "Prova invio batteria", mentre dalla scorciatoia di Comandi non è ancora arrivata nessuna richiesta.

**Bug: batteria 50% finta salvata dal pulsante di prova**

**Sintomo:** dashboard a 50% con batteria reale 69%.
**Causa:** il pulsante "Prova invio batteria" inviava `bat.level ?? 50` come se fosse una misura di Comandi, e la camera lo salvava e lo ripubblicava (log 15:11-15:12: "batteria da Comandi: 50%", HTTP 202). Il percorso browser → Supabase → camera → dashboard funziona, ma il valore era finto. Nei registri Supabase non risulta ancora nessuna richiesta da Comandi/Shortcuts.
**Fix applicato:** il pulsante ora invia un evento con `test: true` che la camera riceve e registra senza salvarlo; ripristino una tantum del livello salvato sul telefono (chiave `gdc.batfix1`). Provato in Chromium con camera e dashboard simulate: evento di prova ignorato, evento reale (69) salvato e mostrato sulla dashboard. Da verificare con la scorciatoia vera.

**File consegnati/modificati:** `docs/camera.html` (r19), `documento-sessione-video-system-gdc-studio.md`.

---

### [2026-11-17 17:10] Trasferimento riuscito su hardware reale; batteria da Comandi: nessuna richiesta arrivata

**Riepilogo:** il trasferimento con ripresa funziona sull'iPhone 15 e sull'iPad anche con rete pessima (file verificato, qualità ottima); per la batteria dai log e dai registri di Supabase non risulta alcuna richiesta di Comandi, né sul progetto nuovo né sul vecchio.

**Cosa è stato fatto:**
- Log del trasferimento (camera r18, dashboard r13): 6 interruzioni per "nessun dato / nessuna risposta per 25-30 secondi", riprese a 1 140 000, 2 640 000 e 4 440 000 byte con controllo CRC ok; i 6 tentativi automatici sono finiti alle 14:54:26, il titolare ha premuto "Riprendi" e alle 14:55:00 il file da 6 577 081 byte era completo e verificato. Nessun "già in corso".
- Modifica: i tentativi automatici si azzerano ogni volta che si avanza (dashboard r14): il limite di 6 vale per tentativi consecutivi senza progresso.
- Batteria: nei log delle pagine nessuna riga di batteria (`rx battery`, `setBat`, "Prova invio batteria"); nei registri `edge_logs` del progetto GDC-project 2 tutte le richieste a `/realtime/v1/api/broadcast` (274 POST, 3 OPTIONS tra 13:16 e 13:54 UTC) vengono dal browser dell'iPhone (messaggi di stato inviati via REST quando il WebSocket è giù, 202), nessuna da Comandi/Shortcuts; nessuna richiesta nemmeno sul progetto GDC-WEBAPP.
- Possibili cause da verificare: scorciatoia non eseguita o fallita prima dell'invio, URL o chiave del vecchio progetto (i dati per Comandi vanno ricopiati dal pulsante "Dati per Comandi (batteria)" della camera, perché il canale e il progetto sono cambiati), ritardo dei registri.

**File consegnati/modificati:** `docs/dashboard.html` (r14), `documento-sessione-video-system-gdc-studio.md`.

---

### [2026-11-17 16:20] "Un altro trasferimento è già in corso" a ogni ripresa: invio rimasto appeso (camera r18, dashboard r13)

**Riepilogo:** durante una caduta di rete la camera lasciava un vecchio invio "appeso" e rifiutava tutti i tentativi di ripresa con "un altro trasferimento è già in corso"; corretto il ciclo di invio, la classificazione degli errori e i doppioni nei log.

**Bug: tentativi di ripresa rifiutati dalla camera**

**Sintomo:** dopo la caduta della connessione (14:34:01-09 `disconnected` → `failed`) i 6 tentativi automatici della dashboard ricevevano tutti "un altro trasferimento è già in corso" dalla camera, nonostante fosse la stessa registrazione.
**Causa:** su iOS (Safari 27.2) il canale dati risultava ancora "open" dopo la caduta della connessione ICE; il vecchio invio continuava ad accodare dati (log 14:35:11: "0,4 MB consegnati in 80 s, in coda 2057 KB") e il ciclo di invio non controllava mai l'interruzione richiesta dal nuovo tentativo, quindi `xferBusy` restava impostato. Contributo minore: gli errori segnalati dalla camera (anche quelli di rete) erano trattati come definitivi.
**Fix applicato:** ogni interruzione ora sveglia e ferma il ciclo di invio (flag `dead` e `wake`), la camera attende fino a 8 s la fine del vecchio invio, e solo gli errori sulla registrazione (non trovata, senza dati, ancora in registrazione) sono definitivi. Provato in Chromium con un canale che resta aperto ma non consegna più nulla: il vecchio invio termina, la ripresa parte dal byte 121 222 con CRC ok, file identico (SHA-256). Da verificare sull'iPhone.

**Altro:**
- Righe di log duplicate (identiche allo stesso millisecondo) da invii ripetuti dopo una risposta persa: aggiunto un numero di riga per sessione (`n`) e un controllo nel database (`gdc_dev_logs_dedupe`, scarta le righe già presenti; la chiave pubblica non può leggere nulla). Migrazioni applicate a GDC-project 2.
- Dai log: la camera segnala "traccia video silenziata dal sistema" (14:34:53 e 14:36:08): iOS ha sospeso o silenziato la camera durante il trasferimento, probabile effetto del carico e della rete debole; da tenere d'occhio.
- Velocità osservate: 0,2-0,5 Mbps nei primi secondi, poi caduta; rete del telefono insufficiente per il test.

**File consegnati/modificati:** `docs/xfer.js`, `docs/camera.html` (r18), `docs/dashboard.html` (r13), `docs/dev.js`, `documento-sessione-video-system-gdc-studio.md`; database GDC-project 2 (colonna `n`, indice univoco, trigger di deduplica).

---

### [2026-11-17 15:00] Trasferimento su rete molto lenta: funziona e verifica, ora con ripresa automatica (camera r17, dashboard r12)

**Riepilogo:** sul telefono con connessione molto debole il trasferimento funziona (5 MB della prova verificati con CRC a 0,5 Mbps) ma la clip da 28 MB si è fermata quando la camera ha perso il collegamento; aggiunta la ripresa automatica dal punto raggiunto e una coda più piccola per misurare la velocità reale.

**Cosa è stato fatto:**
- Lettura dei log (ora vera `t_ms`; iPad ancora su dashboard r10 per la cache): prova di velocità consegnata e verificata, 5 242 880 byte in 90 s = 0,5 Mbps; l'avanzamento sul ricevente mostrava 0,85 → 0,47 Mbps. Il mittente dichiarava 5,2 Mbps perché misurava i byte accodati (coda 4 MB), non quelli arrivati.
- Clip reale da 28,4 MB: canale aperto dopo 17 s (segnalazione lenta), 0,05-0,07 Mbps iniziali, poi la camera ha perso il collegamento a Supabase (`invio state: timed out/error`) e i log si interrompono: nessun errore di software, caduta di rete.
- Nuove funzioni: ripresa automatica con controllo CRC32 (fino a 6 tentativi, poi "Riprendi da X MB"), coda di invio da 1 MB, velocità misurata sui byte consegnati, nuovo tentativo per la stessa registrazione che sostituisce quello rimasto appeso sulla camera.
- Provato in Chromium simulando la caduta del canale a metà file: SHA-256 identico in memoria e verso cartella simulata.

**Decisioni prese:**
- Contesto: la rete del telefono cade durante i trasferimenti.
- Decisione: riprendere dal byte raggiunto invece di ricominciare, con verifica CRC32 del tratto già ricevuto.
- Alternative scartate: ricominciare da zero a ogni caduta; nessuna ripresa.
- Da rivedere se: la ripresa dopo la chiusura della pagina dashboard diventa necessaria (oggi lo stato vive solo finché la pagina resta aperta).

**File consegnati/modificati:** `docs/xfer.js`, `docs/camera.html` (r17), `docs/dashboard.html` (r12), `documento-sessione-video-system-gdc-studio.md`.

---

### [2026-11-16 15:10] Prima prova del trasferimento su rete lenta; avanzamento nei log, prova a tempo, anteprima sospesa

**Riepilogo:** la prova di velocità da 30 MB su un telefono con connessione molto lenta è stata annullata dal titolare; nei log il collegamento diretto si stabilisce bene ma mancava il conteggio dei byte, quindi ho aggiunto l'avanzamento nei log, reso la prova a tempo e sospeso l'anteprima video durante i trasferimenti (camera r16, dashboard r11).

**Cosa è stato fatto:**
- Verificato che il Realtime funziona sul nuovo progetto "GDC-project 2" (sessioni camera e dashboard nella tabella dei log).
- Lettura dei log con l'ora vera dell'evento (`t_ms`; `ts` è l'ora di arrivo nel database e con un telefono lento inganna sull'ordine): comando `xfer_test` inviato 14:35:37.997, ricevuto dalla camera 14:35:40.076 (circa 2 s); canale dati aperto in 670 ms; percorso `srflx/prflx udp` (diretto, non relay, reti diverse); intestazione ricevuta dalla dashboard; nessun errore di trasferimento. Il trasferimento è finito per l'annullamento manuale a 14:36:37 ("canale chiuso durante l'invio").
- Contemporaneamente l'anteprima video verso la dashboard si disconnetteva più volte (RTT 130-1314 ms), la camera ci ha messo 24 s ad aprirsi, e la dashboard ha segnato la camera offline per mancanza di stato: collegamento del telefono molto debole.
- Non è possibile dire quanti byte siano passati: mancavano righe di avanzamento.
- Modifiche: avanzamento ogni 5 s nei log di mittente e ricevente (MB, Mbps, coda), prova di velocità limitata a 8 secondi (o 30 MB), anteprima sospesa mentre un trasferimento è attivo e ripresa alla fine.

**Bug: prova di rete troppo pesante su collegamento lento**

**Sintomo:** 30 MB non finiscono in tempo ragionevole su un telefono con rete lenta e instabile; l'utente annulla.
**Causa:** la prova inviava sempre 30 MB mentre l'anteprima video usava la stessa banda in uscita; collegamento debole (RTT fino a 1,3 s, ICE "disconnected").
**Fix applicato:** prova a tempo (8 s), anteprima sospesa durante i trasferimenti, avanzamento nei log. Da verificare con una rete migliore.

**File consegnati/modificati:** `docs/xfer.js`, `docs/camera.html` (r16), `docs/dashboard.html` (r11), `documento-sessione-video-system-gdc-studio.md`.

---

### [2026-11-15 18:40] Spostamento di tutto su Supabase "GDC-project 2"

**Riepilogo:** il canale in tempo reale e la tabella dei log passano dal progetto Supabase GDC-WEBAPP (`pnzabwfsgkvejnrtrjcp`, che contiene un'altra web app) al progetto "GDC-project 2" (`mjcnvpwjvwrucwjptgiu`), come chiesto dal titolare.

**Cosa è stato fatto:**
- Chiarito dove si usava Supabase: (1) canale Realtime (comandi, stato, segnali del trasferimento) scritto nei link di abbinamento; (2) tabella `gdc_dev_logs`. Nel codice non ci sono indirizzi o chiavi scritti a mano.
- Nel progetto "GDC-project 2" (contiene solo tabelle `thumb_*`): creata `gdc_dev_logs` con RLS (solo scrittura dalla chiave pubblica, nessuna lettura), pulizia automatica a 7 giorni; verificata con il ruolo anon.
- Dal progetto GDC-WEBAPP: rimossa soltanto `gdc_dev_logs` con la sua funzione di pulizia (4.951 righe di log di prova, 17 sessioni), senza toccare le altre tabelle. Le righe non sono state copiate: i risultati utili sono già nel documento.
- Rigenerati i link di abbinamento (canale nuovo, URL e chiave del nuovo progetto). I dispositivi devono aprire i nuovi link, che sostituiscono l'abbinamento memorizzato.
- Da verificare sui dispositivi: che il Realtime pubblico funzioni sul nuovo progetto (se compare un errore di canale, controllare nelle impostazioni Realtime del progetto che l'accesso pubblico sia consentito).

**Decisioni prese:**
- Contesto: il progetto GDC-WEBAPP è dedicato a un'altra web app.
- Decisione: tutto il sistema multicamera vive su "GDC-project 2".
- Da rivedere se: il progetto viene usato per altri scopi o il sistema diventa pubblico (servono account per utente e policy più strette).

**File consegnati/modificati:** `documento-sessione-video-system-gdc-studio.md`; database: tabella e funzione `gdc_dev_logs` create su GDC-project 2 e rimosse da GDC-WEBAPP.

---

### [2026-11-15 18:00] Trasferimento file: prima versione (camera r15, dashboard r10)

**Riepilogo:** i file registrati sul telefono si possono trasferire alla dashboard in diretta, con progress bar, verifica di integrità, destinazione a scelta (cartella del computer o memoria + Salva) e prova di velocità della rete.

**Cosa è stato fatto:**
- Nuovo `docs/xfer.js` (invio e ricezione con WebRTC data channel, CRC32, destinazioni cartella/memoria/nulla), integrato in camera r15 (comandi `xfer_start` e `xfer_test`, lettura dei pezzi dall'archivio uno alla volta, stato "inviata" o eliminazione dopo la verifica) e dashboard r10 (pannello File, coda "tutte le clip", Salva, Annulla, avvisi di chiusura).
- Test in Chromium con camera e dashboard simulate: due clip trasferite, SHA-256 identico alla copia sul telefono sia in memoria sia verso una cartella simulata; eliminazione dopo la verifica; prova di velocità 30 MB (37 Mbps nel test locale, percorso host/host).

**Decisioni prese:**
- Contesto: serviva un percorso per portare i file sul dispositivo madre senza passare da cloud.
- Decisione: trasferimento diretto sulla stessa rete (WebRTC), controllo di dimensione e CRC32 (WebCrypto non offre SHA incrementale), la cancellazione dal telefono solo dopo conferma e solo se l'utente lo sceglie.
- Alternative scartate: passare i file da Supabase o da un cloud (costo e lentezza); ripresa del trasferimento nella prima versione.
- Da rivedere se: la rete reale è lenta o isola i dispositivi (serve TURN o un relay), o i file diventano molto grandi per la memoria di iPad (serve scrittura su disco o suddivisione).

**File consegnati/modificati:** `docs/xfer.js` (nuovo), `docs/camera.html` (r15), `docs/dashboard.html` (r10), `documento-sessione-video-system-gdc-studio.md`.

**Impatto su Vision/Pipeline:** Step 6 passa a "in corso".

---

### [2026-11-15 16:30] Zoom ancora a scatti: la camera non era aggiornata; versione visibile in Avanzata

**Riepilogo:** nei log l'ultima prova di zoom risulta fatta con camera r12 (non r13): l'iPhone non aveva caricato la versione con l'interpolazione; addolcita ancora la curva (camera r14) e resa visibile la versione di ogni pagina in modalità Avanzata.

**Cosa è stato fatto:**
- Verifica dai log: sessione camera 15:11-15:13 con `camera r12` e dashboard r8; nessuna riga "zoom arrivato" (che scrive solo r13+). Il telefono usava ancora la pagina in cache.
- Camera r14: velocità massima 1,3 ln/s e costante di tempo 260 ms (da 1× a 5× in circa 1,3 s). Provato in Chromium con zoom simulato (salto massimo 7%).
- `dev.js`: in modalità Avanzata appare accanto all'interruttore il numero di versione della pagina (es. "camera r14"), per capire subito se la cache è stata aggiornata. Dashboard r9.

**File consegnati/modificati:** `docs/camera.html` (r14), `docs/dashboard.html` (r9), `docs/dev.js`, `documento-sessione-video-system-gdc-studio.md`.

---

### [2026-11-15 13:50] Zoom a scatti: interpolazione morbida sulla camera

**Riepilogo:** la prova dello zoom nativo sull'iPhone 15 conferma video corretto, zoom e audio presenti, ma con scatti; aggiunta sulla camera un'interpolazione morbida verso il valore richiesto (camera r13, dashboard r8).

**Bug: zoom a scatti**

**Sintomo:** durante il movimento dello slider (e con i pulsanti) lo zoom procede a gradini visibili nel video registrato.
**Causa:** i log mostrano comandi di zoom a salti di 0,3-0,9× ogni circa 150 ms (2,2 → 2,7 → 2,9 → 3,3…), applicati di colpo dalla camera. Possibile contributo non verificato: cambio di obiettivo fisico dell'iPhone alle soglie di zoom.
**Fix applicato:** la camera tiene un obiettivo di zoom e lo raggiunge con un passo in scala logaritmica (costante di tempo 140 ms, velocità massima 1,8 ln/s, circa da 1× a 5× in 0,9 s), applicando i valori in sequenza; la dashboard invia ogni 100 ms. Provato in Chromium con zoom simulato (salto massimo 7,5% per passo); da verificare sull'iPhone 15 (il registro scrive "zoom arrivato a N× in X ms (K passaggi)").

**File consegnati/modificati:** `docs/camera.html` (r13), `docs/dashboard.html` (r8), `documento-sessione-video-system-gdc-studio.md`.

---

### [2026-11-15 13:20] Registrazione diretta, REC ripetuta e zoom nativo dalla dashboard

**Riepilogo:** il test r11 sull'iPhone 15 conferma che il 4K diretto (senza canvas) regge 30 fps e che lo zoom nativo funziona anche a 4K e con l'anteprima; la REC normale registra bene due volte di fila, quindi il difetto riguarda solo il test; integrato il comando di zoom nativo nella dashboard (camera r12, dashboard r7).

**Cosa è stato fatto:**
- Test r11 (iPhone 15): 4K diretto fisso 30 fps / 20 Mbps, 2160×3840 con audio; zoom nativo 1→3× a 4K 30 fps (con WebRTC 29 fps); la seconda registrazione sullo stesso flusso nel test è vuota.
- Prova della REC normale dalla dashboard: due registrazioni consecutive valide (17,1 MB in 8 s e 19,5 MB in 9 s, nessun errore). La REC usa il tipo `video/mp4;codecs=avc1`, il test `...avc1,mp4a.40.2`: differenza possibile ma non verificata.
- Camera r12: comando `zoom` (nativo, clamp a min/max della traccia), stato con `zoom {native, min, max, cur}`, ripristino dello zoom dopo la riapertura della camera. Dashboard r7: pannello Zoom (slider + 0,5×, 1×, 2×, 3×, 5×), attivo solo se la camera lo espone. Provato in Chromium con zoom simulato (camera + dashboard in simulazione locale): comandi e stato corretti.

**Decisioni prese:**
- Contesto: serviva decidere come fornire lo zoom.
- Decisione: zoom nativo dove il browser lo offre (iPhone con Safari recente: 0,5-10×); sull'XR e dove manca il pannello resta disattivato con un avviso.
- Alternative scartate: zoom digitale su canvas a 4K (19-20 fps, non regge); registrare via canvas (richiede un percorso di registrazione diverso).
- Da rivedere se: serve lo zoom anche sull'XR (iOS 16): andrebbe fatto digitale e solo a 1080p, con un percorso di registrazione su canvas.

**File consegnati/modificati:** `docs/camera.html` (r12), `docs/dashboard.html` (r7), `documento-sessione-video-system-gdc-studio.md`.

---

### [2026-11-15 12:40] Test zoom r10 su iPhone 15: causa probabile del registratore vuoto e limite del 4K

**Riepilogo:** con un flusso della camera nuovo per ogni prova tutte le registrazioni sono valide; il ritaglio digitale regge a 30 fps in 1080p ma non in 4K (19-20 fps), lo zoom nativo a 1080p è perfetto; preparato il test r11 con registrazione diretta (senza canvas) anche in 4K.

**Cosa è stato fatto:**
- Risultati r10 (iPhone 15, iOS 18.7, Safari 27.2): 1080p 1×, 2× digitale e NATIVO 1→3×: 30 fps, file validi (13,9 / 5,8 / 17,7 Mbps). 4K con canvas: 19,7 / 19,1 / 18,6 fps (disegno 18-19 ms), file validi 13-17 Mbps. Due prove sullo stesso flusso di seguito, la seconda senza audio: file valido.
- **Bug (registratore senza dati sulla seconda prova con audio sullo stesso flusso):** la causa più probabile è l'audio del microfono già usato da un registratore precedente sullo stesso flusso; con flusso nuovo, o senza audio, funziona. Non ancora provata la seconda registrazione con audio sullo stesso flusso in modalità diretta (come la REC normale): è nel test r11.
- **Decisione provvisoria:** per lo zoom dalla dashboard sull'iPhone 15 si usa lo zoom nativo; il digitale a 4K non regge i 30 fps e resta solo un ripiego a 1080p (XR).

**File consegnati/modificati:** `docs/camera.html` (r11), `documento-sessione-video-system-gdc-studio.md`.

---

### [2026-11-15 12:10] Test zoom su iPhone 15: causa del blocco e dati su zoom nativo e 4K

**Riepilogo:** letti i log del test zoom (camera r9) sull'iPhone 15: lo zoom nativo funziona a 30 fps, ma il registratore produce file vuoti dalla seconda prova sullo stesso flusso della camera; il 4K con ritaglio su canvas si ferma a circa 22 fps. Preparata la camera r10 per isolare la causa.

**Cosa è stato fatto:**
- **Zoom nativo (Safari 27.2, iOS 18.7):** accettato e seguito durante la ripresa: da 1× a 3× in 6 s, zoom finale 2,96×, 29,9 fps, nessun fotogramma scartato. Intervallo zoom 0,5-10×.
- **1080p con ritaglio digitale:** 30 fps stabili, disegno 3,4 ms, 20-28 Mbps; la prova 1× è registrata e riproducibile.
- **4K con ritaglio digitale (canvas):** solo circa 22 fps (sorgente 22 fps, disegno 17 ms, intervalli p95 55 ms) anche a 1×: sull'iPhone 15 il ritaglio su canvas a 4K non regge i 30 fps. 4K 1× registrato: 9 MB in 6 s (12,6 Mbps).
- WebRTC: nella prova 4K + anteprima il registratore non ha prodotto dati e le statistiche in invio sono a zero (limitazione "bandwidth"), coerente con il registratore fermo.

**Bug: registratore senza dati dalla seconda prova sullo stesso flusso**

**Sintomo:** la prima prova dopo ogni apertura della camera registra bene; le successive sullo stesso flusso hanno file vuoto e `stop` che non arriva (timeout a 6 s), pur disegnando 30 fps.
**Causa:** non accertata. Sospetti: audio del microfono già usato da un registratore precedente (r8 senza clone e r9 con clone danno lo stesso esito), oppure stato del flusso della camera dopo la prima registrazione.
**Fix applicato:** nessuno definitivo. Camera r10: ogni prova apre un flusso nuovo, e due prove finali sullo stesso flusso (con audio, poi senza audio) per isolare la causa. Da verificare sull'iPhone 15.

**Impatto sul prodotto:** zoom comandato dalla dashboard = nativo dove il browser lo offre (iPhone con Safari recente), digitale su 1080p come ripiego (XR). A 4K il digitale non regge a 30 fps. Se la registrazione ripetuta sullo stesso flusso fallisce anche fuori dal test, serve capire come lo evita la REC normale (che registra direttamente il flusso della camera).

**File consegnati/modificati:** `docs/camera.html` (r10), `documento-sessione-video-system-gdc-studio.md`.

---

### [2026-11-15 11:50] Primo test sull'iPhone 15: log arrivati, zoom nativo, test zoom bloccato

**Riepilogo:** i log dell'iPhone 15 e dell'iPad arrivano nella tabella `gdc_dev_logs` e li leggo direttamente; sull'iPhone 15 (iOS 18.7, Safari 27.2) il browser offre zoom nativo, torcia e fuoco; il test zoom si è bloccato alla seconda prova e ho aggiunto una diagnosi per fase (camera r9).

**Cosa è stato fatto:**
- Verificata la scrittura vera dei log: sessioni di camera (iphone15) e dashboard presenti in tabella, lette con SQL.
- **Scoperta:** su iPhone 15 con Safari 27.2 le capacità della traccia includono `zoom` da 0,5 a 10, `torch`, `focusDistance` (min 0,15) e `whiteBalanceMode` manuale; `applyConstraints({advanced:[{zoom:2}]})` accettato e riportato nelle impostazioni. Non vale per l'XR (iOS 16, nessuno di questi controlli): lì resta lo zoom digitale.
- Prova 1 del test zoom (1080p, 1×): OK, 30 fps, intervalli p95 34 ms, 14,2 MB per 6 s (19,8 Mbps), file mp4 riproducibile con audio.

**Bug: test zoom fermo alla seconda prova**

**Sintomo:** dopo la prima prova nessuna riga per oltre 7 minuti; la pagina resta viva (stato inviato ogni 30 s).
**Causa:** non accertata. Sospetti: `play()` della seconda sorgente o `stop` del registratore che non si risolvono, oppure la traccia audio riusata dal registratore precedente.
**Fix applicato:** camera r9 con fasi registrate, timeout su play, stop e riproduzione, limite di durata per prova, traccia audio clonata per ogni prova, e nuova prova "zoom NATIVO 1×→3×". Provato solo in Chromium di prova (non riproduce il blocco): da verificare sull'iPhone 15.

**File consegnati/modificati:** `docs/camera.html` (r9), `documento-sessione-video-system-gdc-studio.md`.

---

### [2026-11-15 10:30] Direzione di prodotto, limiti di rete, modalità Base/Avanzata e log su Supabase

**Riepilogo:** valutato il mercato e il valore dell'idea (punti di forza: nessuna installazione, multi-dispositivo, file sul dispositivo madre con cartella a scelta), definiti i limiti di rete da affrontare e realizzata la modalità Base/Avanzata con invio facoltativo dei log a una tabella Supabase letta da Claude.

**Cosa è stato fatto:**
- Ricerca di app esistenti: Final Cut Camera + Live Multicam su iPad (gratis, fino a 4 angoli, richiede Final Cut Pro per iPad), Blackmagic Camera (gratis, multi-telefono Android), Unison (Apple, gratuita con acquisti in-app), MultiCameraSync (solo iPhone), Switcher Studio, Mevo Multicam, Camerama, Canon Live Switcher, 1Take Pro in beta. Prezzi e limiti non verificati.
- Valutazione di fattibilità e limiti: Safari non dà fuoco/zoom/esposizione reali; il Pro (4K, slow-mo) richiede probabilmente app nativa; il cloud e il TURN sono costi reali. Consigliato un confronto di 1-2 giorni con Unison e Final Cut Camera prima di investire in grafica/prodotto.
- Analisi dei limiti di rete: comandi via Supabase ok su qualsiasi rete; anteprima tra reti diverse richiede un server TURN (oggi solo STUN); i file voluminosi viaggiano meglio in diretta sulla stessa rete; Wi-Fi con isolamento dei client; iPad Safari non sceglie cartelle. Action cam (GoPro/Insta) da browser solo su PC Chrome/Edge, rimandate.
- Rigenerati i link di abbinamento (canale nuovo) per la prova con iPad (dashboard) e iPhone 15 (camera), perché il file con i vecchi link era andato perso. Non verificato quale versione serve GitHub Pages: il ramo `main` contiene solo il commit iniziale.
- Creata la tabella `gdc_dev_logs` (RLS: solo insert per la chiave pubblica; pulizia a 7 giorni); verificato con ruolo anon. Nuovo `docs/dev.js` con interruttore Base/Avanzata e invio a lotti; camera r8 e dashboard r6 lo usano. Test in browser di prova ok.

**Decisioni prese:**
- Contesto: evitare il giro "aggiorno, apro, provo, copio i log, incollo".
- Decisione: modalità Base/Avanzata unica per tutta la web app; in Avanzata i log possono andare in `gdc_dev_logs` e li leggo con gli strumenti Supabase. Resta a carico dell'utente premere i pulsanti sui dispositivi e ricaricare la pagina.
- Alternative scartate: nessun canale diretto verso i dispositivi (non possibile dalla sandbox); nessun invio automatico dei log in modalità Base.
- Da rivedere se: il prodotto diventa pubblico (servono account per utente al posto della chiave pubblica condivisa) o il progetto Supabase viene usato per altro.

**File consegnati/modificati:** `docs/dev.js` (nuovo), `docs/camera.html` (r8), `docs/dashboard.html` (r6), `documento-sessione-video-system-gdc-studio.md`; tabella `gdc_dev_logs` nel progetto Supabase.

**Impatto su Vision/Pipeline:** aggiunta la direzione di prodotto alla Vision; nuovo Step 10; note su Step 6.

---

### [2026-10-16 09:00] Test dello zoom digitale

**Riepilogo:** richiesto uno zoom comandabile dalla dashboard; sull'XR non esiste zoom nativo nel browser, quindi si valuta lo zoom digitale (ritaglio su canvas) con un pulsante di test sulla camera (r7) che scrive tutto nel registro avanzato.

**Cosa è stato fatto:**
- Risposta all'utente: zoom ottico non disponibile (già verificato: nessun vincolo zoom in Safari 16.3); possibile zoom digitale; in 4K un ritaglio 2× resta 1080p reale; costi: prestazioni, calore, audio da verificare.
- Camera r7: pulsante "Test zoom digitale". Controlla lo zoom nativo, poi registra 6 prove da 6 s (1080p 1×/2×; 4K 1×/2×/2× con anteprima WebRTC locale/zoom animato 1×→3×) misurando fps, tempi di disegno, regolarità, longtask, dimensione e riproducibilità del file, tracce audio. Riapre la camera alla fine.
- Verificato in Chromium (camera finta a 20 fps): il test gira e riapre la camera. Soglie di esito: fps ≥ 27, p95 intervalli ≤ 70 ms.

**Decisioni prese:**
- Contesto: l'utente vuole lo zoom dalla dashboard.
- Decisione: prima un test sull'XR, poi l'integrazione solo se regge.
- Da rivedere se: il test mostra fps bassi, surriscaldamento o audio non sincronizzato.

**File consegnati/modificati:** `docs/camera.html` (r7), `documento-sessione-video-system-gdc-studio.md` (versione 9).

---

### [2026-10-15 17:40] Batteria reale tramite Comandi

**Riepilogo:** la batteria arriva alla dashboard da Comandi (POST REST a Supabase Realtime), con ora della misura; aggiunta l'automazione all'apertura di Safari come lettura iniziale (camera r6).

**Cosa è stato fatto:**
- Camera r6: evento `battery` ricevuto dal canale (solo se l'id coincide), valore salvato in localStorage con l'ora e inviato nello stato; pulsanti per copiare i dati del comando e per provare l'invio dal browser.
- Dashboard: mostra "misurata alle HH:MM" accanto allo stato di carica.
- Verificato in simulazione locale: evento accettato per l'id giusto, ignorato per un altro id.

**Decisioni prese:**
- Contesto: la pagina non può leggere la batteria (nessuna API in Safari 16.3).
- Decisione: lettura iniziale con un'automazione "all'apertura di Safari" invece di un'icona che apre il link con il livello; stesso comando delle soglie.
- Alternative scartate: link con parametro `bat` (richiede aprire la camera da quell'icona).
- Da rivedere se: l'automazione all'apertura di Safari chiede conferma su iOS 16.3.1.

**File consegnati/modificati:** `docs/camera.html` (r6), `docs/dashboard.html`, `documento-sessione-video-system-gdc-studio.md` (versione 8).

---

### [2026-10-15 17:10] Time-lapse scattoso: nuova creazione del video

**Riepilogo:** il video del time-lapse web risultava più scattoso del nativo; corretta la cadenza di creazione del video (camera r5).

**Cosa è stato fatto:**

**Bug: video time-lapse scattoso**

**Sintomo:** rispetto al nativo il movimento appare a scatti.
**Causa:** nella creazione del video ogni immagine veniva letta, decodificata e disegnata, e solo dopo si attendeva 1/30 s. La creazione è durata circa 9 s per 145 immagini (attesi 4,8 s), con tempi tra fotogrammi irregolari. Causa dedotta dai tempi del registro, non misurata fotogramma per fotogramma.
**Fix applicato:** immagini decodificate 6 in anticipo; ogni fotogramma disegnato alla scadenza esatta e inviato al video con `requestFrame` (se disponibile). Se una scadenza è mancata, il video aspetta quella immagine invece di saltarla. Verificato in Chromium (80 immagini, video creato); da verificare sull'XR.

**File consegnati/modificati:** `docs/camera.html` (r5), `documento-sessione-video-system-gdc-studio.md` (versione 7).

---

### [2026-10-15 16:20] Prova del time-lapse sull'XR e specifiche

**Riepilogo:** il time-lapse automatico è stato provato sull'XR con esito positivo (video creato e salvato in Foto) e sono state ricavate dal registro le specifiche per scegliere il ritmo nelle riprese successive.

**Cosa è stato fatto:**
- Analisi del registro avanzato: modalità automatica, fps 30, JPEG 0,92, 1080×1920; 145 immagini in 72 s (una ogni 0,5 s, nessuna saltata, nessun errore); video di 4,8 s (×15), 19 MB, creazione in 9 s.
- Formula per regolarsi: velocità = intervallo × fps; intervallo = durata reale ÷ (durata video voluta × fps). Tabella di riferimento fornita all'utente (0,5 s ×15, 1 s ×30, 2 s ×60, 5 s ×150).
- Confermato dal registro che l'anteprima 720p dell'XR ora applica i parametri (fix r4) e che REC di tre telefoni insieme funziona.
- Osservazioni aperte: la pagina camera in background silenzia la camera e il telefono risulta offline (serve primo piano e blocco automatico "Mai"); i tre telefoni partono tutti con il nome "cam1" (da rendere unici); il PC risulta circa 0,67 s indietro rispetto ai telefoni.

**Decisioni prese:**
- Contesto: l'utente ritiene possibile che il ritmo di scatto fosse troppo alto.
- Decisione: nessuna modifica al codice; per ritmi più lenti si usa la modalità manuale. L'automatica resta com'è (emula iPhone: raddoppio dopo 10 minuti).
- Da rivedere se: i time-lapse lunghi riempiono il buffer o l'aspetto non convince (valutare qualità "Normale" o app nativa).

**File consegnati/modificati:** `documento-sessione-video-system-gdc-studio.md` (versione 6).

---

### [2026-10-15 15:35] Time-lapse e anteprime live nella home

**Riepilogo:** dal registro avanzato della seconda prova (anteprima, REC, schermo nero e avvio automatico funzionano) si passa al time-lapse integrato in dashboard e camera e alle anteprime live nella home.

**Cosa è stato fatto:**
- Analisi del registro avanzato inviato dall'utente: anteprima in WebRTC diretta (host→host, RTT 5-15 ms, circa 20 fps, circa 2,4 Mbps), REC da 17 s con 16 pezzi e 41,9 MB (20 Mbps), schermo nero attivo e disattivato con conferma, avvio automatico della camera riuscito (2,5 s).
- Camera r4 e dashboard r4: time-lapse (automatico come iPhone e manuale), anteprime "mini" e "full", campionamento dei messaggi di stato nel registro (1 su 15), archivio IndexedDB v2 con le immagini del time-lapse.

**Bug: Anteprima senza limite di banda**

**Sintomo:** nel registro della camera: "setParameters: parameters are not valid"; l'anteprima viaggiava a circa 2,4 Mbps in 1080p invece di 720p a 1,5 Mbps.
**Causa:** non accertata; probabilmente i parametri venivano impostati prima della negoziazione WebRTC.
**Fix applicato:** parametri applicati dopo la creazione dell'offerta, con riprova senza frame rate massimo; da verificare nel prossimo registro.

**Decisioni prese:**
- Contesto: il time-lapse è la modalità più usata ma non era ancora in dashboard (solo nella pagina di test). Decisione: anticiparlo rispetto al trasferimento dei file. Alternative scartate: lasciarlo dopo il trasferimento. Da rivedere se: la creazione del video sul telefono non funziona su iOS 16.3.
- Contesto: anteprime nella home. Decisione: qualità "mini" (360p, 500 kbps) in home e "full" (720p, 1,5 Mbps) nel dettaglio, con interruttore per spegnerle.

**Osservazione:** l'orologio del telefono risulta circa 0,6 s avanti rispetto a quello del PC (età dei messaggi di stato negativa): da tenere presente per sincronizzare le camere.

**File consegnati/modificati:**
- `docs/camera.html`, `docs/dashboard.html`, `docs/rt.js`
- `docs/PIPELINE.md`, `documento-sessione-video-system-gdc-studio.md`

**Impatto su Vision/Pipeline:** Step 7 (time-lapse) in corso; il trasferimento dei file (Step 6) resta il prossimo passo.

---

### [2026-10-15 14:42] Prova con dispositivi veri, correzioni e registro attività avanzato

**Riepilogo:** la prova con XR e telefono personale conferma comandi, stato e salvataggio in galleria; corretti identità e archivio della camera e aggiunto un registro attività avanzato (dashboard e camera) per il debug.

**Cosa è stato fatto:**
- Esito della prova: REC/STOP dalla dashboard ok, file salvato nella galleria dell'XR, stato e impostazioni ok, anche con un secondo telefono (quello personale).
- Camera r2: archivio IndexedDB con riapertura automatica e ripiego in memoria; identità da link (`~id`), memoria locale e cookie; registro attività con copia; conferma (ack) dei comandi; messaggi sullo stato delle tracce e di WebRTC; schermo nero più robusto, con stato visibile in dashboard.
- Dashboard r3: registro attività avanzato (nascosto, con Copia e Svuota) che include anche il registro della camera; pulsante Copia nel registro base; banner "Stesso telefono?" con unione; pulsante "Copia link di questa camera".
- `rt.js`: link con id camera fisso e registro del traffico (tx/rx, presenza, stato).

**Bug: Camera duplicata alla riapertura del link**

**Sintomo:** riaprendo il link la dashboard crea una nuova camera invece di riconoscere lo stesso telefono.
**Causa:** non accertata. Ipotesi: il link viene aperto in un browser interno di un'app (Messaggi/WhatsApp ecc.) con memoria separata da Safari, oppure la memoria locale non è persistente.
**Fix applicato:** identità fissabile dal link (per camera), copia nel cookie, banner di unione in dashboard; da verificare con il registro avanzato.

**Bug: "Archivio non disponibile: InvalidStateError"**

**Sintomo:** sulla camera riaperta l'archivio risulta non disponibile.
**Causa:** non accertata. Ipotesi: connessione IndexedDB chiusa da Safari (sfondo, ripristino pagina) oppure contesto senza archivio.
**Fix applicato:** riapertura automatica e nuovi tentativi, ripiego in memoria con avviso; da verificare.

**Bug: Tasto schermo nero non funzionante**

**Sintomo:** dalla dashboard lo schermo del telefono non diventava nero.
**Causa:** non accertata (nel test simulato funzionava).
**Fix applicato:** overlay forzato con stile diretto, ack del comando con dettagli (dimensioni e stile calcolato), stato visibile in dashboard; da verificare.

**Decisioni prese:**
- Contesto: ordine dei prossimi passi. Decisione: prima i fix, poi il trasferimento dei file al PC, poi il time-lapse (confermato valido: il time-lapse userà lo stesso invio dei pezzi).
- Contesto: duplicati di camere. Decisione: proporre l'unione (impronta del dispositivo + camera offline) invece di unire in automatico. Alternative scartate: unione automatica (rischio con telefoni dello stesso modello). Da rivedere se: l'impronta risulta troppo debole.

**File consegnati/modificati:**
- `docs/camera.html`, `docs/dashboard.html`, `docs/rt.js`
- `documento-sessione-video-system-gdc-studio.md`, `docs/PIPELINE.md`

**Impatto su Vision/Pipeline:** Step 5 (canale) segnato come completato; note aggiunte agli Step 3 e 4.

---

### [2026-10-15 14:20] Dall'idea ESP32 alla dashboard con camere reali via Supabase

**Riepilogo:** dall'idea iniziale di cinque camere ESP32 si è arrivati a un sistema con iPhone XR come camera dal browser, test completi sul telefono e una dashboard collegata alle camere con Supabase Realtime, in attesa della prova con i dispositivi veri.

**Cosa è stato fatto:**
- Ricerca di componenti e prezzi; valutazione di ESP32-CAM, camere IP PoE, schede IP, moduli USB, Raspberry Pi, Android.
- Dashboard simulata (home, dettaglio camera, rinomina, REC).
- Pagina di test `docs/camera-test.html` con test completo, test approfondito, report copiabile, time-lapse automatico e manuale.
- Due test sull'XR (iOS 16.3.1) e analisi dei report.
- Pagina camera `docs/camera.html`, canale `docs/rt.js`, dashboard collegata con Supabase (progetto GDC-thumbnail-generator), anteprima WebRTC, comandi, impostazioni e schermo nero. Prova con simulazione locale riuscita.
- GitHub Pages attivato dall'utente (branch `claude/friendly-feynman-0cmnp3`, cartella `/docs`).

**Bug: Pagine in Claude senza fotocamera**

**Sintomo:** una pagina pubblicata come Artifact non può usare la fotocamera.
**Causa:** la finestra in cui gira la pagina blocca fotocamera e microfono per tutti gli spettatori.
**Fix applicato:** le pagine sono state pubblicate con GitHub Pages (verificato).

**Bug: Limite di scrittura circa 0,78 GB sull'XR**

**Sintomo:** nel secondo test la scrittura su IndexedDB si è fermata a 0,78 GB con "An internal error was encountered in the Indexed Database server".
**Causa:** non accertata (quota di Safari o pressione di memoria).
**Fix applicato:** tetto di sicurezza di 700 MB nella pagina camera; scarico continuo verso il PC ancora da implementare.

**Bug: Bitrate 4K di 9,6 Mbps invece di 40**

**Sintomo:** nella ripresa lunga a 4K il bitrate reale era 9,6 Mbps (nella prova breve era 40,3).
**Causa:** non accertata; probabilmente il bitrate è un tetto e con scena ferma scende.
**Fix applicato:** nessuno — da confermare con una scena in movimento. Da controllare anche il possibile frame rate variabile (riproduzione misurata a 28 fps).

**Decisioni prese:**
- Contesto: serviva scegliere la camera. Decisione: usare i telefoni (iPhone XR) come camere, registrando dal browser. Alternative scartate: ESP32-CAM (qualità), camere IP PoE (costo di circa 300 € per le 4K e non adatte alla dashboard), moduli CSI (non compatibili con ESP32), Raspberry Pi (non preferito dall'utente), Android con scrcpy (non disponibile). Da rivedere se: la qualità del browser non basta o serve il 1080p a 60 fps.
- Contesto: ruolo dell'ESP32. Decisione: opzionale e rimandato. Alternative scartate: ESP32 come cervello obbligatorio. Da rivedere se: servono servo, pulsante fisico o telecomando per l'app Fotocamera.
- Contesto: come far comunicare le pagine. Decisione: Supabase Realtime, canale segreto, video e file direttamente tra telefono e PC. Alternative scartate: programma sul PC con HTTPS locale (certificato da installare sull'iPhone), PeerJS (poca affidabilità), scambio manuale. Da rivedere se: si vuole evitare servizi esterni.
- Contesto: dove vanno i file. Decisione: cartella del PC (Edge) come destinazione principale, con barra di avanzamento e "sicuro da chiudere"; galleria iPad e telefono con un tocco; cloud come segnaposto.
- Contesto: batteria. Decisione: app Comandi con automazioni alle soglie indicate.
- Contesto: controllare l'XR dall'iPad (Control Nearby Devices). Decisione: accantonato (impostazione non trovata). Da rivedere se: serve cambiare modalità dell'app nativa da remoto.
- Contesto: progetto Supabase. Decisione: GDC-thumbnail-generator per ora (esiste anche GDC-DASHBOARD). Da rivedere se: si preferisce un progetto dedicato.

**File consegnati/modificati:**
- `README.md`, `documento-sessione-video-system-gdc-studio.md`
- `docs/dashboard.html`, `docs/camera.html`, `docs/rt.js`, `docs/camera-test.html`
- `docs/ARCHITETTURA.md`, `docs/PIPELINE.md`, `docs/RISULTATI-TEST.md`

**Impatto su Vision/Pipeline:** documento creato con Vision e Pipeline a step. `docs/PIPELINE.md` allineato (stati aggiornati) e il Pipeline di `docs/ARCHITETTURA.md` sostituito da un rimando.

---
