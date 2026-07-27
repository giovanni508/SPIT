#!/usr/bin/env python3
"""Genera una versione a file singolo del sito.

CSS, JavaScript e font vengono incorporati nel documento: il risultato è un
unico .html che si apre anche da filesystem, senza server e senza richieste
esterne. Utile per anteprime da mandare al cliente.

    python3 tools/build-singlefile.py            -> dist/salesprocess.html
    python3 tools/build-singlefile.py --fragment -> dist/salesprocess-fragment.html
                                                    (senza doctype/html/head/body)
"""

import argparse
import base64
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"

FONTS = {
    "../fonts/archivo-var.woff2": "assets/fonts/archivo-var.woff2",
    "../fonts/instrument-sans-var.woff2": "assets/fonts/instrument-sans-var.woff2",
    "../fonts/jetbrains-mono-var.woff2": "assets/fonts/jetbrains-mono-var.woff2",
}


def data_uri(path: pathlib.Path) -> str:
    payload = base64.b64encode(path.read_bytes()).decode("ascii")
    return f"data:font/woff2;base64,{payload}"


def build(fragment: bool) -> pathlib.Path:
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    css = (ROOT / "assets/css/style.css").read_text(encoding="utf-8")
    js = (ROOT / "assets/js/app.js").read_text(encoding="utf-8")

    for ref, rel in FONTS.items():
        src = ROOT / rel
        if not src.exists():
            sys.exit(f"font mancante: {rel}")
        css = css.replace(f'url("{ref}")', f'url("{data_uri(src)}")')

    title = re.search(r"<title>(.*?)</title>", html, re.S)
    title = title.group(1).strip() if title else "Sales Process"

    body = re.search(r"<body[^>]*>(.*)</body>", html, re.S)
    if not body:
        sys.exit("body non trovato in index.html")
    body = body.group(1)
    body = re.sub(r'\s*<script src="assets/js/app\.js"></script>', "", body)

    parts = [
        f"<title>{title}</title>",
        f"<style>\n{css}\n</style>",
        body.strip(),
        f"<script>\n{js}\n</script>",
    ]
    inner = "\n".join(parts)

    DIST.mkdir(exist_ok=True)
    if fragment:
        out = DIST / "salesprocess-fragment.html"
        out.write_text(inner + "\n", encoding="utf-8")
    else:
        out = DIST / "salesprocess.html"
        desc = re.search(r'<meta name="description" content="(.*?)"', html, re.S)
        meta = f'\n<meta name="description" content="{desc.group(1)}">' if desc else ""
        out.write_text(
            '<!doctype html>\n<html lang="it">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1">'
            f"{meta}\n{inner}\n</body>\n</html>\n".replace(
                f"<title>{title}</title>", f"<title>{title}</title>", 1
            ).replace(body.strip(), "</head>\n<body>\n" + body.strip(), 1),
            encoding="utf-8",
        )

    kb = out.stat().st_size / 1024
    print(f"{out.relative_to(ROOT)} — {kb:.0f} KB")
    return out


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--fragment", action="store_true",
                    help="emette solo il contenuto, senza involucro html/head/body")
    build(ap.parse_args().fragment)
