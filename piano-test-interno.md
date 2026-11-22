# Piano di test interno — Video System GDC Studio

Versioni da usare: **camera r38**, **dashboard r41**. Tutti i link da sviluppatore (con `?dev=1`): i log partono sempre e li leggo io. Dopo ogni prova scrivimi **"fatto"**, il numero della prova e, solo se serve, una riga su cosa hai visto.

## Cosa serve

- 1 PC con **Edge o Chrome** (regia). Un disco esterno o una chiavetta USB capienti.
- 1 **iPad** (regia alternativa, prove G e O).
- 2 o 3 **telefoni**: iPhone 15 (Safari), un secondo iPhone o Android (Chrome).
- Una **rete buona** (wifi o dati stabili). Per la prova B non serve la stessa rete.
- Telefoni carichi (almeno 50%) e con spazio libero. Schermo acceso e pagina camera aperta.
- Prima di ogni prova: ricarica le pagine e controlla in Avanzata "camera r34" e "dashboard r32".

## Ordine consigliato

**Se hai poco tempo:** A, P, O, B, C (e R se la regia gira sul PC). Poi N, Q, D, E. Le altre quando puoi.

## A. Collegamento e controllo iniziale (10 minuti)

**Scopo:** vedere se tutte le camere si collegano e se il "Controllo prima di iniziare" dice la verità.
1. Apri la dashboard sul PC e scegli la cartella dei file (disco esterno).
2. In regia premi **"+ Aggiungi camera"**: si apre una finestra con il QR. Inquadralo con la fotocamera di ogni telefono (o usa "Copia link").
3. Su ogni telefono: scrivi il nome, consenti camera e microfono, tocca "Avvia camera".
4. In regia tocca **Accetta** per ogni richiesta (anche dentro la finestra). Poi chiudi la finestra (Chiudi o Esc).
5. Guarda il "Controllo prima di iniziare".

**Atteso:** ogni camera online con il suo numero (Camera 1, 2, 3), batteria e minuti di spazio visibili, riga della cartella con ✓. Se manca un dato, scrivimi quale.

## P. Nome della sessione e Nuova sessione (5 minuti)

1. In "Aggiungi camera" scrivi un nome (per esempio "Prova uno"): deve comparire in intestazione.
2. Premi **"Nuova sessione"**, scrivi un nome, conferma. La pagina si ricarica.
3. **Atteso:** il QR è cambiato, l'elenco camere è vuoto, il nome è quello nuovo. I telefoni di prima non rispondono più. Riinquadra il QR nuovo e rientrano. Le clip già registrate restano sul telefono.

Aggiunta alla prova P (nuova sessione), con una camera collegata:
4. Con la camera **in registrazione**, premi "Nuova sessione" e conferma. **Atteso:** dopo pochi secondi la camera ferma la ripresa e salva la clip, si scollega e mostra "La regia ha chiuso la sessione… inquadra il QR valido della nuova sessione". Inquadra il QR nuovo: rientra.
5. Spegni (o chiudi la pagina di) una camera, fai "Nuova sessione", poi riaccendila: ha ancora il vecchio collegamento. **Atteso:** dopo circa 90 secondi compare "Nessuna regia collegata" con il pulsante "Scollega questa camera e inquadra un nuovo QR".

## O. Viste delle camere (10 minuti)

1. Con 2 o 3 camere collegate prova **Automatico**, **Scorrimento** (tocca le tessere numerate; prova ↔ e ↕).
2. Accendi **Funzioni Pro (prova)** e prova **Personalizzato**: sposta una camera dalla testata, ridimensionala dall'angolo, ricarica la pagina (devono restare), poi "Ripristina disposizione".
3. Ripeti su **iPad** e su **telefono**. Su telefono in verticale si deve partire da Scorrimento.
4. In **Avanzata**: Personalizzato subito disponibile, interruttore Pro assente.
5. Se puoi, prova con 4 o più camere.

**Dimmi:** se trascinare e ridimensionare col dito è comodo, come sembrano le anteprime con tante camere.

## B. Registrazione con più camere (15 minuti)

**Scopo:** REC/STOP insieme, zoom e anteprima con 2 o 3 camere.
1. "REC tutte" per 1 minuto, poi "STOP tutte".
2. Durante la registrazione prova lo zoom su una camera.
3. Ripeti con una sola camera.

**Atteso:** tutte partono e si fermano insieme, lo zoom è fluido, nessun file corrotto. Segna se una camera è in ritardo o perde il collegamento.

## C. Trasferimento sul disco del PC (20 minuti)

**Scopo:** la prova che finora manca: trasferimento reale su rete buona, in una cartella vera.
1. Registra 1 minuto con 2 camere. Con "Trasferisci" a mano, manda i file nella cartella.
2. Guarda la barra di avanzamento, la velocità e il messaggio finale.
3. Apri i file nella cartella e guardali (immagine e audio).

**Atteso:** file arrivati e verificati, riproducibili, stessa dimensione. Dimmi i Mbps e i minuti impiegati.

## N. Permesso REC dal telefono e modi di ripresa (10 minuti)

1. Sul telefono, di default, non c'è il pulsante REC. Nel dettaglio della camera accendi "Il telefono può avviare e fermare la registrazione da solo": sul telefono compare un pulsante grande REC/STOP. Avvia dal telefono e ferma dalla regia, poi viceversa.
2. Nella home accendi "Tutte le camere possono avviare…": compare su tutti i telefoni e anche su uno nuovo che entra. Spegni: sparisce ovunque.
3. Metti una camera in modo **Time-lapse** (selettore "Modo" accanto a REC) e un'altra in **Video**. Premi "REC tutte": una registra, l'altra fa il time-lapse. "STOP tutte" le ferma e il time-lapse produce il suo video.

## Q. Anteprima sulla pagina camera (5 minuti)

Con la camera accesa, sul telefono deve comparire l'immagine a tutto campo con la griglia dei terzi e "Anteprima in diretta · qualità". In registrazione compare il badge **REC con il tempo**; con lo zoom dalla regia compare "2,0×".
**Dimmi:** se l'anteprima è troppo grande o copre i pulsanti (su iPhone e su Android).

## D. Cartella che sparisce (10 minuti)

**Scopo:** il caso del disco scollegato.
1. Avvia un trasferimento lungo (clip di almeno 1–2 minuti).
2. A metà, **scollega il disco**.
3. Aspetta circa 10 secondi e **ricollegalo**.

**Atteso:** il trasferimento passa a "interrotto" con la nota sulla cartella, poi riparte da solo. Il file finale è completo e la clip è ancora sul telefono finché non arriva. Se il disco è pieno, la nota deve dirlo.

## E. Automatico e buffer a rotazione (15 minuti)

1. Accendi "Trasferisci da solo ogni clip appena fermo la registrazione" e "Elimina dal telefono dopo il trasferimento verificato".
2. Registra 3 clip brevi di seguito su una camera. Dopo ogni STOP aspetta.
3. Prova anche a ricominciare a registrare mentre il trasferimento della clip precedente è in corso.

**Atteso:** ogni clip parte da sola dopo lo STOP, non durante la ripresa. Sul telefono restano solo le clip non ancora arrivate. Le clip nuove non vengono perse.

## F. Anteprima durante i trasferimenti (10 minuti)

1. Trasferisci un file da 1 minuto con "Tieni l'anteprima accesa durante i trasferimenti" **accesa**.
2. Ripeti con la spunta **spenta**.

**Atteso:** annota le due velocità e se in uno dei casi il trasferimento si ferma.

## G. iPad come regia (30 minuti)

1. Apri la dashboard sull'iPad, in Avanzata premi **"Misura memoria di questo dispositivo"** e lascia la pagina aperta (può durare qualche minuto; se la pagina si chiude, riaprila: il registro riporta fino a quanto ha retto).
2. Trasferisci una clip da 1 minuto e una da 2 minuti. Tocca Salva e scegli il disco o la chiavetta.
3. Prova a trasferire più file senza salvare, finché compare l'avviso.

**Atteso:** valore reale della memoria, salvataggio funzionante, avviso chiaro quando il tetto è raggiunto.

## H. Spazio (15 minuti)

1. Misura a 16 GB (te lo preparo prima: serve solo un tetto più alto).
2. Con lo spazio quasi pieno, avvia una registrazione: deve fermarsi da sola senza rovinare il file.
3. Prova la spunta "elimina le clip già trasferite" con lo spazio al limite.

## I. Android (se hai un telefono) (20 minuti)

REC, trasferimento, zoom e batteria, come nelle prove B e C.

## L. Batteria su iPhone (facoltativa)

Con il collegamento Comandi, per vedere la batteria da Safari. Per ora la dashboard mostra "n/d" su iPhone.

## M. Chiave della regia (10 minuti)

1. Dalla finestra "Aggiungi camera" apri un telefono nuovo dal QR (il link ha la chiave pubblica). Dai REC e STOP dalla regia.
2. In Avanzata, sulla camera, la riga "Protezione" deve dire "comandi firmati dalla regia".
3. Apri la dashboard su un secondo dispositivo con **"Copia link dashboard"** (pannello Collegamento, Avanzata): deve poter comandare la camera.
4. Apri la dashboard su un secondo dispositivo con il link della **camera**: la camera non deve obbedire e la regia deve scrivere "non autorizzato".
5. Un telefono aperto con un link vecchio (senza chiave) resta comandabile, e "Protezione" dice "nessuna".

## R. Regia in secondo piano su Edge (15 minuti)

**Scopo:** vedere se il PC può restare con la regia aperta mentre lo usi per altro.
1. Apri la dashboard in **Edge**, in una finestra sua (meglio "Installa come app"), con 1 o 2 camere collegate. Imposta la cartella dei file.
2. Avvia un trasferimento lungo (clip da almeno 1–2 minuti) e intanto lavora su altro: copri la finestra con altre, **senza ridurla a icona**, per 5 minuti.
3. Poi **riducila a icona** per 5 minuti, con una camera che registra (REC/STOP dai comandi rapidi o dal telefono con permesso REC).
4. Riportala in primo piano e guarda se le camere sono ancora online, se il trasferimento è andato avanti e se i contatori sono giusti.

**Atteso:** nessuna camera segnata offline per sbaglio, trasferimento senza interruzioni. Nei log cerco: "visibilità: nascosta / di nuovo visibile dopo N s", "timer in ritardo" e, se una camera viene segnata offline, lo stato della regia in quel momento.

## Cosa mi mandi

Per ogni prova: **"fatto"**, il numero della prova, e un commento solo se qualcosa ti ha stupito. Il resto lo leggo nei log (stato, velocità, errori, tempi).

---

# Proposta Base / Avanzata per il test interno

**Principio:** in Base solo ciò che serve a fare una ripresa e a vedere se va tutto bene. In Avanzata ciò che serve a me o a diagnosticare. I log restano sempre attivi con i link da sviluppatore.

## Camera (telefono)

| In Base | In Avanzata |
|---|---|
| Avvia/ferma camera, nome, schermo nero | Link della camera (copia) |
| Stato di collegamento | Dati per Comandi, prova batteria |
| Batteria e minuti di spazio rimasti | Test zoom digitale, misura spazio reale |
| Indicatore di registrazione e trasferimento | REC locale di prova |
| Avvisi (spazio quasi finito, camera ferma) | Pannello log tecnico, versione, sonde |

## Dashboard (regia)

| In Base | In Avanzata |
|---|---|
| Elenco camere con stato, batteria, spazio | Registro tecnico, collegamento |
| "Controllo prima di iniziare" | Prova velocità rete, misura memoria |
| REC tutte / STOP tutte, REC/STOP per camera | Pan / Tilt, sistema operativo della camera |
| Zoom, anteprima, risoluzione e qualità | Dettagli di stato e conteggi |
| Cartella, "Verifica cartella", trasferimento (a mano e automatico), elimina dal telefono, anteprima durante i trasferimenti | |

Da verificare insieme: cosa spostare in Base dopo i primi test (per esempio "Dati per Comandi" quando useremo iPhone con batteria).

---

# Test del workflow "aggiungi un telefono"

**Cosa esiste oggi:** ogni telefono si collega con un link. Non c'è un QR né un codice. Esistono solo i mockup.

**Cosa possiamo provare subito, senza server nuovi:**
- La dashboard mostra un **QR** che contiene il link di una camera nuova. Col telefono lo inquadri con la fotocamera e si apre la pagina camera già collegata.
- Una spunta sulla dashboard per **accettare o rifiutare** chi entra (la tua idea): la camera chiede di entrare, la regia vede "Camera 2 vuole entrare" e conferma.

**Cosa richiede una scelta e un po' di server:**
- Il **codice a 8 caratteri**. Serve una piccola tabella che associa il codice alla sessione. Va deciso se usare GDC-project 2 o un progetto nuovo per il pubblico (domanda ancora aperta).

**Ordine proposto:** prima QR più accetta/rifiuta, perché ti dice subito se il flusso è comodo. Il codice lo aggiungiamo dopo, quando decidiamo il progetto.
