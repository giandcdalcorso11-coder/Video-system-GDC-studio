# Pipeline del progetto

Legenda: ✅ fatto · 🔄 in corso · ⏳ da fare · 💤 più avanti

## 1. Verifiche sull'iPhone XR (iOS 16.3.1)
- ✅ Fotocamera dal browser: 1080p e 4K verticali a 30 fps, MP4 H.264 + audio AAC, bitrate controllabile
- ✅ WebRTC (anteprima) e raggiungibilità STUN confermati
- ✅ Time-lapse dal browser (automatico stile iPhone + manuale)
- 🔄 Test approfondito: ripresa lunga a pezzi, 60 fps, foto 12 MP, canale dati, limite di spazio
- ⏳ Prova del tasto volume nel Time-lapse nativo (solo se si userà l'app Fotocamera)

## 2. Dashboard
- ✅ Prototipo con camere simulate: home, dettaglio camera, rinomina, REC, pan/tilt segnaposto
- ⏳ Barra batteria alimentata dai dati reali (vedi punto 5)
- ⏳ Selettore della destinazione dei file
- ⏳ Barra di scaricamento dei video con indicatore "puoi chiudere in sicurezza"
- 💤 Standby / Riattiva (schermo nero sul telefono)

## 3. Pagina camera (telefono)
- ⏳ Collegamento alla dashboard (comandi: REC/STOP, time-lapse, stato)
- ⏳ Anteprima in tempo reale (WebRTC)
- ⏳ Registrazione scritta a pezzi su disco (IndexedDB), file in attesa di invio
- ⏳ Time-lapse integrato (modalità automatica e manuale)

## 4. Canale di comunicazione
- ⏳ Decisione: cloud leggero per i comandi + collegamento diretto telefono ↔ dashboard per video e file
- ⏳ Trasferimento file con verifica di integrità

## 5. App Comandi sull'XR (batteria)
- ⏳ Comando "Invia batteria" (livello + in carica / non in carica)
- ⏳ Automazioni alle soglie 100, 90, 80, 70, 60, 50, 40, 35, 30, 25, 20, 15, 10, 5, 4, 3, 2, 1 %
- ⏳ Automazioni caricabatterie collegato / scollegato
- ⏳ Verifica che le automazioni partano senza conferma su iOS 16.3.1
- ⏳ La barra batteria della dashboard mostra livello, fulmine se in carica, ora dell'ultimo aggiornamento

## 6. Destinazione dei file
- ⏳ Cartella del PC (Edge, File System Access): destinazione principale
- ⏳ Galleria dell'iPad della dashboard (un tocco su "Salva in Foto" sull'iPad)
- ⏳ Galleria del telefono che registra (un tocco sul telefono)
- 💤 Cloud online (segnaposto)

## 7. Hardware opzionale
- 💤 ESP32: pulsante REC fisico, servo pan/tilt, telecomando Bluetooth per l'app Fotocamera
- 💤 Altri telefoni (stessa pagina camera)
