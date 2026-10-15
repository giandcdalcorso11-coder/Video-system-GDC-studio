# Architettura

## Idea
La **dashboard** è una pagina web che si apre dal PC (o da un altro telefono) quando si gira.
Non serve un server sempre acceso. Ogni camera è un **nodo** con un protocollo comune:

| Comando | Significato |
|---|---|
| `connect` / `disconnect` | il nodo compare/scompare nella dashboard |
| `rec_start` / `rec_stop` | avvia/ferma la registrazione |
| `move {pan,tilt}` / `home` | orienta (se ci sono servo) |

Ogni nodo invia lo stato: online, in REC, batteria, spazio libero, pan/tilt.
Nel codice questo è l'oggetto `transport` (oggi `MockTransport`, domani WebSocket).

## Due modi per usare l'iPhone

**A. App Fotocamera nativa + ESP32 (qualità massima)**
- L'ESP32 si presenta via Bluetooth come telecomando (tasto volume/scatto): avvia e ferma il video.
- La dashboard parla con l'ESP32 via Wi-Fi (la pagina può anche essere servita dall'ESP32).
- Limite: l'iPhone non invia anteprima, perché la fotocamera è occupata dall'app nativa.

**B. Pagina web aperta su Safari dell'iPhone (anteprima + comandi)**
- La pagina "camera" usa la fotocamera del browser, invia l'anteprima (WebRTC) e riceve i comandi.
- Serve un piccolo hub sul PC (segnalazione WebSocket) e HTTPS (obbligatorio per usare la camera in Safari).
- Limite: qualità/registrazione del browser inferiori all'app nativa; da verificare sull'XR.

Flusso consigliato da provare: **B per inquadrare, A per registrare**.

## Pipeline
1. [fatto] Dashboard simulata (home, dettaglio camera, rinomina).
2. [fatto] Pagina di test per l'iPhone XR (risoluzioni, registrazione, time-lapse automatico e manuale).
3. [in corso] Secondo giro di test: ripresa lunga a pezzi, 60 fps, 12 MP, limite di spazio.
4. [da fare] Canale di comunicazione tra pagina camera e dashboard (segnalazione e comandi).
5. [da fare] Pagina camera vera: anteprima WebRTC, REC/STOP, time-lapse, scrittura a pezzi su disco.
6. [da fare] Trasferimento file: dalla camera alla cartella del PC (Edge), con barra di avanzamento e stato "sicuro da chiudere".
7. [da fare] Destinazioni alternative: galleria del telefono, galleria dell'iPad (un tocco), cloud (segnaposto).
8. [da fare] App Comandi sull'XR: batteria a soglie (100, 90, ... 50, 40, 35, 30, 25, 20, 15, 10, 5, 4, 3, 2, 1 %) e stato del caricabatterie, mostrati nella barra batteria della dashboard.
9. [opzionale] Standby/Riattiva, servo pan/tilt con ESP32, controllo dell'XR dall'iPad.
