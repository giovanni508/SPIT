#!/usr/bin/env python3
"""Genera una versione a file singolo del sito.

CSS, JavaScript, font, immagini e video vengono incorporati come data URI:
il risultato è un unico .html che si apre anche con doppio clic, senza server
e senza richieste a domini esterni. Utile per anteprime e per la pubblicazione
come artifact.

    python3 tools/build-singlefile.py            -> dist/salesprocess.html
    python3 tools/build-singlefile.py --fragment -> dist/salesprocess-fragment.html
                                                    (senza doctype/html/head/body)

Dei video viene incorporata solo la variante leggera da 960px: quelle a
piena risoluzione porterebbero il file oltre i 10 MB senza guadagno visibile
in anteprima.
"""

import argparse
import base64
import mimetypes
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"

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
# il filmato viaggia in base64 dentro la pagina e viene trasformato in blob
# al caricamento. Resta tutto self-contained, senza richieste esterne.
BOOTSTRAP = """
(function () {
  var slots = document.querySelectorAll("script[data-video-for]");
  Array.prototype.forEach.call(slots, function (slot) {
    var video = document.getElementById(slot.getAttribute("data-video-for"));
    if (!video) return;
    var bin = atob(slot.textContent.trim());
    var buf = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
    video.src = URL.createObjectURL(new Blob([buf], { type: "__TYPE__" }));
    video.load();
  });
})();
""".replace("__TYPE__", BLOB_TYPE)

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
    return re.sub(r'url\(([^)]+)\)', swap, css)


def build(fragment: bool) -> pathlib.Path:
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    css = inline_css((ROOT / "assets/css/style.css").read_text(encoding="utf-8"))
    js = (ROOT / "assets/js/app.js").read_text(encoding="utf-8")

    title_m = re.search(r"<title>(.*?)</title>", html, re.S)
    title = title_m.group(1).strip() if title_m else "Sales Process"

    body_m = re.search(r"<body[^>]*>(.*)</body>", html, re.S)
    if not body_m:
        sys.exit("body non trovato in index.html")
    body = body_m.group(1)
    body = re.sub(r'\s*<script src="assets/js/app\.js"></script>', "", body)

    # i <source> spariscono: il filmato arriva come blob (vedi BOOTSTRAP)
    slots = []

    def strip_sources(m):
        block = m.group(0)
        vid = re.search(r'id="([^"]+)"', block)
        srcs = re.findall(r'<source[^>]*src="(assets/[^"]+)"[^>]*>', block)
        pick = None
        for s in srcs:
            s = SWAP.get(s, s)
            if s and s.endswith(".webm"):
                pick = s
                break
        if vid and pick:
            slots.append((vid.group(1), pick))
        return re.sub(r'\s*<source[^>]*>', "", block)

    body = re.sub(r'<video\b.*?</video>', strip_sources, body, flags=re.S)

    def swap_attr(m):
        attr, ref = m.group(1), m.group(2)
        if ref.startswith(("http", "data:", "#", "mailto:")):
            return m.group(0)
        ref = SWAP.get(ref, ref)
        return f'{attr}="{uri(ref)}"'

    body = re.sub(r'\b(src|srcset|poster|href)="(assets/[^"]+)"', swap_attr, body)

    payloads = "\n".join(
        '<script type="text/plain" data-video-for="%s">%s</script>'
        % (vid, base64.b64encode((ROOT / rel).read_bytes()).decode("ascii"))
        for vid, rel in slots
    )

    inner = "\n".join([
        f"<title>{title}</title>",
        f"<style>\n{css}\n</style>",
        body.strip(),
        payloads,
        f"<script>{BOOTSTRAP}</script>",
        f"<script>\n{js}\n</script>",
    ])

    DIST.mkdir(exist_ok=True)
    if fragment:
        out = DIST / "salesprocess-fragment.html"
        out.write_text(inner + "\n", encoding="utf-8")
    else:
        out = DIST / "salesprocess.html"
        desc_m = re.search(r'<meta name="description" content="(.*?)"', html, re.S)
        desc = f'\n<meta name="description" content="{desc_m.group(1)}">' if desc_m else ""
        head, _, rest = inner.partition("</style>")
        out.write_text(
            '<!doctype html>\n<html lang="it">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1">'
            f'{desc}\n{head}</style>\n</head>\n<body>\n{rest.strip()}\n</body>\n</html>\n',
            encoding="utf-8",
        )

    print(f"{out.relative_to(ROOT)} — {out.stat().st_size / 1024 / 1024:.1f} MB")
    return out


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--fragment", action="store_true",
                    help="emette solo il contenuto, senza involucro html/head/body")
    build(ap.parse_args().fragment)
