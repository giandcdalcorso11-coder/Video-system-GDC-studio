# Architettura

Stato aggiornato al 2026-11-19 (camera r28, dashboard r29). Lo storico delle decisioni è in `documento-sessione-video-system-gdc-studio.md`.

## Idea

Un sistema multicamera per riprendere in verticale (9:16) da più punti di vista e montare in DaVinci Resolve.
Le camere sono **telefoni** che aprono una pagina web (nessuna app da scaricare). Una **regia** (iPad o computer) apre la dashboard e comanda tutto: REC/STOP, zoom, anteprima, impostazioni, trasferimento dei file.
Non c'è un server proprio: per comandi e stato si usa un canale in tempo reale (Supabase Realtime), mentre video, anteprima e file viaggiano **direttamente** tra telefono e regia (WebRTC, collegamento diretto).

## Pezzi

| File | Ruolo |
|---|---|
| `docs/camera.html` + `docs/camera/` | pagina del telefono: la pagina contiene la struttura e carica 16 moduli in ordine (registro, identità, archivio IndexedDB, postazione fissa, spazio, fotocamera, registrazione, time-lapse, prova zoom, schermo nero, stato/zoom/controlli, anteprima, trasferimento, comandi, interfaccia) |
| `docs/dashboard.html` + `docs/dashboard/` | pagina della regia: 16 moduli (utilità, registro, pannello registri, camere, trasporto e anteprima, destinazione, trasferimento, binding dello stato, viste, ingresso, orologio, segnali, viste principali, router e REC, anteprima simulata, avvio) |
| `docs/rt.js` | canale in tempo reale: abbinamento (link `#gdc1.…`), eventi, presenza; modalità simulata per le prove |
| `docs/xfer.js` | trasferimento dei file (protocollo, controllo di integrità CRC32, ripresa, destinazioni cartella/memoria) |
| `docs/dev.js` | modalità Base/Avanzata e invio dei log tecnici (tabella `gdc_dev_logs`) |
| `docs/qr.js` | generatore di QR (libreria qrcode-generator, licenza MIT) |
| `docs/camera-test.html` | pagina di prova delle capacità del telefono (test del 15/10) |
| `tests/` | prove automatiche (vedi sotto) |

## Come sono caricate le pagine

Ogni pagina ha un piccolo script con il numero di versione (`PAGE_VERSION`) e poi i moduli come script classici con `defer` e `?v=<versione>` (stesso valore per tutti, per evitare che Safari mescoli file vecchi e nuovi). I moduli condividono lo stesso ambito globale e vanno in ordine numerico: **un modulo definisce, non avvia**. Tutto ciò che parte all'apertura (timer, ripristino di stati salvati) si lancia dall'ultimo modulo (`16-avvio.js` per la regia, `start()` per la camera), quando tutti i moduli sono già caricati. Quando si modifica un modulo si aumenta la versione nella pagina (e il `?v=` in tutti i tag): la prova `00-sintassi` lo controlla.

## Collegamento e canale

- **Abbinamento:** un link `pagina#gdc1.<codice>[~<id camera>]` contiene indirizzo del servizio, chiave pubblica e canale segreto. Chi ha il link entra nel canale. Parametri facoltativi: `?dev=1` (log sempre inviati), `?name=` e `?device=`.
- **Eventi sul canale** (broadcast + presenza): `state` (stato della camera, circa ogni 2 s), `cmd` (comandi dalla regia), `ack` (risposta ai comandi), `rtc` (anteprima), `xrtc` (file), `xdone` (fine trasferimento), `hello`, `dbg` (log), `battery`.
- **Comandi** principali: `rec_start`, `rec_stop`, `standby`, `config`, `rename`, `zoom`, `pro` (controlli avanzati), `tl_start`/`tl_stop` (time-lapse), `preview_start`/`preview_stop`, `xfer_start`/`xfer_test`, `space_cfg`, `station_cfg`, `join_result`, `ping`/`clock`.
- **Sicurezza dei messaggi:** chi conosce il link può scrivere sul canale. Per questo `rt.js` ripulisce ogni messaggio di stato, comando, risposta e batteria prima che arrivi alle pagine (niente caratteri di markup, testi e liste limitati, chiavi semplici, messaggi oltre 40 kB ignorati), la regia scarta camere con id non validi e i nomi dei file in arrivo vengono resi sicuri. - **Chiave della regia** (`docs/auth.js`): la regia ha una coppia di chiavi (ECDSA P-256). La parte pubblica sta nei link delle camere (e nel QR), la privata solo nel link della dashboard. Ogni comando è firmato (con numero progressivo, ora e id della sessione della regia); la camera esegue solo comandi con firma valida, mai ricevuti prima e non più vecchi di 10 minuti, e risponde "non autorizzato" agli altri. Chi ha solo il link della camera può ascoltare il canale ma non comandare. Per usare un'altra regia (iPad poi computer) si apre il **link della dashboard** copiato dal pannello Collegamento. I link vecchi, senza chiave, funzionano come prima (nessun controllo). Limiti: il canale non è cifrato (chi ha il link può leggere lo stato e vedere i comandi firmati); una camera finta può ancora presentarsi (la conferma della regia resta il filtro).
- **Servizio:** progetto Supabase "GDC-project 2" (provvisorio; per l'uso pubblico è previsto un account dedicato). Il collegamento diretto usa STUN pubblico (nessun TURN: dietro alcune reti aziendali può non collegarsi).

## Ingresso dei telefoni

- La regia mostra un **QR** (e il link) per aggiungere un telefono. Alla prima apertura la camera chiede il nome e spiega i permessi, poi si collega.
- Con la spunta "Chiedi conferma" (accesa di default) un telefono nuovo compare con **Accetta / Rifiuta / Accetta tutte**; i telefoni già noti rientrano da soli. Il rifiuto è lato regia (chi ha il link può comunque scrivere sul canale, la regia lo ignora).
- Ogni camera riceve un numero unico (`Camera N`) che ricorda anche cambiando regia.

## Registrazione e archivio sul telefono

- `MediaRecorder` con un pezzo al secondo, scritto subito in IndexedDB; il registro della clip nasce al REC e si aggiorna ogni 10 s.
- **Recupero:** all'apertura della pagina le clip interrotte da un blocco (o i pezzi senza registro) vengono ricostruite e segnalate come "recuperate".
- **Postazione fissa** (spunta dalla regia): se la camera si blocca o la pagina si chiude, riprende da sola a registrare (nuova clip). Sempre attivi: riaccensione periodica della camera e ricreazione del collegamento se resta giù.
- **Spazio:** quota e uso dal browser, riserva di 200 MB, limite prudente di 700 MB dove la quota non è nota (iOS), misura reale con il pulsante "Misura spazio reale". Minuti rimasti, avvisi (giallo/rosso), arresto sicuro prima di finire, REC rifiutato sotto 1 minuto. Eliminazione facoltativa delle clip già trasferite e verificate (spenta di default).
- **Nome dei file:** `Camera<N>_<nome scelto sul telefono>_<AAAA-MM-GG>_<hh-mm-ss>.mp4` (ora di inizio corretta con lo scarto dell'orologio rispetto alla regia).
- **Controlli avanzati** (torcia, fuoco, bianco, esposizione) mostrati solo se il telefono li dichiara; zoom nativo con salita morbida.

## Trasferimento dei file

- Protocollo sul canale dati WebRTC: intestazione → conferma con eventuale posizione di ripresa → pezzi da 60 kB → chiusura con dimensione e CRC32 → ok/errore.
- **Ripresa** dopo interruzioni (controllo CRC di quanto già ricevuto), fino a 6 tentativi senza progressi, poi pulsante "Riprendi".
- **Destinazioni:** cartella del computer (Edge/Chrome, File System Access) oppure memoria del dispositivo con poi "Salva" (iPad e Safari). Su iPad i file in memoria hanno un tetto di 1,5 GB in attesa di Salva.
- **Automatico:** ogni clip pronta parte da sola quando la camera non registra (solo con cartella), una per camera e al massimo due camere insieme; con "Elimina dal telefono" il telefono tiene solo ciò che non è ancora arrivato (buffer a rotazione).
- **"Tieni i file sui telefoni":** nessun trasferimento automatico e nessuna eliminazione; si scarica tutto dopo.
- **Protezioni della regia:** prova reale della cartella (file di prova) all'avvio, ogni 15 s e prima di ogni trasferimento; disco scollegato o pieno mettono in pausa e il trasferimento riparte da solo (anche cambiando cartella); i file restano sempre sul telefono finché non sono arrivati e verificati.
- **Anteprima durante i trasferimenti:** scelta dell'utente (accesa di default con avviso).

## Segnali per il montaggio

Pulsante "Segna" (o tasto M) nella regia: registra la posizione dentro la clip di ogni camera che sta registrando (precisione circa mezzo secondo). Esporta un CSV e, per ogni camera, un file dei marcatori per DaVinci Resolve (formato da provare).

## Base e Avanzata

Due modalità della stessa pagina. In **Base** solo ciò che serve a riprendere. In **Avanzata** gli strumenti di precauzione e di diagnosi (registro, collegamento, prove di rete e memoria, controlli camera, orologio). I link da sviluppatore (`?dev=1`) inviano sempre i log tecnici, che si leggono nella tabella `gdc_dev_logs` (solo inserimento da parte dei client, cancellazione automatica dopo 7 giorni). Nessun video, foto o audio viene mai inviato.

## Prove automatiche

Cartella `tests/`: `npm install` e poi `npm test` (o `node run.mjs <filtro>`). Ogni prova apre un browser con camera finta e una regia e controlla il comportamento (struttura e versioni, trasferimento con caduta, spazio, automatico, cartella scollegata o piena, memoria, ingresso dei telefoni e QR, nomi e orologio, segnali, recupero e postazione fissa, controlli avanzati, messaggi ostili, caricamento lento). Non sostituiscono le prove su telefoni veri.

## Limiti noti della piattaforma web

- Safari non espone la batteria (serve il collegamento con Comandi); Chrome su Android sì.
- Safari su iPad non può scegliere una cartella: i file passano dalla memoria e poi da "Salva".
- La pagina camera deve restare aperta e con lo schermo acceso; il sistema può chiuderla (da qui il recupero).
- Il browser non può collegarsi a GoPro o Insta360 (usano un loro Wi-Fi).

## Hardware opzionale

ESP32 (pulsante REC fisico, servo pan/tilt, telecomando Bluetooth) è rimandato: il software è il valore principale.

## Pipeline

Vedi `docs/PIPELINE.md` (stato attuale) e il documento di sessione (storico, decisioni, bug).
