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
