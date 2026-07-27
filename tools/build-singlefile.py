#!/usr/bin/env python3
"""Genera versioni a file singolo del sito.

CSS, JavaScript, font, immagini e video vengono incorporati nel documento:
il risultato si apre anche con doppio clic, senza server e senza richieste a
domini esterni.

    python3 tools/build-singlefile.py             -> dist/salesprocess.html
                                                     (solo la home)
    python3 tools/build-singlefile.py --site      -> dist/salesprocess-sito.html
                                                     (tutte le pagine, navigabili)
    aggiungi --fragment per ottenere il contenuto senza involucro
    html/head/body, adatto alla pubblicazione come artifact.

Dei video viene incorporata solo la variante leggera da 960px: quelle a piena
risoluzione porterebbero il file oltre i 10 MB senza guadagno in anteprima.
"""

import argparse
import base64
import mimetypes
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"

PAGES = ["index", "dna", "prodotti", "team", "carriera", "eventi"]

# In anteprima incorporiamo un'unica sorgente per video, la più leggera:
# VP9/WebM, letto da Chrome, Firefox, Edge e Safari 14.1+. Il sito vero
# continua a servire anche l'H.264 per i browser più datati.
SWAP = {
    "assets/video/hero-1280.webm": "assets/video/hero-960.webm",
    "assets/video/hero-1600.mp4": None,
    "assets/video/hero-960.mp4": None,
    "assets/video/metodo-1280.mp4": "assets/video/metodo-960.webm",
}
BLOB_TYPE = "video/webm"

# Chromium non riproduce un <video> la cui sorgente è un data URI pesante:
# il filmato viaggia in base64 dentro la pagina e diventa un blob al
# caricamento. Le pagine condividono lo stesso filmato, quindi ogni sorgente
# viene incorporata una volta sola e assegnata a tutti i video che la usano.
BOOTSTRAP = """
(function () {
  var slots = document.querySelectorAll("script[data-video-key]");
  Array.prototype.forEach.call(slots, function (slot) {
    var key = slot.getAttribute("data-video-key");
    var targets = document.querySelectorAll('video[data-video-key="' + key + '"]');
    if (!targets.length) return;
    var bin = atob(slot.textContent.trim());
    var buf = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
    var url = URL.createObjectURL(new Blob([buf], { type: "__TYPE__" }));
    Array.prototype.forEach.call(targets, function (v) {
      v.src = url;
      v.load();
    });
  });
})();
""".replace("__TYPE__", BLOB_TYPE)

# Router dell'anteprima multipagina: i link fra pagine diventano ancore e le
# pagine sono nascoste a turno. Serve solo al file singolo, non al sito vero.
ROUTER = """
(function () {
  var pages = document.querySelectorAll(".pv-page");
  if (!pages.length) return;

  function show(name) {
    var found = false;
    Array.prototype.forEach.call(pages, function (p) {
      var match = p.id === "pv-" + name;
      p.hidden = !match;
      if (match) found = true;
    });
    if (!found) show("index");
    window.scrollTo(0, 0);
    document.querySelectorAll("video").forEach(function (v) {
      if (v.closest(".pv-page") && v.closest(".pv-page").hidden) v.pause();
      else if (v.hasAttribute("autoplay")) v.play().catch(function () {});
    });
  }

  function fromHash() {
    var h = (location.hash || "#pv-index").replace("#pv-", "");
    show(h || "index");
  }

  window.addEventListener("hashchange", fromHash);
  fromHash();
})();
"""

PREVIEW_CSS = """
/* anteprima a file singolo: una pagina per volta */
.pv-page[hidden] { display: none; }
"""

mimetypes.add_type("image/avif", ".avif")
mimetypes.add_type("font/woff2", ".woff2")


def uri(rel: str) -> str:
    path = ROOT / rel
    if not path.exists():
        sys.exit(f"asset mancante: {rel}")
    mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
    return f"data:{mime};base64," + base64.b64encode(path.read_bytes()).decode("ascii")


def inline_css(css: str) -> str:
    def swap(m):
        ref = m.group(1).strip("\"'")
        rel = str((ROOT / "assets/css" / ref).resolve().relative_to(ROOT))
        return f'url("{uri(rel)}")'
    return re.sub(r"url\(([^)]+)\)", swap, css)


def part(html: str, tag: str) -> str:
    m = re.search(rf"<{tag}\b[^>]*>(.*)</{tag}>", html, re.S)
    if not m:
        sys.exit(f"<{tag}> non trovato")
    return m.group(1)


def prepare(body: str, keys: set) -> str:
    """Toglie i <source>, marca i video e trasforma i percorsi in data URI."""

    def strip_sources(m):
        block = m.group(0)
        pick = None
        for s in re.findall(r'<source[^>]*src="(assets/[^"]+)"[^>]*>', block):
            s = SWAP.get(s, s)
            if s and s.endswith(".webm"):
                pick = s
                break
        block = re.sub(r"\s*<source[^>]*>", "", block)
        if pick:
            keys.add(pick)
            block = block.replace("<video", f'<video data-video-key="{pick}"', 1)
        return block

    body = re.sub(r"<video\b.*?</video>", strip_sources, body, flags=re.S)

    def swap_attr(m):
        attr, ref = m.group(1), m.group(2)
        ref = SWAP.get(ref, ref)
        if ref is None:
            return m.group(0)
        return f'{attr}="{uri(ref)}"'

    return re.sub(r'\b(src|srcset|poster)="(assets/[^"]+)"', swap_attr, body)


def build(fragment: bool, site: bool) -> pathlib.Path:
    home = (ROOT / "index.html").read_text(encoding="utf-8")
    css = inline_css((ROOT / "assets/css/style.css").read_text(encoding="utf-8"))
    js = (ROOT / "assets/js/app.js").read_text(encoding="utf-8")
    keys = set()

    shell = part(home, "body")
    shell = re.sub(r'\s*<script src="assets/js/app\.js"></script>', "", shell)
    head_html = shell[: shell.index('<main id="main">')]
    foot_html = shell[shell.index("</main>") + len("</main>"):]

    if site:
        css += PREVIEW_CSS
        blocks = []
        for name in PAGES:
            src = (ROOT / f"{name}.html").read_text(encoding="utf-8")
            blocks.append(
                '<div class="pv-page" id="pv-%s"%s>\n%s\n</div>'
                % (name, "" if name == "index" else " hidden", part(src, "main").strip())
            )
        middle = '<main id="main">\n' + "\n".join(blocks) + "\n</main>"
        title = "Sales Process — anteprima del sito"
        desc = "Anteprima navigabile del sito Sales Process: home, DNA, Prodotti, Team, Carriera ed Eventi."
    else:
        middle = '<main id="main">' + part(home, "main") + "</main>"
        title_m = re.search(r"<title>(.*?)</title>", home, re.S)
        title = title_m.group(1).strip() if title_m else "Sales Process"
        desc_m = re.search(r'<meta name="description" content="(.*?)"', home, re.S)
        desc = desc_m.group(1) if desc_m else ""

    body = prepare(head_html + middle + foot_html, keys)

    if site:
        body = re.sub(r'href="(%s)\.html"' % "|".join(PAGES), r'href="#pv-\1"', body)
    else:
        # nella versione a sola home i link alle altre pagine restano interni
        body = re.sub(r'href="(%s)\.html"' % "|".join(PAGES), r'href="\1.html"', body)

    payloads = "\n".join(
        '<script type="text/plain" data-video-key="%s">%s</script>'
        % (k, base64.b64encode((ROOT / k).read_bytes()).decode("ascii"))
        for k in sorted(keys)
    )

    inner = "\n".join([
        f"<title>{title}</title>",
        f"<style>\n{css}\n</style>",
        body.strip(),
        payloads,
        f"<script>{BOOTSTRAP}</script>",
        f"<script>\n{js}\n</script>",
        f"<script>{ROUTER}</script>" if site else "",
    ]).strip()

    DIST.mkdir(exist_ok=True)
    stem = "salesprocess-sito" if site else "salesprocess"
    if fragment:
        out = DIST / f"{stem}-fragment.html"
        out.write_text(inner + "\n", encoding="utf-8")
    else:
        out = DIST / f"{stem}.html"
        head, _, rest = inner.partition("</style>")
        out.write_text(
            '<!doctype html>\n<html lang="it">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
            f'<meta name="description" content="{desc}">\n'
            f"{head}</style>\n</head>\n<body>\n{rest.strip()}\n</body>\n</html>\n",
            encoding="utf-8",
        )

    print(f"{out.relative_to(ROOT)} — {out.stat().st_size / 1024 / 1024:.1f} MB")
    return out


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--fragment", action="store_true",
                    help="emette solo il contenuto, senza involucro html/head/body")
    ap.add_argument("--site", action="store_true",
                    help="include tutte le pagine, navigabili dentro un unico file")
    a = ap.parse_args()
    build(a.fragment, a.site)
