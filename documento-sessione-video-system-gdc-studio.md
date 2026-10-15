# Documento di Sessione — Video System GDC Studio

**Versione:** 2
**Ultimo aggiornamento:** 2026-10-15 14:42

## Vision

Un sistema multicamera per riprendere i propri progetti da più punti di vista e montarne reel verticali (9:16) in DaVinci Resolve. Le camere restano montate in posizioni scomode: il set si tocca solo per mettere in carica il telefono e (finché non sarà automatico) recuperare i file. Da una dashboard (PC con Edge, iPad) si vede lo stato di ogni camera, si vede l'anteprima, si avvia e si ferma la registrazione e il time-lapse, si scelgono le impostazioni e si trasferiscono i file nella cartella del PC, con una barra di avanzamento e l'indicazione di quando si può chiudere in sicurezza.

Punto di partenza: due telefoni (iPhone XR e un secondo telefono) usati a mano; si vuole ridurre il tempo di preparazione del set. Obiettivo iniziale di 5 camere ridimensionato a 2 angolazioni, estendibile. Il PC è acceso solo quando si gira.

Il software (dashboard, pagina camera, canale di comunicazione) è il valore principale del progetto; l'hardware extra (ESP32, servo) è opzionale.

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
- [2026-10-15] Provata con i dispositivi veri (XR e telefono personale): REC/STOP, stato e impostazioni funzionano. Aggiunti: registro attività avanzato con copia, pulsante Copia nel registro base, banner "Stesso telefono?" per unire camere duplicate, link per singola camera, indicatore dello schermo nero.

### Step 4 — Pagina camera (telefono)

**Stato:** in corso

**Obiettivo:** pagina che si abbina alla dashboard, mostra l'anteprima, registra a pezzi su disco e invia lo stato.

**Decisioni progettuali:** buffer locale con tetto di sicurezza di 700 MB; i pezzi vanno su IndexedDB durante la registrazione; scarico continuo verso il PC da implementare.

**Criterio di completamento:** registrazione di una ripresa lunga con trasferimento al PC senza perdere pezzi.

**Note (cronologia dello step):**
- [2026-10-15] `docs/camera.html` v1: abbinamento, camera, REC/STOP, anteprima, impostazioni, schermo nero, elenco registrazioni.
- Da fare: time-lapse, file in attesa, trasferimento.
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

**Stato:** da fare

**Obiettivo:** arrivo dei file nella cartella del PC (Edge, File System Access) con barra di avanzamento e "sicuro da chiudere"; poi destinazioni alternative.

**Decisioni progettuali:** destinazione principale = cartella del PC; galleria dell'iPad con un tocco sull'iPad; galleria del telefono con un tocco sul telefono; cloud come segnaposto.

**Criterio di completamento:** file verificato (dimensione) e scritto nella cartella; il file viene cancellato dal telefono solo dopo la conferma.

**Note (cronologia dello step):**
- [2026-10-15] Fattibilità chiarita per ogni destinazione.

### Step 7 — Time-lapse nella pagina camera

**Stato:** da fare

**Obiettivo:** time-lapse comandabile dalla dashboard, in modalità automatica (emula l'app Fotocamera) e manuale.

**Decisioni progettuali:** automatica = 2 immagini al secondo, poi intervallo raddoppiato a 10, 20, 40 minuti scartando un'immagine su due; video a 30 fps. Prototipo già in `docs/camera-test.html`.

**Criterio di completamento:** time-lapse avviato e fermato dalla dashboard, con file inviato al PC.

**Note (cronologia dello step):**
- [2026-10-15] Prototipo nel test. Limite: circa 1300 immagini a 1080p nel buffer locale.

### Step 8 — App Comandi sull'XR (batteria)

**Stato:** da fare

**Obiettivo:** la dashboard mostra livello e stato di carica della batteria, inviati da automazioni di Comandi alle soglie 100, 90, 80, 70, 60, 50, 40, 35, 30, 25, 20, 15, 10, 5, 4, 3, 2, 1 % e quando il caricabatterie viene collegato o scollegato.

**Decisioni progettuali:** il browser non espone la batteria; si usa l'app Comandi (confermata presente sull'XR).

**Criterio di completamento:** automazioni che partono senza conferma su iOS 16.3.1 e barra batteria reale.

**Note (cronologia dello step):**
- [2026-10-15] Messo in pipeline. Circa 20 automazioni da creare a mano.

### Step 9 — Hardware opzionale

**Stato:** rimandato

**Obiettivo:** ESP32 (pulsante REC fisico, servo pan/tilt, telecomando Bluetooth), altri telefoni.

**Decisioni progettuali:** nessuna ancora.

**Criterio di completamento:** da definire se servirà.

**Note (cronologia dello step):**
- [2026-10-15] Standby/schermo nero già fatto via web. Controllo dell'XR dall'iPad accantonato.

## Storico sessioni

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
