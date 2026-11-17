# Documento di Sessione — Video System GDC Studio

**Versione:** 25
**Ultimo aggiornamento:** 2026-11-17 18:20

## Vision

Un sistema multicamera per riprendere i propri progetti da più punti di vista e montarne reel verticali (9:16) in DaVinci Resolve. Le camere restano montate in posizioni scomode: il set si tocca solo per mettere in carica il telefono e (finché non sarà automatico) recuperare i file. Da una dashboard (PC con Edge, iPad) si vede lo stato di ogni camera, si vede l'anteprima, si avvia e si ferma la registrazione e il time-lapse, si scelgono le impostazioni e si trasferiscono i file nella cartella del PC, con una barra di avanzamento e l'indicazione di quando si può chiudere in sicurezza.

Punto di partenza: due telefoni (iPhone XR e un secondo telefono) usati a mano; si vuole ridurre il tempo di preparazione del set. Obiettivo iniziale di 5 camere ridimensionato a 2 angolazioni, estendibile. Il PC è acceso solo quando si gira.

Il software (dashboard, pagina camera, canale di comunicazione) è il valore principale del progetto; l'hardware extra (ESP32, servo) è opzionale.

Direzione di prodotto (2026-11-15): oltre allo strumento personale, l'idea è portarla a un livello successivo, come app con piano gratuito (qualità massima e numero di dispositivi limitati, file solo sul dispositivo) e piano Pro (più dispositivi, qualità alta, slow-mo, time-lapse, archiviazione a scelta anche in cloud). Punti di forza da curare: uso senza installare nulla, multi-dispositivo (Apple, Android, PC; in prospettiva action cam), file sul dispositivo madre in una cartella scelta (anche disco esterno). Ancora da fare: lavorare sul funzionamento, sulla grafica e sui limiti di rete.

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
- [2026-11-17] Sonda camera r20 sull'iPhone 15 (Safari 27.2, iOS 18.7): `navigator.getBattery` assente (log 15:21). Test da fare più avanti: aprire la camera da Chrome su un telefono Android (dove l'API dovrebbe esistere e dare la batteria senza Comandi); su iPhone tutti i browser usano WebKit, quindi Chrome iOS non cambia (da verificare solo se in UE esistesse un motore diverso).

### Step 10 — Modalità Base/Avanzata e log inviati a Claude

**Stato:** in corso (implementato, da verificare sui dispositivi veri)

**Obiettivo:** una sola web app con due modalità: Base (solo i comandi utili a tutti) e Avanzata (impostazioni, test, registri: quella di sviluppo); in Avanzata i log possono arrivare in un database che Claude legge, per evitare il passaggio copia e incolla.

**Decisioni progettuali:** interruttore Base/Avanzata in cima a camera e dashboard, ricordato sul dispositivo; elementi avanzati marcati `adv-only`. Invio dei log solo con modalità Avanzata e interruttore "Invia i log a Claude" attivi; tabella `gdc_dev_logs` nel progetto Supabase del titolare (che contiene anche altre tabelle: non toccate), scrittura anonima, nessuna lettura con la chiave pubblica, cancellazione automatica dopo 7 giorni; link e chiavi vengono oscurati nel testo.

**Criterio di completamento:** una prova sull'iPad e sull'iPhone 15 con invio attivo, e Claude che legge le righe dalla tabella.

**Note (cronologia dello step):**
- [2026-11-15] Creata la tabella con verifica dei permessi (insert anonimo ok, lettura anonima negata). Camera r8 e dashboard r6 con il nuovo interruttore. Provato in un browser di prova con rete simulata; la scrittura vera verso Supabase non è provabile dalla sandbox (proxy).

### Step 9 — Hardware opzionale

**Stato:** rimandato

**Obiettivo:** ESP32 (pulsante REC fisico, servo pan/tilt, telecomando Bluetooth), altri telefoni.

**Decisioni progettuali:** nessuna ancora.

**Criterio di completamento:** da definire se servirà.

**Note (cronologia dello step):**
- [2026-10-15] Standby/schermo nero già fatto via web. Controllo dell'XR dall'iPad accantonato.

## Storico sessioni

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
