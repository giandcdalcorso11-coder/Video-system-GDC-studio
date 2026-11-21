# Pipeline del progetto

Legenda: ✅ fatto · 🔄 in corso (fatto in simulazione, da provare sui dispositivi veri) · ⏳ da fare · 💤 più avanti

Aggiornata al 2026-11-19 (camera r32, dashboard r32). Il dettaglio è nel documento di sessione.

## 1. Verifiche sui telefoni
- ✅ iPhone XR (iOS 16.3.1): fotocamera 1080p/4K a 30 fps, MP4 H.264 + AAC, WebRTC, time-lapse, limiti di spazio (circa 0,78 GB). Vedi `docs/RISULTATI-TEST.md`
- ✅ iPhone 15 (Safari 27.2): zoom 0,5–10×, torcia, distanza di fuoco, bianco manuale; quota di archivio 39 GB; scritti 4 GB senza errori
- ✅ Pixel 8 Pro (Chrome 157): batteria dal browser, controlli completi, anteprima a 31 fps su rete mobile
- ✅ iPhone 15 con iPad come regia (2026-11-21): REC/STOP, zoom oltre 4×, torcia, nuova sessione, trasferimento con ripresa dopo interruzioni (hotspot, 3–4 Mbps medi)
- ⏳ Android: REC, trasferimento e zoom dalla regia (mai provati)
- ⏳ Misura dello spazio dell'iPhone 15 oltre i 4 GB

## 2. Dashboard (regia)
- ✅ Collegata alle camere reali (Supabase), registro, anteprime, time-lapse, unione di camere duplicate
- ✅ REC/STOP per camera e per tutte, zoom morbido, impostazioni di qualità
- ✅ "Controllo prima di iniziare" (collegamento, batteria, spazio, cartella)
- 🔄 QR per aggiungere un telefono, conferma Accetta/Rifiuta/Accetta tutte, numeri unici delle camere
- 🔄 Permesso REC/STOP del telefono (per camera o per tutte) e modo di ripresa Video/Time-lapse per camera
- 💤 Ralenti a 60 fotogrammi (dopo la misura sull'iPhone 15)
- 🔄 Segnali per il montaggio (CSV e marcatori per DaVinci Resolve)
- 🔄 Camere non collegate da giorni: avviso e rimozione
- 🔄 Viste delle camere (Automatico, Scorrimento, Personalizzato Pro in prova) e finestra Aggiungi camera
- 🔄 Controlli camera (torcia, fuoco, bianco, esposizione) in Avanzata

## 3. Pagina camera (telefono)
- ✅ Registrazione a pezzi su disco, REC/STOP, schermo nero, Wake Lock
- ✅ Spazio: minuti rimasti, arresto sicuro, misura reale (iPhone 15)
- 🔄 Anteprima locale a tutto campo con REC, tempo e zoom
- 🔄 Benvenuto alla prima apertura (nome e permessi)
- 🔄 Recupero delle clip dopo un blocco della pagina (prova su Safari da fare)
- 🔄 Postazione fissa: ripresa automatica dopo un blocco, riaccensione della camera, ricreazione del collegamento
- 🔄 Nome dei file con camera, nome, data e ora corretta con l'orologio della regia

## 4. Canale di comunicazione
- ✅ Supabase Realtime per comandi e stato; collegamento diretto per anteprima e file
- ✅ Progetto "GDC-project 2" (provvisorio)
- 💤 Progetto dedicato per l'uso pubblico (nuovo account Supabase): da fare prima del primo test esterno, con spostamento e pulizia di quanto messo in GDC-project 2

## 5. Batteria
- ✅ Android (Chrome): dal browser
- ⏳ iPhone: Comandi con automazioni (nessun collegamento ancora creato)

## 6. Trasferimento e destinazione dei file
- ✅ Camera → iPad con ripresa dopo interruzioni e controllo CRC (provato su rete molto debole)
- 🔄 Destinazione: cartella del computer (anche disco esterno) o memoria con Salva
- 🔄 Trasferimento automatico, buffer a rotazione, "Tieni i file sui telefoni"
- 🔄 Protezioni della regia: cartella scollegata o piena, tetto di memoria dell'iPad, misura della memoria
- ⏳ Prova con una cartella vera su rete buona (su wifi vero: l'hotspot non è rappresentativo)
- 💤 Invio durante la ripresa e trasferimento dei soli momenti segnati
- 💤 Cloud (versione Pro): modello di costi e pricing in `docs/COSTI-E-PRICING.md`

## 7. Uso pubblico
- 🔄 Mockup approvati; QR e conferma realizzati
- ⏳ Codice a 8 caratteri (serve il progetto dedicato)
- 🔄 Nome della sessione e "Nuova sessione" (nuovo QR, nuove chiavi, elenco vuoto)
- ⏳ Home con scelta del ruolo, scadenza delle sessioni
- 💤 Personalizzazione per attività, orologio smart (idea)

## 8. Qualità del software
- ✅ Prove automatiche in `tests/` (18 gruppi, browser con camera finta)
- ✅ Codice diviso in moduli (16 per la camera, 17 per la regia) con controllo delle versioni
- ✅ Messaggi del canale ripuliti prima di arrivare alle pagine; prova con messaggi ostili
- ✅ Chiave della regia: comandi firmati, solo la regia può comandare le camere (link nuovi); da provare sui telefoni
- ⏳ Prove sui dispositivi veri: vedi `piano-test-interno.md`

## 9. Hardware opzionale
- 💤 ESP32: pulsante REC fisico, servo pan/tilt, telecomando Bluetooth
