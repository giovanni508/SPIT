# Sales Process — sito

Restyling del sito [salesprocess.it](https://salesprocess.it) in chiave moderna:
stessa struttura narrativa, linguaggio visivo meno "agenzia creativa" e più
strumento di misura. Bianco e nero come base, arancio del marchio riservato agli
accenti.

Sito statico: HTML, CSS e JavaScript scritti a mano, nessun framework, nessun
passaggio di build necessario per pubblicarlo.

## Avvio in locale

```bash
python3 -m http.server 8000
# poi apri http://localhost:8000
```

Serve un server locale (anche il più semplice) perché i font sono caricati come
file separati.

## Struttura

```
index.html                 pagina unica, tutte le sezioni
assets/css/style.css       token, componenti, responsive
assets/js/app.js           tema, menu, rivelazioni, simulatore, flusso animato
assets/fonts/              Archivo, Instrument Sans, JetBrains Mono (SIL OFL)
tools/build-singlefile.py  genera la versione a file singolo
dist/                      output del comando qui sopra
```

### Versione a file singolo

```bash
python3 tools/build-singlefile.py
# -> dist/salesprocess.html  (~280 KB, si apre anche con doppio clic)
```

CSS, JavaScript e font finiscono dentro il documento: nessuna richiesta a
domini esterni, comodo per mandare un'anteprima al cliente.

## Scelte di progetto

**Colore.** Fondo bianco `#FFFFFF` e inchiostro `#0E0D0C`, grigi con una leggera
componente calda perché convivono con l'arancio. L'arancio `#FF5A00` compare
solo dove deve guidare l'occhio: una parola del titolo, il flusso "chiuso"
nell'animazione, i pulsanti d'azione, la colonna "con il processo", i delta
positivi. Mai come fondo di intere sezioni.

**Tipografia.** Archivo (asse di larghezza variabile) per i titoli, tenuti in
maiuscolo e leggermente estesi; Instrument Sans per il testo corrente;
JetBrains Mono per etichette, codici di reparto e dati. Tutti self-hosted:
nessuna chiamata a Google Fonts, nessun fallback silenzioso.

**Layout.** Rettangoli a spigolo vivo separati da filetti da 1px, niente ombre
né angoli arrotondati. Le sezioni si alternano tra fondo chiaro e fondo scuro
per scandire il ritmo senza ricorrere a decorazioni.

**Tema chiaro e scuro.** Entrambi progettati, non invertiti. La pagina segue la
preferenza di sistema e l'interruttore in testata la sovrascrive; la scelta
resta salvata in `localStorage`.

**Movimento.** Tre soli comportamenti: il flusso animato dell'hero, la
comparsa dei blocchi allo scorrimento e i micro-stati al passaggio del mouse.
Tutto si disattiva con `prefers-reduced-motion`.

## Elementi interattivi

**Flusso dell'hero** (`assets/js/app.js`, sezione 5). Simulazione su canvas di
contatti che attraversano quattro fasi: a ogni soglia una parte passa e il
resto si disperde. I tassi sono in `PASS`. L'animazione si ferma quando esce
dallo schermo o quando la scheda passa in secondo piano, e ha una versione
statica per chi ha ridotto le animazioni.

**Simulatore dei ricavi** (sezione "I tuoi numeri"). Tre valori in ingresso
(appuntamenti al mese, tasso di chiusura, valore medio cliente) e il confronto
su base annua con lo scenario "con il processo". Le due ipotesi sono costanti
dichiarate in cima alla funzione:

```js
var GAIN_APPT  = 1.25;  // +25% appuntamenti utili
var GAIN_CLOSE = 8;     // +8 punti di tasso di chiusura
```

Cambiando quei due numeri cambia lo scenario mostrato. Sotto al risultato c'è
una nota che dichiara le ipotesi: è uno strumento per ragionare sugli ordini di
grandezza, non una promessa.

## Da completare prima della pubblicazione

Il sito è stato scritto senza poter accedere al testo originale
(`salesprocess.it` risponde 403 alle richieste automatiche), quindi i contenuti
sono ricostruiti a partire da fonti pubbliche. Prima di andare online:

- **Testimonianze** — i tre virgolettati nella sezione "Le voci" sono
  segnaposto realistici, attribuiti solo per ruolo e settore. Vanno sostituiti
  con dichiarazioni reali e autorizzate, o rimossi.
- **Numeri della fascia dati** — 4 reparti, 6 mesi, 1–10 M€, 0. Sono affermazioni
  di struttura, non risultati: verificare che rispecchino l'offerta attuale.
- **Link** — il pulsante punta a `go.salesprocess.it/prenota-call`. Da
  confermare, insieme all'indirizzo e-mail e ai profili social nel piè di pagina.
- **Pagine legali** — Privacy, Cookie e Note legali sono link vuoti (`#`).
- **Indirizzi** — sede legale e uffici vanno confrontati con la visura.
- **Analytics e cookie banner** — non presenti, da aggiungere secondo lo
  strumento scelto.

## Licenze dei font

Archivo, Instrument Sans e JetBrains Mono sono distribuiti con SIL Open Font
License 1.1. Le licenze complete sono in `assets/fonts/`.
