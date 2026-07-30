# Sales Process — sito

Rifacimento di [salesprocess.it](https://salesprocess.it): **stessa struttura e
stessi testi dell'originale**, linguaggio visivo più moderno e meno "agenzia di
comunicazione". Bianco e nero come base, l'arancio del marchio `#FF8200`
riservato agli accenti.

Sei pagine: home, DNA, Prodotti, Team, Carriera, Eventi.

Sito statico: HTML, CSS e JavaScript scritti a mano, nessun framework, nessun
passaggio di build per pubblicarlo.

## Avvio in locale

```bash
python3 -m http.server 8000
# poi apri http://localhost:8000
```

Serve un server locale perché font, immagini e video sono file separati.

## Struttura

```
index.html                 home
dna.html                   origine, mission, vision, i 10 comandamenti
prodotti.html              le 4 risorse e il software All in One
team.html                  cultura aziendale e le 13 persone del team
carriera.html              aree di inserimento e candidature
eventi.html                prossimi appuntamenti
assets/css/style.css       token, componenti, responsive
assets/js/app.js           testata, menu, comparse, marquee, video
assets/fonts/              Red Hat Display variabile (SIL OFL)
assets/img/                logo, illustrazioni dei reparti, loghi clienti
assets/img/foto/           fotografia di marca, gia' convertita in bianco e nero
assets/video/              hero e sezione metodo, in più risoluzioni
tools/build-singlefile.py  genera le versioni a file singolo
dist/                      output del comando qui sopra
```

Header, menu e footer sono ripetuti in ogni file: il sito non ha un motore di
template, quindi una modifica a quei blocchi va riportata su tutte e sei le
pagine.

## Corrispondenza con l'originale

Le sezioni seguono l'ordine della home attuale e ne riprendono i testi alla
lettera:

| Sezione | Contenuto |
|---|---|
| Hero | *Più clienti / Più fatturato* + *"Uniamo la forza del Marketing a risposta diretta…"*, con il video di sfondo dell'evento di Misano |
| Loghi clienti | le 24 aziende presenti sul sito, in scorrimento continuo |
| 4 Reparti | *4 Reparti costantemente allineati* — Pubblicità, Marketing a Risposta Diretta, Reclutamento, Formazione, presentati come sequenza: l'immagine resta ferma e cambia mentre il testo scorre |
| Obiettivo | *Un unico obiettivo comune — Aumentare il fatturato della tua azienda* |
| Testimonianze | *Cosa dicono i nostri clienti* + *"Risultati concreti, non promesse…"* e i cinque nomi presenti sul sito |
| Metodo | *Incrementa i Profitti della tua Azienda grazie al METODO "4 in 1"* |
| Team | *Dietro ogni nostro successo…* con rimando alla pagina Team |
| Footer | *Hai un progetto? Vieni a prendere un caffè con noi!*, sedi, link utili, contatti, social |

Le altre pagine seguono lo stesso criterio:

| Pagina | Contenuto ripreso dall'originale |
|---|---|
| **DNA** | *"Dal 2020 aiutiamo gli Imprenditori italiani…"*, la nascita da 2 imprenditori, mission, vision e i **10 comandamenti** con i testi integrali |
| **Prodotti** | *Le nostre Risorse — la tua scala verso il successo*: Progetto 360, Dashboard dell'imprenditore, Il nostro libro, Fatturato Box, più **Sales Process All in One** con le sei funzioni elencate |
| **Team** | *Perché facciamo ciò che facciamo*, i tre blocchi di cultura aziendale e le **13 persone** con ruolo e biografia |
| **Carriera** | *Benvenuto nella nostra sezione Carriera* |
| **Eventi** | *I nostri eventi* e il webinar *"I numeri non mentono, ma non vendono"* del 9 dicembre |

La CTA *Candida la tua azienda* punta al quiz reale, i recapiti e i social alle
URL originali; i link fra pagine sono locali.

## Contesto di progetto

`PRODUCT.md` alla radice raccoglie registro, pubblico, personalità del marchio,
anti-riferimenti e principi. È il documento che guida ogni decisione visiva e va
letto prima di modificare il design.

Le skill di design stanno in `.claude/skills/`: `impeccable` definisce la
procedura, `reference/brand.md` le regole del registro vetrina. Il lavoro sul
sito le rispetta, in particolare i divieti espliciti elencati sotto.

## Scelte di progetto

**Tipografia.** Red Hat Display, lo stesso font del sito attuale, ma
self-hosted in versione variabile: un solo file da 44 KB copre i pesi da 300 a
900, senza chiamate a Google Fonts. I titoli usano il peso 900 con crenatura
stretta; il contrasto tra i pesi è quello che dà ritmo alla pagina.

**Colore.** Nero e bianco puri come nell'originale. L'arancio di marca `#FF8200`
resta tale sui fondi scuri (8,45:1), mentre sul bianco il testo piccolo usa
`#A85100` (5,47:1): il colore originale si ferma a 2,49:1 e non passerebbe AA. L'arancio compare solo su:
una parola dei titoli, i pulsanti d'azione, i numeri dei reparti al passaggio
del mouse, le etichette di sezione e i dettagli del piè di pagina. Il filmato
dell'hero è desaturato via CSS proprio per non introdurre altro colore.

**Tema unico.** La pagina non segue il tema chiaro/scuro del sistema: definisce
i propri fondi sezione per sezione, perché l'alternanza nero/bianco è parte
dell'identità e non una preferenza di lettura.

**Movimento.** Regola non negoziabile: **nessuna animazione nasconde il
contenuto**. Ogni `@keyframes` ha solo un fotogramma iniziale e nessun
`fill-mode`, quindi se l'animazione non parte — scheda in secondo piano,
renderer headless, JS assente — resta lo stato finale, cioè la pagina leggibile.

Gli arrivi in scena sono in CSS puro con `animation-timeline: view()`: nessun
IntersectionObserver, e famiglie diverse entrano in modo diverso invece di
ripetere la stessa dissolvenza ovunque. L'effetto principale è il rientro
dell'hero: scorrendo, il filmato passa da pieno schermo a riquadro, guidato da
`animation-timeline: scroll()`. Fra le pagine c'è una transizione con
`@view-transition`. Tutto si disattiva con `prefers-reduced-motion`, e i video
si fermano quando escono dallo schermo o quando la scheda passa in secondo piano.

**Composizione.** Nessuna sezione ripete l'impaginazione della precedente:
sequenza a scorrimento per i reparti, griglia irregolare per i comandamenti,
elenco editoriale per le persone, parete fotografica per i ritratti, fasce a
tutta larghezza fra un blocco e l'altro. Le griglie di schede identiche ripetute
all'infinito sono un divieto esplicito del registro, e il sito ne aveva tre: dieci
comandamenti uguali, tredici schede team uguali, quattro righe reparto uguali.

**Cosa è stato tolto, e perché.** Il registro vetrina vieta alcune scorciatoie
che il sito usava:

| Rimosso | Motivo |
|---|---|
| Etichetta maiuscola sopra ogni sezione (19 occorrenze) | Compare sul 55-95% delle pagine generate da AI: è impalcatura, non voce. Restano i titoli, che bastano. |
| Numeri 01–04 su reparti e prodotti | I numeri si guadagnano il posto solo quando il contenuto **è** una sequenza. Quattro reparti paralleli non lo sono. I 10 comandamenti restano numerati perché lì il numero è contenuto. |
| Hero a 168px, crenatura −0,045em | Sopra i 96px la pagina urla; sotto −0,04em le lettere si toccano. |
| Comparse legate a una classe messa dal JS | Le transizioni non scattano a scheda nascosta: la sezione sarebbe arrivata bianca. |
| Quattro righe reparto identiche | Diventate una sequenza: il nastro di immagini sosta su ogni fotogramma, sincronizzato col testo che scorre a fianco. |
| Dieci schede comandamento identiche | Tre principi cardine occupano il doppio dello spazio: la griglia dice quali reggono gli altri. |
| Tredici schede team identiche | Diventate un elenco editoriale: il nome porta il peso, la biografia sta a fianco con la misura giusta. |

## La fotografia

Le foto arrivano dalla libreria media del sito attuale, raggiungibile via
`wp-json/wp/v2/media`: 15 ritratti del team su parete ocra, due foto di gruppo,
la sala riunioni e i due fondatori ritagliati.

Sono tutte **convertite in bianco e nero** in fase di preparazione, non via
filtro CSS: il trattamento e' cosi' identico ovunque, i file pesano meno e
l'arancio resta una firma dell'interfaccia invece di competere con il colore
delle immagini. In totale 1,1 MB per 19 file.

```bash
ffmpeg -i originale.jpg \
  -vf "crop=in_h*0.75:in_h,scale=560:746,format=gray,eq=contrast=1.12" \
  -q:v 4 assets/img/foto/ritratto-1.jpg
```

Le fasce fotografiche a tutta larghezza hanno un'inquadratura che si allarga
appena mentre scorrono, legata a `animation-timeline: view()`: e' movimento
guidato dallo scorrimento, non un ciclo automatico.

**I ritratti non sono associati ai nomi.** Il sito attuale non pubblica quella
corrispondenza da nessuna parte, e attribuire un volto alla persona sbagliata
sarebbe un errore su persone reali: la parete di ritratti resta senza didascalie
e le schede con nome e ruolo restano tipografiche. Se mi passi l'abbinamento,
le unisco.

## I video

Il sito attuale serve come sfondo dell'hero un QuickTime da **183 MB**
(`AF09_Sales-Process_Misano_Aftermovie_2025.mov`, 1080p a 13,7 Mbit/s). Qui è
ricodificato in spezzoni brevi e leggeri:

| File | Uso | Peso |
|---|---|---|
| `hero-1280.webm` | hero, schermi ≥ 700px | 2,2 MB |
| `hero-1600.mp4` | hero, ripiego H.264 | 2,9 MB |
| `hero-960.mp4` / `.webm` | hero, mobile e anteprima | ~1 MB |
| `metodo-1280.mp4` | sezione metodo | 1,8 MB |

In totale circa 7 MB al posto di 183, con lo stesso materiale di marca. Il
secondo filmato del sito (`VIDEO-PRESENTAZIONE-SPIT-SITO.mp4`) non è utilizzabile
come sfondo perché ha i sottotitoli impressi nell'immagine: la sezione "metodo"
usa quindi un altro spezzone dell'aftermovie.

Per rigenerarli da una sorgente nuova:

```bash
ffmpeg -ss 50 -t 16 -i sorgente.mov -an -map 0:v:0 \
  -vf "scale=1600:-2,fps=25" -c:v libx264 -crf 31 -preset slow \
  -pix_fmt yuv420p -movflags +faststart assets/video/hero-1600.mp4
```

## Versioni a file singolo

```bash
python3 tools/build-singlefile.py          # -> dist/salesprocess.html (~3,9 MB)
python3 tools/build-singlefile.py --site   # -> dist/salesprocess-sito.html (~5,4 MB)
```

La prima contiene la sola home; la seconda tutte e sei le pagine, navigabili
dentro un unico documento tramite ancore.

CSS, JavaScript, font, immagini e video finiscono dentro il documento: nessuna
richiesta a domini esterni, comodo da mandare via mail o da pubblicare come
anteprima. Due dettagli tecnici: i browser non riproducono un `<video>` la cui
sorgente è un data URI pesante, quindi il filmato viaggia in base64 e viene
trasformato in blob al caricamento; e viene incorporato solo il VP9/WebM
(Chrome, Firefox, Edge, Safari 14.1+) per non raddoppiare il peso.

## Da sistemare prima della pubblicazione

- **Video delle testimonianze** — le schede (cinque in home ed eventi, otto in
  prodotti) rimandano al canale YouTube. Vanno collegate ai singoli video: sul
  sito attuale sono caricati su Vimeo.
- **Testi aggiunti** — tre punti non esistono sull'originale e sono stati scritti
  per non lasciare sezioni vuote: la descrizione del webinar in *Eventi*, il
  blocco *"Quattro reparti, una sola squadra"* con le aree di inserimento in
  *Carriera* (la pagina originale contiene solo il titolo di benvenuto) e le
  frasi di apertura sotto i titoli di *Prodotti*, *Team* ed *Eventi*. Da
  rivedere o sostituire.
- **Abbinamento ritratti/nomi** — i 15 ritratti sono in pagina come parete
  fotografica, senza nomi. Servono le corrispondenze per portarli nelle schede.
- **Posizioni aperte** — la pagina Carriera non ha annunci: vanno aggiunti quando
  ci sono, oppure va collegato il gestionale che usate.
- **Logo** — l'unica versione disponibile online è un AVIF da 293×68 px,
  ricompresso anche in PNG. Per gli schermi ad alta densità serve il file
  originale.
- **Loghi clienti** — sono i 24 presenti in home, senza nome azienda
  nell'attributo `alt`. Vanno aggiunti per accessibilità e SEO.
- **Analytics e banner cookie** — non presenti, da aggiungere secondo lo
  strumento in uso (il sito attuale usa iubenda).
- **Verifica AA** — l'audit automatico su tutte e sei le pagine non riporta
  problemi. L'unica segnalazione residua riguarda il testo "Menu" nella testata
  trasparente: misurato sui pixel reali il contrasto è 18,85:1, quindi è un
  falso positivo dello strumento, che risale al bianco della pagina invece che
  al filmato scuro sottostante.

## Licenza dei font

Red Hat Display è distribuito con SIL Open Font License 1.1; il testo completo
è in `assets/fonts/LICENSE-RedHatDisplay.txt`. Immagini, logo e filmati
appartengono a Sales Process Italia.
