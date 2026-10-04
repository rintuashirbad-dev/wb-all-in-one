"""Generates the original SVG artwork used by the demo seed content."""
import random
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "static" / "img" / "seed"
OUT.mkdir(parents=True, exist_ok=True)


def blobs(rnd, w, h, colors, n=7):
    parts = []
    for _ in range(n):
        cx, cy, r = rnd.randint(0, w), rnd.randint(0, h), rnd.randint(h // 6, h // 2)
        parts.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{rnd.choice(colors)}" opacity="{rnd.uniform(.25, .6):.2f}"/>')
    return "".join(parts)


def hero(name, c1, c2, c3, seed, motif):
    rnd = random.Random(seed)
    w, h = 1600, 800
    cubes = []
    for _ in range(14):
        x, y, s = rnd.randint(0, w), rnd.randint(0, h), rnd.randint(30, 110)
        cubes.append(
            f'<g transform="translate({x} {y}) rotate({rnd.randint(0, 90)})" opacity="{rnd.uniform(.25, .7):.2f}">'
            f'<rect width="{s}" height="{s}" rx="{s // 5}" fill="url(#glass)" stroke="#ffffff" stroke-opacity=".5"/></g>'
        )
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" preserveAspectRatio="xMidYMid slice">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{c1}"/><stop offset=".55" stop-color="{c2}"/><stop offset="1" stop-color="{c3}"/></linearGradient>
<linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity=".05"/></linearGradient>
<filter id="blur"><feGaussianBlur stdDeviation="60"/></filter>
</defs>
<rect width="{w}" height="{h}" fill="url(#bg)"/>
<g filter="url(#blur)">{blobs(rnd, w, h, [c1, c3, "#ffffff", c2])}</g>
{''.join(cubes)}
<g transform="translate(1120 400)" opacity=".9">{motif}</g>
</svg>'''
    (OUT / name).write_text(svg)


GLOBE = '''<circle r="210" fill="url(#glass)" stroke="#fff" stroke-opacity=".7" stroke-width="3"/>
<ellipse rx="210" ry="80" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="3"/>
<ellipse rx="90" ry="210" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="3"/>
<line x1="-210" x2="210" stroke="#fff" stroke-opacity=".6" stroke-width="3"/>'''
DOC = '''<rect x="-150" y="-200" width="300" height="400" rx="30" fill="url(#glass)" stroke="#fff" stroke-opacity=".7" stroke-width="3"/>
<rect x="-100" y="-130" width="200" height="22" rx="11" fill="#fff" opacity=".8"/>
<rect x="-100" y="-80" width="160" height="16" rx="8" fill="#fff" opacity=".6"/>
<rect x="-100" y="-44" width="190" height="16" rx="8" fill="#fff" opacity=".6"/>
<rect x="-100" y="-8" width="130" height="16" rx="8" fill="#fff" opacity=".6"/>
<circle cx="70" cy="110" r="52" fill="#fff" opacity=".85"/><path d="M45 110 l18 18 l34 -38" stroke="#16a34a" stroke-width="12" fill="none" stroke-linecap="round"/>'''
PLAY = '''<rect x="-220" y="-150" width="440" height="300" rx="40" fill="url(#glass)" stroke="#fff" stroke-opacity=".7" stroke-width="3"/>
<circle r="80" fill="#fff" opacity=".9"/><path d="M-25 -42 L48 0 L-25 42 Z" fill="#e11d48"/>'''

hero("hero-1.svg", "#0f172a", "#1d4ed8", "#06b6d4", 1, GLOBE)
hero("hero-2.svg", "#1e1b4b", "#7c3aed", "#f472b6", 2, DOC)
hero("hero-3.svg", "#3f0d12", "#e11d48", "#f59e0b", 3, PLAY)


def card(name, c1, c2, glyph, seed):
    rnd = random.Random(seed)
    w, h = 800, 450
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" preserveAspectRatio="xMidYMid slice">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{c1}"/><stop offset="1" stop-color="{c2}"/></linearGradient>
<filter id="b"><feGaussianBlur stdDeviation="40"/></filter></defs>
<rect width="{w}" height="{h}" fill="url(#g)"/>
<g filter="url(#b)">{blobs(rnd, w, h, ["#ffffff", c1, c2], 5)}</g>
<rect x="290" y="115" width="220" height="220" rx="50" fill="#ffffff" fill-opacity=".22" stroke="#fff" stroke-opacity=".6" stroke-width="2"/>
<text x="400" y="262" font-size="120" text-anchor="middle" font-family="Segoe UI Emoji, Noto Color Emoji, sans-serif">{glyph}</text>
</svg>'''
    (OUT / name).write_text(svg)


card("gov.svg", "#1d4ed8", "#06b6d4", "🏛️", 11)
card("citizen.svg", "#059669", "#a3e635", "👥", 12)
card("private.svg", "#7c3aed", "#ec4899", "💼", 13)
card("scheme.svg", "#ea580c", "#facc15", "📜", 14)
card("news.svg", "#0f766e", "#38bdf8", "📰", 15)
card("videos.svg", "#be123c", "#fb7185", "▶️", 16)

(OUT / "logo.svg").write_text('''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
<defs><linearGradient id="l" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6366f1"/><stop offset=".5" stop-color="#06b6d4"/><stop offset="1" stop-color="#22c55e"/></linearGradient>
<linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".7"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
<rect x="6" y="6" width="108" height="108" rx="30" fill="url(#l)"/>
<path d="M60 26 L92 44 L92 76 L60 94 L28 76 L28 44 Z" fill="none" stroke="#fff" stroke-width="7" stroke-linejoin="round"/>
<circle cx="60" cy="60" r="12" fill="#fff"/>
<rect x="6" y="6" width="108" height="50" rx="30" fill="url(#s)" opacity=".6"/>
</svg>''')

rnd = random.Random(42)
n, cell = 25, 10
mods = []
for y in range(n):
    for x in range(n):
        finder = any(x0 <= x < x0 + 7 and y0 <= y < y0 + 7 for x0, y0 in [(0, 0), (n - 7, 0), (0, n - 7)])
        if finder:
            fx = x if x < 7 else x - (n - 7)
            fy = y if y < 7 else y - (n - 7)
            on = fx in (0, 6) or fy in (0, 6) or (2 <= fx <= 4 and 2 <= fy <= 4)
        else:
            on = rnd.random() < .5
        if on:
            mods.append(f'<rect x="{x * cell + 20}" y="{y * cell + 20}" width="{cell}" height="{cell}"/>')
size = n * cell + 40
(OUT / "qr-demo.svg").write_text(
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size + 30}"><rect width="{size}" height="{size + 30}" rx="16" fill="#fff"/>'
    f'<g fill="#111827">{"".join(mods)}</g><text x="{size / 2}" y="{size + 18}" font-size="16" text-anchor="middle" fill="#e11d48" font-family="sans-serif" font-weight="700">DEMO QR — replace in admin</text></svg>'
)
print("generated", sorted(p.name for p in OUT.iterdir()))
