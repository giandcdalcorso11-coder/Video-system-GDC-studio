# Risultati dei test sull'iPhone XR (iOS 16.3.1, Safari 16.3)

Pagina di prova: `docs/camera-test.html`. Test del 15/10/2026, pagina r5.

## Funziona
- Fotocamera posteriore: 720p, 1080p e 4K a 30 fps, in verticale. Frontale fino a 1080p.
- Registrazione dal browser: MP4 H.264 con audio AAC. Il bitrate richiesto viene rispettato a 1080p (20 Mbps).
- Anteprima WebRTC: 720p a 30 fps in H.264, circa 1,8 Mbps. STUN raggiungibile.
- Ripresa lunga a pezzi su IndexedDB: 2 min a 4K e 1 min a 1080p senza errori, nessun calo di fps (30,8 → 30,9), riassemblaggio in circa 0,5 s.
- Time-lapse: intervallo minimo circa 0,5 s a 1080p e a 12 MP (3024x4032).
- Condivisione di file con Web Share.
- Canale dati WebRTC: 107 Mbps sul telefono stesso (messaggi fino a 256 KB).

## Limiti
- Niente 60 fps a 1080p e 4K. A 720p si arriva a circa 56 fps.
- Niente fuoco, esposizione, zoom, torcia (vincoli non supportati).
- Niente Wake Lock, livello batteria, WebCodecs, OffscreenCanvas, stima della quota di archiviazione.
- OPFS non utilizzabile (errore alla scrittura). Nessun showSaveFilePicker.
- Scrittura su IndexedDB fermata da errore interno dopo circa 0,78 GB.
- Archivio non persistente: Safari può cancellarlo (dopo 7 giorni senza uso o con poco spazio).
- Solo H.264 in registrazione (niente HEVC, niente WebM).

## Da chiarire
- Bitrate a 4K: richiesti 40 Mbps, ottenuti 9,6 Mbps su 120 s (nella prova da 5 s erano 40,3). Probabilmente è un tetto e con scena statica scende.
- Riproduzione misurata a 28 fps su clip registrati a 30: possibile frame rate variabile (VFR) o artefatto della misura.
- Un solo evento di pagina in background durante il test (timer in ritardo fino a 735 ms).

## Conseguenze sul progetto
- Spazio locale utilizzabile in sicurezza: circa 0,7 GB. Corrisponde a circa 11 min a 9,6 Mbps, 5 min a 20 Mbps, 2,6 min a 40 Mbps. Per il time-lapse circa 1300 immagini a 1080p o 260 a 12 MP.
- Per riprese lunghe i pezzi vanno inviati al PC mentre si registra (buffer locale che si svuota), non salvati tutti sul telefono.
- Con Wi-Fi a 2,4 GHz un invio continuo a 20 Mbps è al limite: verificare se la rete ha la banda a 5 GHz (l'XR la supporta).
- Il file va controllato per frame rate variabile prima del montaggio.

---

# Altri telefoni e prove (novembre 2026)

## iPhone 15 (Safari 27.2, iOS 18.7)
- Zoom nativo 0,5–10×, torcia, distanza di fuoco e bilanciamento del bianco manuale disponibili; niente API della batteria.
- Archivio: quota dichiarata 39 GB. **Prova di scrittura: 4096 MB in 32 s senza errori** (il tetto della prova era 4 GB, quindi lo spazio reale è almeno questo). Dopo la pulizia lo spazio usato torna a 0. Con questo dato la camera passa da 700 MB prudenti a circa 3,6 GB (circa 25 minuti a 1080p e 20 Mbps).
- Registrazione: pezzi continui (10 s = 8 pezzi, 21 MB), quindi il recupero dopo un blocco della pagina è praticabile.
- Trasferimento verso iPad su rete molto debole (0,2–0,9 Mbps): clip da 6,3 MB arrivata e verificata dopo 3 riprese automatiche; qualità ottima in galleria.

## Pixel 8 Pro (Chrome 157)
- Batteria dal browser (77%, in carica) senza Comandi. Wake Lock, scelta cartella, condivisione file.
- Quota di archivio stimata 10 GB. MediaRecorder: mp4 (avc1 + AAC) e webm.
- Camera posteriore: zoom 1–30×, torcia, fuoco manuale (0,105–5,9), ISO 21–10666, tempo di posa, compensazione ±4, bianco manuale 2850–7000 K, fino a 60 fps, fino a 4080×3072.
- Anteprima verso l'iPad: connessione diretta, 406×720 a 31 fps su rete mobile, nessun pacchetto perso.
- Non provati: REC, trasferimento e zoom dalla regia.

## Prove in browser simulato (camera finta)
Le prove in `tests/` verificano il comportamento del software, non quello dei telefoni. Su Chromium il formato mp4 consegna i pezzi solo allo STOP (con webm arrivano di continuo): su Android il recupero dopo un blocco potrebbe quindi non funzionare con mp4 e va verificato su un telefono vero.

## Esiti della revisione del database (Supabase)
- Tabella `gdc_dev_logs`: protezione a livello di riga attiva, solo inserimento per i client, nessuna lettura; limiti di lunghezza sui campi, ruoli ammessi controllati, cancellazione dopo 7 giorni, filtro anti-duplicati.
- Rischio residuo: chiunque abbia la chiave pubblica può inserire righe fino alla pulizia a 7 giorni. Per l'uso pubblico l'invio dei log è spento di default (solo link da sviluppatore); i log contengono modello e browser del dispositivo, quindi con terzi serve informativa e consenso.
