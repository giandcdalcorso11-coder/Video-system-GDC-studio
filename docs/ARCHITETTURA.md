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

## Prossimi passi
1. Dashboard con camere simulate (fatto).
2. Prototipo ESP32: pagina web + trigger Bluetooth verso l'iPhone XR (da verificare su iOS).
3. Pagina camera per Safari + hub WebRTC (anteprima reale).
4. Servo pan/tilt (opzionale).
