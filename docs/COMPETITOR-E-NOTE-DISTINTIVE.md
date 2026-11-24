# Competitor e note distintive — Video System GDC Studio

**Versione:** 1 (bozza) · **Data della ricerca:** 24 novembre 2026
**Stato:** bozza da riguardare. Ricerca fatta online in inglese; i prezzi e le funzioni vanno ricontrollati sulle pagine ufficiali prima di usarli per decidere. Dove una fonte è un blog o un sito che confronta prodotti, lo segno.

## 1. In breve

- Il problema "più telefoni, un solo REC, i file tutti insieme" è già risolto da app native, per lo più **gratis**. Far pagare le funzioni base è difficile.
- **Il concorrente più vicino non è un'app nativa ma Shot.video**: una web app dove scansioni un QR e il telefono diventa una camera, senza installare niente. Va studiato per primo.
- Il vantaggio più chiaro della nostra versione: **funziona dal browser, su iPhone, Android e PC, con i file che arrivano direttamente in una cartella del computer per DaVinci Resolve**. Nessun concorrente trovato mette insieme tutte e tre le cose.
- Il limite più chiaro: nel browser non si controllano fuoco, esposizione, 4K garantito e slow-motion come in un'app nativa (vedi sezione 6).

## 2. Chi c'è, in tre gruppi

### A. App native per registrare con più dispositivi (i più simili)

| Prodotto | Piattaforme | Regia e camere | Trasferimento file | Prezzo (dalle fonti) |
|---|---|---|---|---|
| **Blackmagic Camera** (2.0 e 3.0) | iPhone, iPad, Android | Un telefono o iPad controlla fino a 9 altri, anteprima di tutte, REC/STOP insieme, impostazioni (fuoco, zoom, fps, bilanciamento del bianco) per camera o per tutte | Dalla 3.0 (settembre 2025) il controller scarica i clip finiti dai telefoni; secondo le fonti conservano metadati e timecode e Resolve li sincronizza da solo | **Gratis** |
| **Apple Final Cut Camera + Live Multicam** | iPhone XS+ (iOS 17.4+), iPad | Fino a 4 dispositivi; la regia è **Final Cut Pro per iPad** (iPad con M1 o successivo) | In background verso l'iPad | Final Cut Camera gratis; Final Cut Pro per iPad in abbonamento (nel Regno Unito 4,99 £/mese o 49 £/anno al lancio; prezzo USA non verificato) |
| **Unison (Multi Camera Recorder)** | iPhone, iPad, Mac | Un dispositivo "master" comanda gli altri, tutto da una schermata, senza account | Le clip tornano al master già sincronizzate | Gratis come camera; per fare da master serve **Unison Plus** (4,99 $/mese o 29,99 $/anno secondo l'App Store; la pagina dello sviluppatore dice ancora "gratis": contraddizione da chiarire) |
| **MultiCameraSync** | solo iPhone | Un telefono comanda gli altri, con anteprima | non verificato | non verificato |
| **SYNCAM / MultiCam (Amoura)** | iPhone, iPad | Rete locale, un tocco e tutti registrano, **senza cloud** | non verificato | non verificato |
| **1Take Pro** | iPhone, iPad | Beta pubblica su TestFlight; allinea gli orologi via Wi-Fi, esce audio BWF | non verificato | non verificato; lo sviluppatore ammette stabilità non provata |
| **Camerama** | iPhone, iPad (nessuna versione Android trovata) | Comanda più camere insieme, anche Canon, Sony, Fujifilm, GoPro via Bluetooth e Apple Watch | non verificato | Gratis con acquisti in-app |

**Cosa colpisce:** Blackmagic Camera fa già quasi tutto quello che facciamo noi, **gratis, su iOS e Android, ed è dello stesso produttore di DaVinci Resolve**. È il concorrente più forte per chi monta in Resolve e ha app native. Punti deboli: va installata su ogni telefono, vale per iPhone e Android ma con le due piattaforme non è chiaro se si possano mischiare nello stesso gruppo (le fonti non lo dicono), non risulta un ingresso da link o QR per ospiti.

### B. Web app senza installazione

| Prodotto | Come funziona | Prezzo | Note |
|---|---|---|---|
| **Shot.video** | Avvii la sessione dal browser del computer, scansioni un QR con ogni telefono (anche in Safari, niente app), registrano insieme; il computer registra con il suo schermo e la sua webcam. Poi un'IA fa un primo montaggio con tagli, zoom e B-roll | Piano gratis con 2 crediti video e 5 di B-roll; offerta Black Friday a 39, 79 o 159 $ il primo anno (per i primi 100); piani regolari non verificati | Il più vicino alla nostra idea. Una recensione consiglia di tenere la pagina aperta finché dice "Uploaded": le riprese partono dal browser e arrivano al servizio, **non su una cartella tua** |
| **SplitCam** | Sul QR il telefono entra dal browser e fa da webcam | non verificato | Pensato per le dirette, non per registrare |
| **Use My Phone** | Fino a 4 telefoni visti insieme sullo schermo | non verificato | Solo visione dal vivo, non registrazione |
| **Playout.video** | Ospiti da qualsiasi browser | non verificato | Studio per dirette, non cattura multicamera |

### C. Dirette e registrazione remota (obiettivo diverso)

| Prodotto | Cosa fa | Prezzo (dalle fonti) |
|---|---|---|
| **Switcher Studio** | Fino a 9 camere wireless (iPhone, iPad, webcam) per dirette, con multistreaming | Da 65 $/mese secondo il sito ufficiale; prova di 14 giorni; altre fonti danno cifre diverse |
| **Mevo Multicam** | App per le camere Mevo e per dirette | App gratis; abbonamento Mevo Pro 19 $/mese o 149 $/anno |
| **Canon Live Switcher** | Fino a 3 camere, dirette | App gratis; abbonamento per full HD senza filigrana |
| **LiveShow Creator** | Dirette con più iPhone, controllo da iPad o Mac | non verificato |
| **Riverside, Zencastr, StreamYard, Descript (SquadCast)** | Registrazione remota di ospiti, tracce separate, per podcast e interviste | Da circa 16–36 $/mese (cifre discordanti tra fonti, tutte blog); il telefono come camera non è il loro uso |

Questi servono a chi fa dirette o interviste a distanza. Non competono su "le mie camere in un set, i file in una cartella", ma servono da riferimento per i prezzi.

## 3. Confronto per funzione

(✔ sì, ✖ no, ? non verificato, ~ in parte)

| Funzione | La nostra webapp | Blackmagic Camera | Final Cut Cam. + Live Multicam | Unison | Shot.video |
|---|---|---|---|---|---|
| Niente da installare sulle camere | ✔ | ✖ | ✖ | ✖ | ✔ |
| iPhone e Android insieme | ✔ (Android da provare ancora) | ~ (stessa app su entrambi, mix non confermato) | ✖ solo Apple | ✖ solo Apple | ✔ |
| Regia da PC (Edge/Chrome) | ✔ | ✖ (telefono o iPad) | ✖ (iPad) | ✖ (dispositivo Apple) | ✔ |
| Ingresso da QR/link | ✔ | ? | ✖ (stesso Apple ID o codice) | ? | ✔ |
| REC/STOP comune | ✔ | ✔ | ✔ | ✔ | ✔ |
| Anteprima di tutte le camere | ✔ | ✔ | ✔ | ✔ | ? |
| Zoom/impostazioni da remoto | ~ (zoom e qualità; non fuoco/esposizione) | ✔ completo | ✔ | ✔ | ? |
| File su **cartella del PC** senza cloud | ✔ | ~ (arrivano sul controller; poi a mano) | ✖ (iPad) | ✖ (master) | ✖ (servizio) |
| Verifica e ripresa del trasferimento | ✔ (CRC32, riprende dal byte) | ? | ? | ? | ? |
| Registrazione 9:16 | ✔ | ✔ | ✔ | ? | ? |
| 4K / slow-motion / ProRes | ✖ (4K a volte, non garantito) | ✔ | ✔ | ~ | ✖ |
| Fuoco, esposizione, bilanciamento | ✖ | ✔ | ✔ | ~ | ✖ |
| Funziona con schermo bloccato | ✖ (limite iOS Safari) | ✔ | ✔ | ✔ | ✖ |
| Prezzo | in test | gratis | gratis + FCP iPad a pagamento | gratis / Plus | gratis limitato / a pagamento |

## 4. Note distintive possibili (cosa abbiamo e gli altri no, o meno)

1. **Zero installazione sulle camere.** Basta un link o un QR: ospiti, clienti e collaboratori partecipano senza scaricare nulla. Tra le app native non c'è; tra le web app c'è solo Shot.video.
2. **Qualsiasi dispositivo: iPhone, Android, iPad, PC.** Le migliori soluzioni gratuite sono legate a un solo sistema.
3. **I file vanno dove li vuoi tu.** Direttamente in una cartella del PC (Edge/Chrome), con verifica di integrità e ripresa dopo una caduta di rete, senza passare da un cloud. Chi usa Shot.video li manda al servizio.
4. **Pensata per i reel 9:16 e per DaVinci Resolve.** File con nome della camera e della sessione, nella cartella giusta. Blackmagic ci arriva da un'altra strada ed è più forte qui: va seguita.
5. **Sicurezza e controllo.** Comandi firmati, conferma Accetta/Rifiuta di ogni camera, avviso quando una camera resta senza regia. Non l'ho trovato dichiarato dai concorrenti, ma non l'ho cercato a fondo.
6. **Regia sul PC mentre il PC fa altro.** La regia sul computer continua a funzionare in secondo piano (provato in parte). Non ho verificato come si comportano gli altri in questa situazione.
7. **Vista Personalizzata con Calamita** (finestre libere che si adattano): un dettaglio di interfaccia che nelle altre non ho trovato.

## 5. Dove siamo deboli o a rischio

- **Blackmagic Camera è gratis, completa e di Blackmagic.** Se l'utente ha già installato app e monta in Resolve, il nostro vantaggio si riduce a "niente installazione" e "iPhone insieme ad altri".
- **Limiti del browser:** niente controllo vero di fuoco ed esposizione, niente 4K o slow-motion garantiti, camera silenziata se lo schermo si blocca o la pagina va in secondo piano (verificato sui nostri iPhone).
- **Shot.video fa già il caso "web + QR + montaggio assistito dall'IA".** Non sappiamo ancora come gestiscono l'esportazione verso Resolve né i prezzi regolari.
- **Prezzo:** la concorrenza gratuita rende difficile far pagare le funzioni base. Il valore da vendere è l'accesso senza installazione e il flusso di lavoro, non il REC sincronizzato in sé.

## 6. Cosa non ho potuto verificare

- Le pagine di **shot.video** e **camerama.us** non erano raggiungibili dalla sessione di lavoro (blocco di rete): dati su Shot.video presi solo dall'elenco su Product Hunt e dalla pagina dell'offerta; export verso Resolve/Premiere, limiti e prezzi regolari mancanti.
- Prezzi di Switcher, Riverside, Zencastr, StreamYard, Descript: cifre discordanti tra siti di confronto (spesso con link di affiliazione). Vanno presi dalle pagine ufficiali.
- Trasferimento file e prezzi di MultiCameraSync, SYNCAM, 1Take Pro.
- Se Blackmagic Camera permette di mischiare iPhone e Android nello stesso gruppo.
- Ricerca in inglese e su siti di app iOS: possono mancare concorrenti locali, app solo Android o strumenti per professionisti (NDI, Larix, ecc.).

## 7. Prossimi passi consigliati

1. **Provare a mano** Blackmagic Camera (con 2 iPhone e l'iPad), Unison e Shot.video (piano gratis) con lo stesso scenario delle nostre prove: 3 camere, REC comune, file nel PC. Annotare dove sono scomodi.
2. **Rileggere le pagine ufficiali** di Shot.video e Camerama (abilitando i domini nella rete della sessione, o incollandomi il testo) per completare la tabella.
3. **Parlare con 10–15 creator** che girano reel con più angolazioni: chiedere cosa usano, cosa li infastidisce, quanto pagherebbero.
4. **Scegliere la frase distintiva** (una riga) dopo le prove, prima di fissare prezzi e piani (Step 11).

## Fonti

- [Blackmagic Camera for iOS 2.0, remote control e multicam (CineD)](https://www.cined.com/blackmagic-camera-for-ios-2-0-adds-remote-control-multicam-and-more/)
- [Blackmagic Camera 2.0 per Android, controllo di più telefoni (CineD)](https://www.cined.com/blackmagic-camera-2-0-for-android-released-remote-control-of-multiple-phones-and-more/)
- [Blackmagic Camera 3.0: sincronizzazione dei clip remoti (Digital Production)](https://digitalproduction.com/2025/09/12/blackmagic-camera-3-0-remote-clip-syncing-and-multi-cam-control-arrive-on-smartphones/)
- [Blackmagic Camera 3.0, aggiornamento (No Film School)](https://nofilmschool.com/blackmagic-camera-30-update)
- [Apple: Live Multicam in Final Cut Pro per iPad](https://support.apple.com/guide/final-cut-pro-iPad/dev619b965f2/ipados)
- [Apple: Final Cut Camera](https://support.apple.com/120071)
- [Apple Newsroom: Final Cut Pro con Live Multicam (prezzi UK)](https://www.apple.com/uk/newsroom/2024/05/final-cut-pro-transforms-video-creation-with-live-multicam-on-ipad-and-new-ai-features-on-mac)
- [Unison su App Store](https://apps.apple.com/app/6756532053)
- [MultiCameraSync su App Store](https://apps.apple.com/us/app/multicamerasync/id6447541517)
- [SYNCAM su App Store](https://apps.apple.com/us/app/syncam-multi-device-capture/id6761366259)
- [1Take Pro, beta TestFlight (KVR Audio)](https://www.kvraudio.com/forum/viewtopic.php?p=9235776)
- [Camerama su App Store](https://apps.apple.com/us/app/camerama/id6473783208)
- [Shot.video su Product Hunt](https://www.producthunt.com/products/shot-video)
- [Shot.video, offerta Black Friday](https://shot.video/black-friday)
- [SplitCam: telefono come webcam](https://splitcam.com/phone-as-webcam)
- [Switcher Studio, prezzi](https://www.switcherstudio.com/lp/pricing)
- [Mevo, piano Pro](https://www.mevo.com/pages/pro)
- [Canon Live Switcher](https://www.usa.canon.com/mobile-apps/live-switcher-mobile)
- [Riverside: prezzi (Castmagic, blog di confronto)](https://www.castmagic.io/blog/riverside-pricing)
- [StreamYard: software di registrazione (blog del produttore)](https://streamyard.com/blog/affordable-podcast-recording-software)
