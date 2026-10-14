# Video System GDC Studio

Sistema multicamera per riprese di progetti (reel verticali 9:16): più punti di vista,
start/stop REC da remoto, dashboard di controllo. Il montaggio resta su DaVinci Resolve.

## Stato
- `dashboard/index.html` — dashboard (prototipo con camere **simulate**). Si apre con un doppio clic.
- `docs/ARCHITETTURA.md` — come comunicano dashboard, telefoni ed ESP32.

## Obiettivi
- 2 camere iniziali (iPhone XR + secondo telefono), estendibile.
- Stato di ogni camera (offline / pronta / in REC), anteprima, REC singolo e globale.
- Movimento pan/tilt (segnaposto, servo in una fase successiva).
- ESP32 come cervello/telecomando (Bluetooth verso i telefoni, servo).
