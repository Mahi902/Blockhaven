#!/usr/bin/env python3
"""Generates Blockhaven's SVG sprites: 16 colour variations per furniture,
floor textures, player sprites and UI icons.  Run from the repo root:
    python3 tools/gen_assets.py
Hand-drawn art can replace any generated file; the game only cares about the
file names (see docs/FURNITURE.md)."""
import os, math, random

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

COLORS = {
    "white": "#f4f4f2", "light gray": "#c9cdd3", "gray": "#8b919a", "black": "#33353c",
    "brown": "#8a5a3b", "red": "#e03c3c", "orange": "#f28a2e", "yellow": "#f6d43c",
    "lime": "#9ee03a", "green": "#2fa953", "cyan": "#2bc9d8", "light blue": "#7fc6f6",
    "blue": "#3166e0", "purple": "#8c52d8", "magenta": "#d63fc0", "pink": "#f8a5c9",
}

def _hex(c):
    c = c.lstrip('#')
    return [int(c[i:i + 2], 16) for i in (0, 2, 4)]

def _rgb(r, g, b):
    return '#%02x%02x%02x' % tuple(max(0, min(255, int(round(v)))) for v in (r, g, b))

def shade(c, f):
    r, g, b = _hex(c)
    if f < 0:
        return _rgb(r * (1 + f), g * (1 + f), b * (1 + f))
    return _rgb(r + (255 - r) * f, g + (255 - g) * f, b + (255 - b) * f)

def svg(w, h, body, scale=2):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w * scale}" height="{h * scale}" '
            f'viewBox="0 0 {w} {h}">{body}</svg>\n')

def rect(x, y, w, h, fill, r=0, stroke=None, sw=1.5, op=None):
    s = f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}"'
    if stroke:
        s += f' stroke="{stroke}" stroke-width="{sw}"'
    if op is not None:
        s += f' opacity="{op}"'
    return s + '/>'

def circ(cx, cy, r, fill, stroke=None, sw=1.5, op=None):
    s = f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{fill}"'
    if stroke:
        s += f' stroke="{stroke}" stroke-width="{sw}"'
    if op is not None:
        s += f' opacity="{op}"'
    return s + '/>'

def shadow(x, y, w, h, r=6):
    return rect(x + 2, y + 3, w, h, '#000', r, op=0.22)

# ---------------------------------------------------------------- furniture
def couch(c):
    l = shade(c, .22)
    b = shadow(3, 4, 138, 42, 8)
    b += rect(3, 4, 138, 42, shade(c, -.28), 9, shade(c, -.5))
    b += rect(8, 6, 128, 13, shade(c, -.12), 6)
    for i in range(3):
        b += rect(15 + i * 38, 18, 36, 25, c, 6, shade(c, -.38))
        b += rect(19 + i * 38, 21, 28, 5, l, 3, op=.55)
    b += rect(4, 8, 12, 36, shade(c, -.15), 6, shade(c, -.5))
    b += rect(128, 8, 12, 36, shade(c, -.15), 6, shade(c, -.5))
    return svg(144, 48, b)

def bed(c):
    b = shadow(3, 3, 90, 138, 7)
    b += rect(3, 3, 90, 138, '#6a4a31', 7, '#3d2a1b')
    b += rect(8, 14, 80, 122, '#fbfbf9', 5, '#cfcfc8')
    b += rect(12, 18, 33, 22, '#ffffff', 8, '#c9c9c4')
    b += rect(51, 18, 33, 22, '#ffffff', 8, '#c9c9c4')
    b += rect(8, 52, 80, 84, c, 5, shade(c, -.4))
    b += rect(8, 52, 80, 14, shade(c, .35), 4, op=.9)
    for i in range(4):
        b += rect(14, 76 + i * 14, 68, 3, shade(c, -.2), 1.5, op=.5)
    return svg(96, 144, b)

def tv(c):
    b = shadow(3, 6, 90, 38, 6)
    b += rect(3, 6, 90, 38, c, 6, shade(c, -.5))
    b += rect(8, 10, 80, 5, shade(c, .3), 2, op=.6)
    b += rect(10, 17, 76, 8, '#15171d', 2, '#000')
    b += rect(12, 22, 72, 2.5, '#6f8cff', 1, op=.85)
    b += rect(38, 27, 20, 4, shade(c, -.3), 2)
    return svg(96, 48, b)

def chair(c):
    b = shadow(7, 6, 34, 36, 6)
    for x, y in ((8, 8), (36, 8), (8, 36), (36, 36)):
        b += rect(x - 2, y - 2, 6, 6, shade(c, -.55), 2)
    b += rect(7, 5, 34, 9, shade(c, -.3), 4, shade(c, -.5))
    b += rect(8, 13, 32, 29, c, 6, shade(c, -.4))
    b += rect(12, 17, 24, 5, shade(c, .3), 3, op=.55)
    return svg(48, 48, b)

def table(c):
    b = shadow(4, 5, 88, 86, 10)
    b += rect(4, 5, 88, 86, c, 10, shade(c, -.5), 2)
    b += rect(9, 10, 78, 76, 'none', 7, shade(c, .3), 1.5)
    b += rect(14, 14, 68, 10, shade(c, .35), 5, op=.45)
    b += circ(48, 48, 12, shade(c, -.3), shade(c, -.5), 1.2, op=.35)
    return svg(96, 96, b)

def bookshelf(c):
    cols = ['#d94a4a', '#e6a93a', '#4a86d9', '#58b36a', '#8d5bd1', '#e8e2d0', '#d96fa8']
    b = shadow(3, 6, 90, 38, 4)
    b += rect(3, 6, 90, 38, c, 4, shade(c, -.5))
    b += rect(7, 9, 82, 6, shade(c, .28), 2, op=.7)
    x = 8
    for i in range(12):
        w = 5 + (i * 3) % 4
        b += rect(x, 27, w, 12, cols[i % len(cols)], 1, '#00000055', .8)
        x += w + 1
        if x > 84:
            break
    b += rect(7, 24, 82, 2.5, shade(c, -.45), 1)
    return svg(96, 48, b)

def lamp(c):
    d = shade(c, -.35)
    b = circ(26, 27, 20, '#000', op=.2)
    b += circ(24, 24, 20, c, d, 2)
    b += circ(24, 24, 15, shade(c, .35), None, op=.5)
    b += circ(24, 24, 9, shade(c, .35), None, op=.5)
    b += circ(24, 24, 4.5, shade(c, -.55), '#222', 1)
    for a in range(8):
        b += (f'<line x1="24" y1="24" x2="{24 + 19 * math.cos(a * math.pi / 4):.1f}" '
              f'y2="{24 + 19 * math.sin(a * math.pi / 4):.1f}" stroke="{d}" stroke-width="1" opacity=".5"/>')
    return svg(48, 48, b)

def plant(c):
    b = circ(26, 27, 18, '#000', op=.2)
    leaves = ''
    for i in range(8):
        a = i * math.pi / 4
        x, y = 24 + 11 * math.cos(a), 24 + 11 * math.sin(a)
        leaves += (f'<ellipse cx="{x:.1f}" cy="{y:.1f}" rx="12" ry="5" '
                   f'transform="rotate({a * 180 / math.pi:.0f} {x:.1f} {y:.1f})" '
                   f'fill="{"#2f9e4f" if i % 2 else "#3cb85f"}" stroke="#1f6e36" stroke-width="1"/>')
    b += circ(24, 24, 19, c, shade(c, -.5), 2)
    b += circ(24, 24, 15, '#5a3d28')
    b += leaves
    b += circ(24, 24, 4, '#55d27a', '#1f6e36', 1)
    return svg(48, 48, b)

def fridge(c):
    b = shadow(4, 5, 40, 40, 5)
    b += rect(4, 4, 40, 40, c, 5, shade(c, -.5), 1.8)
    b += rect(8, 8, 32, 6, shade(c, .35), 2, op=.65)
    b += rect(8, 18, 32, 22, shade(c, -.06), 3, shade(c, -.3), 1)
    b += rect(36, 30, 3, 10, shade(c, -.55), 1.5)
    b += rect(36, 15, 3, 8, shade(c, -.55), 1.5)
    return svg(48, 48, b)

def wardrobe(c):
    b = shadow(3, 6, 90, 38, 4)
    b += rect(3, 5, 90, 39, c, 4, shade(c, -.5), 1.8)
    b += rect(8, 9, 80, 6, shade(c, .3), 2, op=.6)
    b += rect(7, 20, 40, 21, shade(c, -.08), 2, shade(c, -.32), 1)
    b += rect(49, 20, 40, 21, shade(c, -.08), 2, shade(c, -.32), 1)
    b += rect(42, 26, 3, 10, shade(c, -.55), 1.5) + rect(51, 26, 3, 10, shade(c, -.55), 1.5)
    return svg(96, 48, b)

def nightstand(c):
    b = shadow(6, 7, 36, 34, 4)
    b += rect(6, 6, 36, 36, c, 4, shade(c, -.5), 1.8)
    b += rect(10, 10, 28, 5, shade(c, .3), 2, op=.6)
    b += rect(10, 20, 28, 17, shade(c, -.07), 2, shade(c, -.3), 1)
    b += rect(20, 27, 8, 3, shade(c, -.55), 1.5)
    return svg(48, 48, b)

def armchair(c):
    b = shadow(4, 4, 40, 40, 10)
    b += rect(4, 4, 40, 40, shade(c, -.28), 10, shade(c, -.5))
    b += rect(9, 6, 30, 11, shade(c, -.12), 6)
    b += rect(13, 16, 22, 24, c, 6, shade(c, -.38))
    b += rect(16, 19, 16, 4, shade(c, .3), 2, op=.55)
    b += rect(4, 10, 9, 32, shade(c, -.15), 5, shade(c, -.5))
    b += rect(35, 10, 9, 32, shade(c, -.15), 5, shade(c, -.5))
    return svg(48, 48, b)

def desk(c):
    b = shadow(3, 5, 90, 38, 4)
    b += rect(3, 5, 90, 38, c, 4, shade(c, -.5), 1.8)
    b += rect(7, 8, 82, 4, shade(c, .3), 2, op=.5)
    b += rect(30, 11, 36, 14, '#15171d', 2, '#000')
    b += rect(33, 13, 30, 9, '#6f8cff', 1, op=.85)
    b += rect(44, 25, 8, 3, shade(c, -.45), 1)
    b += rect(32, 30, 32, 8, shade(c, .3), 2, shade(c, -.4), 1)
    for i in range(6):
        b += rect(34 + i * 5, 32, 4, 2, shade(c, -.25), .6, op=.7)
        b += rect(34 + i * 5, 35, 4, 2, shade(c, -.25), .6, op=.7)
    b += circ(72, 34, 3, shade(c, -.3), shade(c, -.55), 1)
    b += circ(14, 18, 5, '#f4f4f2', '#999', 1) + circ(14, 18, 3.2, '#6b4a31')
    return svg(96, 48, b)

def stove(c):
    b = shadow(4, 5, 40, 40, 5)
    b += rect(4, 4, 40, 40, c, 5, shade(c, -.5), 1.8)
    b += rect(7, 7, 34, 26, shade(c, -.1), 3, shade(c, -.35), 1)
    for x, y in ((15, 15), (33, 15), (15, 26), (33, 26)):
        b += circ(x, y, 6, '#2a2c33', shade(c, -.55), 1.2)
        b += circ(x, y, 3.4, 'none', '#6a6e78', 1)
    for i in range(4):
        b += circ(11 + i * 8.7, 38, 2.4, shade(c, -.55), shade(c, -.7), .8)
    return svg(48, 48, b)

def stereo(c):
    b = shadow(5, 8, 38, 30, 5)
    b += rect(5, 8, 38, 30, c, 5, shade(c, -.5), 1.8)
    b += rect(9, 11, 30, 5, '#15171d', 2) + rect(12, 12.5, 12, 2, '#ffd27a', 1, op=.9)
    b += circ(15, 28, 7, shade(c, -.3), shade(c, -.55), 1.2) + circ(15, 28, 3, shade(c, -.6))
    b += circ(33, 28, 7, shade(c, -.3), shade(c, -.55), 1.2) + circ(33, 28, 3, shade(c, -.6))
    b += circ(31, 13.5, 1.6, shade(c, .4), shade(c, -.5), .6)
    b += f'<line x1="38" y1="8" x2="44" y2="2" stroke="{shade(c, -.55)}" stroke-width="1.4"/>'
    return svg(48, 48, b)

def bathtub(c):
    b = shadow(3, 4, 138, 42, 12)
    b += rect(3, 4, 138, 42, c, 12, shade(c, -.5), 2)
    b += rect(10, 10, 124, 30, '#bfe8ff', 10, shade(c, -.3), 1.5)
    b += rect(16, 14, 60, 5, '#ffffff', 3, op=.55)
    for x, y, r in ((50, 28, 4), (62, 31, 3), (95, 24, 4.5), (108, 30, 3), (82, 33, 2.5)):
        b += circ(x, y, r, '#ffffff', '#9fd3ee', .8, op=.85)
    b += rect(12, 18, 9, 14, '#d5d9de', 3, '#777', 1) + circ(16, 25, 2.5, '#9aa0a8', '#555', .8)
    return svg(144, 48, b)

def fireplace(c):
    b = shadow(3, 5, 90, 38, 4)
    b += rect(3, 5, 90, 38, c, 4, shade(c, -.5), 1.8)
    b += rect(7, 8, 82, 5, shade(c, .3), 2, op=.55)
    b += rect(26, 16, 44, 25, '#1b1512', 4, shade(c, -.6), 1.5)
    b += ('<path d="M48 39 Q38 32 44 24 Q46 29 49 26 Q50 20 54 17 Q56 26 60 29 Q64 34 58 39Z" '
          'fill="#f28a2e" stroke="#c4561b" stroke-width="1"/>')
    b += '<path d="M49 39 Q45 35 49 31 Q51 34 54 33 Q57 36 55 39Z" fill="#f6d43c"/>'
    b += rect(36, 37, 24, 3, '#6a4a31', 1.5)
    return svg(96, 48, b)

def piano(c):
    b = shadow(3, 5, 90, 38, 5)
    b += rect(3, 5, 90, 38, c, 5, shade(c, -.5), 1.8)
    b += rect(7, 8, 82, 8, shade(c, -.15), 2) + rect(36, 10, 24, 4, shade(c, .35), 1, op=.5)
    b += rect(7, 19, 82, 21, '#fbfbf9', 2, '#9a9a94', 1)
    for i in range(1, 14):
        b += f'<line x1="{7 + i * 82 / 14:.1f}" y1="19" x2="{7 + i * 82 / 14:.1f}" y2="40" stroke="#9a9a94" stroke-width=".8"/>'
    for i in (1, 2, 4, 5, 6, 8, 9, 11, 12):
        b += rect(7 + i * 82 / 14 - 2, 19, 4, 12, '#23252b', 1)
    return svg(96, 48, b)

def sink(c):
    b = shadow(4, 5, 40, 38, 4)
    b += rect(4, 5, 40, 38, c, 4, shade(c, -.5), 1.8)
    b += rect(9, 15, 30, 24, '#d9dde2', 7, shade(c, -.45), 1.5)
    b += rect(12, 18, 24, 18, '#bfe8ff', 6, '#9aa6b0', 1)
    b += circ(24, 27, 2.2, '#6a727c')
    b += rect(21, 8, 6, 6, '#cfd3d8', 2, '#777', 1) + rect(23, 12, 2, 6, '#cfd3d8', 1)
    b += circ(13, 10, 2.2, shade(c, -.55)) + circ(35, 10, 2.2, shade(c, -.55))
    return svg(48, 48, b)

def toilet(c):
    b = shadow(8, 5, 32, 40, 8)
    b += rect(9, 5, 30, 11, c, 4, shade(c, -.5), 1.5)
    b += rect(19, 8, 10, 3, shade(c, -.5), 1.5)
    b += f'<ellipse cx="24" cy="28" rx="14" ry="16" fill="{c}" stroke="{shade(c, -.5)}" stroke-width="1.8"/>'
    b += f'<ellipse cx="24" cy="29" rx="9.5" ry="11.5" fill="{shade(c, -.08)}" stroke="{shade(c, -.4)}" stroke-width="1"/>'
    b += '<ellipse cx="24" cy="31" rx="6" ry="7" fill="#9fd3ee" opacity=".8"/>'
    return svg(48, 48, b)

def washer(c):
    b = shadow(4, 5, 40, 40, 5)
    b += rect(4, 4, 40, 40, c, 5, shade(c, -.5), 1.8)
    b += rect(8, 7, 32, 7, shade(c, -.1), 2, shade(c, -.35), 1)
    b += circ(14, 10.5, 2.2, shade(c, -.5)) + rect(24, 9, 12, 3, '#15171d', 1.5) + rect(25, 9.8, 5, 1.4, '#6f8cff', .7)
    b += circ(24, 29, 12.5, shade(c, -.25), shade(c, -.55), 1.8)
    b += circ(24, 29, 9.5, '#9fd3ee', shade(c, -.4), 1.2, op=.9)
    b += '<path d="M16 28 Q20 24 24 28 T32 28" fill="none" stroke="#ffffff" stroke-width="1.4" opacity=".8"/>'
    return svg(48, 48, b)

def desklamp(c):
    d = shade(c, -.4)
    b = circ(26, 27, 17, '#000', op=.2)
    b += circ(24, 24, 17, c, d, 2)
    b += circ(24, 24, 12, shade(c, .35), None, op=.55)
    b += circ(24, 24, 6, '#fff6c8', shade(c, -.5), 1)
    b += circ(24, 24, 2.4, shade(c, -.55))
    b += circ(24, 24, 20.5, 'none', shade(c, -.55), 1, op=.4)
    return svg(48, 48, b)

def treadmill(c):
    b = shadow(3, 5, 90, 38, 6)
    b += rect(3, 5, 90, 38, shade(c, -.3), 6, shade(c, -.55), 1.8)
    b += rect(24, 9, 66, 30, '#2a2c33', 4, '#14151a', 1.2)
    for i in range(6):
        b += rect(32 + i * 10, 12, 3, 24, '#3b3e47', 1)
    b += rect(6, 8, 15, 32, c, 4, shade(c, -.5), 1.2)
    b += rect(8, 11, 11, 7, '#15171d', 1.5) + rect(9, 13, 6, 2, '#8ff0a4', 1)
    b += circ(13, 26, 2.2, shade(c, -.5)) + circ(13, 33, 2.2, shade(c, -.5))
    b += rect(24, 7, 66, 3, shade(c, .3), 1.5, op=.7)
    return svg(96, 48, b)

def aquarium(c):
    b = shadow(3, 5, 90, 38, 5)
    b += rect(3, 5, 90, 38, c, 5, shade(c, -.5), 1.8)
    b += rect(8, 10, 80, 28, '#7fd0ee', 3, shade(c, -.45), 1.4)
    b += rect(8, 10, 80, 8, '#b9ecff', 3, op=.55)
    b += rect(8, 33, 80, 5, '#e3cf9a', 2)
    for x, h in ((16, 12), (74, 15), (80, 10)):
        b += rect(x, 33 - h, 3, h, '#2fa953', 1.5)
    fish = ((30, 22, '#f28a2e'), (52, 27, '#f6d43c'), (62, 19, '#e03c3c'))
    for x, y, fc in fish:
        b += f'<ellipse cx="{x}" cy="{y}" rx="5" ry="3" fill="{fc}"/><path d="M{x - 5} {y} l-4 -3 v6z" fill="{fc}"/>'
        b += circ(x + 2.5, y - .6, .7, '#111')
    b += circ(44, 16, 1.3, '#ffffff', None, op=.8) + circ(46, 13, 1, '#ffffff', None, op=.8)
    return svg(96, 48, b)

def mirror(c):
    b = shadow(4, 6, 40, 36, 5)
    b += rect(4, 6, 40, 36, c, 5, shade(c, -.5), 1.8)
    b += f'<ellipse cx="24" cy="17" rx="12" ry="9" fill="{shade(c, -.35)}" stroke="{shade(c, -.6)}" stroke-width="1.2"/>'
    b += '<ellipse cx="24" cy="17" rx="9.5" ry="7" fill="#dff3ff"/>'
    b += '<path d="M18 14 Q22 11 27 13" fill="none" stroke="#ffffff" stroke-width="1.6" opacity=".9"/>'
    b += rect(9, 30, 30, 8, shade(c, -.08), 2, shade(c, -.32), 1) + rect(21, 33, 6, 2.5, shade(c, -.55), 1.2)
    return svg(48, 48, b)

def rocker(c):
    b = shadow(7, 5, 34, 38, 6)
    b += rect(9, 3, 4, 42, shade(c, -.55), 2) + rect(35, 3, 4, 42, shade(c, -.55), 2)
    b += rect(7, 5, 34, 9, shade(c, -.3), 4, shade(c, -.5))
    b += rect(12, 13, 24, 28, c, 6, shade(c, -.4))
    b += rect(15, 17, 18, 5, shade(c, .3), 3, op=.55)
    b += rect(8, 14, 5, 22, shade(c, -.15), 2.5) + rect(35, 14, 5, 22, shade(c, -.15), 2.5)
    return svg(48, 48, b)

def coffee(c):
    b = shadow(5, 6, 38, 36, 5)
    b += rect(5, 5, 38, 36, c, 5, shade(c, -.5), 1.8)
    b += rect(9, 8, 30, 7, shade(c, .3), 2, op=.6)
    b += circ(24, 27, 9, shade(c, -.35), shade(c, -.6), 1.4)
    b += circ(24, 27, 6, '#f4f4f2', '#9a9a94', 1) + circ(24, 27, 4, '#4a2f1d')
    b += circ(12, 11.5, 1.7, '#e03c3c') + circ(36, 11.5, 1.7, '#8ff0a4')
    return svg(48, 48, b)

def arcade(c):
    b = shadow(6, 4, 36, 40, 5)
    b += rect(6, 3, 36, 41, c, 5, shade(c, -.5), 1.8)
    b += rect(9, 6, 30, 6, shade(c, .3), 2, op=.6)
    b += rect(11, 14, 26, 14, '#15171d', 2, '#000') + rect(13, 16, 22, 10, '#6f8cff', 1, op=.8)
    b += rect(18, 19, 4, 4, '#ffd27a', 1) + rect(27, 21, 5, 2, '#ff8a8a', 1)
    b += rect(9, 31, 30, 10, shade(c, -.2), 2, shade(c, -.5), 1)
    b += circ(17, 36, 3, '#e03c3c', '#600', 1) + circ(29, 36, 2, '#f6d43c') + circ(34, 36, 2, '#2bc9d8')
    return svg(48, 48, b)

def microwave(c):
    b = shadow(3, 8, 42, 30, 4)
    b += rect(3, 7, 42, 30, c, 4, shade(c, -.5), 1.8)
    b += rect(7, 11, 24, 22, '#1d2026', 3, shade(c, -.55), 1.2)
    b += rect(9, 13, 20, 18, '#3a4a5c', 2, op=.85)
    b += rect(9, 13, 20, 4, '#ffffff', 2, op=.18)
    b += rect(34, 11, 8, 6, '#15171d', 1.5) + rect(35.5, 12.8, 5, 1.6, '#8ff0a4', .8)
    for i in range(3):
        for j in range(3):
            b += rect(34 + j * 3, 20 + i * 4, 2.2, 2.6, shade(c, -.4), .8)
    return svg(48, 48, b)

def punchbag(c):
    b = circ(26, 27, 19, '#000', op=.2)
    b += circ(24, 24, 19, shade(c, -.55), shade(c, -.7), 1.8)
    b += circ(24, 24, 14.5, c, shade(c, -.5), 2)
    b += circ(24, 24, 10, shade(c, -.12), None, op=.9)
    b += circ(21, 21, 4.5, shade(c, .4), None, op=.55)
    b += circ(24, 24, 2.2, shade(c, -.6))
    return svg(48, 48, b)

def catbed(c):
    b = circ(26, 27, 20, '#000', op=.2)
    b += circ(24, 24, 20, c, shade(c, -.5), 2)
    b += circ(24, 24, 14, shade(c, .3), shade(c, -.2), 1.2)
    b += '<ellipse cx="24" cy="25" rx="9" ry="7.5" fill="#e8a45c" stroke="#a8692b" stroke-width="1"/>'
    b += '<circle cx="19" cy="22" r="4.4" fill="#e8a45c" stroke="#a8692b" stroke-width="1"/>'
    b += '<path d="M16 19.2 l1.2 -3.2 l2.2 2.4z M20.6 18.2 l2.2 -2.6 l.8 3.4z" fill="#e8a45c" stroke="#a8692b" stroke-width=".8"/>'
    b += '<path d="M31 27 Q36 23 33.5 19" fill="none" stroke="#a8692b" stroke-width="2.4" stroke-linecap="round"/>'
    return svg(48, 48, b)

# id, name, description, block (area in tiles), function tooltip ('' = decoration), drawer
def shower(c):
    """Plan view: a tray with glass walls, the rain head overhead and a tap. The player steps inside."""
    d = shade(c, -.45)
    b = shadow(4, 4, 40, 40, 4)
    b += rect(4, 4, 40, 40, c, 4, d, 1.8)
    b += rect(8, 8, 32, 32, '#e9eef2', 3, shade(c, -.3), 1)
    b += rect(10, 10, 28, 28, '#cfe9f7', 3)
    for k in (17, 24, 31):
        b += rect(k, 10, .8, 28, '#ffffff', 0, op=.55) + rect(10, k, 28, .8, '#ffffff', 0, op=.55)
    b += circ(24, 30, 3.2, '#8aa0ae', '#566b78', 1)
    b += rect(20.6, 29.5, 6.8, 1, '#566b78', .5) + rect(23.5, 26.6, 1, 6.8, '#566b78', .5)
    b += rect(22.5, 9, 3, 6, '#b9c0c8', 1, '#6a727c', .6)
    b += circ(24, 17, 6.5, '#d9dde2', '#6a727c', 1.2)
    for ang in range(0, 360, 60):
        b += circ(24 + 3.6 * math.cos(math.radians(ang)), 17 + 3.6 * math.sin(math.radians(ang)), .8, '#6a727c')
    b += circ(24, 17, .8, '#6a727c')
    b += circ(11, 11.5, 2.2, shade(c, .25), d, .9) + circ(37, 11.5, 2.2, '#e8554e', d, .9)
    b += rect(4, 4, 3.2, 40, '#bfe8ff', 1.2, '#6a9fc0', .8, op=.55) + rect(40.8, 4, 3.2, 40, '#bfe8ff', 1.2, '#6a9fc0', .8, op=.55)
    b += rect(8, 41.2, 32, 2.4, '#bfe8ff', 1, '#6a9fc0', .7, op=.8) + rect(34, 40.6, 4, 1.2, '#9aa6b0', .6)
    return svg(48, 48, b)

def fan(c):
    """Plan view of a pedestal fan facing down: round foot, pole, motor and the guard seen edge-on.
    The spinning blades are drawn live by the game (js/fx.js)."""
    d = shade(c, -.45)
    b = circ(26, 22, 15, '#000', op=.2)
    b += circ(24, 20, 14, '#d9dde2', '#6a727c', 1.6)
    b += rect(19, 19, 10, 13, c, 4, d, 1.3)
    b += rect(5, 32, 38, 10, '#eef1f4', 5, '#7d848d', 1.6)
    for x in range(9, 41, 4):
        b += rect(x, 33.5, .8, 7, '#aeb4bb', 0)
    b += rect(8, 41.6, 32, 1, '#ffffff', 0, op=.8)
    return svg(48, 48, b)

def gclock(c):
    """Plan view of a tall case clock: moulded hood with the dial on it. The hands are drawn live
    from your real time by the game (js/fx.js)."""
    d = shade(c, -.5)
    b = shadow(6, 5, 36, 38, 4)
    b += rect(6, 5, 36, 38, c, 4, d, 1.8)
    b += rect(9, 8, 30, 32, shade(c, .12), 3, shade(c, -.3), 1)
    b += rect(11, 9.5, 26, 2.4, shade(c, .45), 1, op=.55)
    b += circ(24, 22, 11.5, '#fff8e0', '#c9a227', 2)
    for i in range(12):
        a = math.radians(i * 30)
        r1 = 8.2 if i % 3 == 0 else 9.2
        b += (f'<line x1="{24 + r1 * math.sin(a):.1f}" y1="{22 - r1 * math.cos(a):.1f}" '
              f'x2="{24 + 10.2 * math.sin(a):.1f}" y2="{22 - 10.2 * math.cos(a):.1f}" stroke="#4a3a1a" stroke-width="1"/>')
    b += rect(17, 36, 14, 2.6, '#e8c547', 1.2, '#8a6d12', .6)
    return svg(48, 48, b)

FURNITURE = [
    ("couch", "Couch", "A soft three-seater. Perfect for doing absolutely nothing.", 3, "Sit down", couch),
    ("bed", "Bed", "A cosy double bed with two pillows.", 6, "Lie down and sleep", bed),
    ("tv", "TV Stand", "A TV on a low stand with a tiny remote channel menu.", 2, "Use the remote", tv),
    ("chair", "Chair", "A simple padded chair.", 1, "Sit down", chair),
    ("table", "Dining Table", "A sturdy table for four. Purely decorative.", 4, "", table),
    ("bookshelf", "Bookshelf", "Packed with tiny stories.", 2, "Pick a book", bookshelf),
    ("lamp", "Floor Lamp", "Warm light for late nights.", 1, "Toggle light", lamp),
    ("plant", "Potted Plant", "Keeps the room looking alive. Decoration only.", 1, "", plant),
    ("fridge", "Fridge", "Cold drinks and questionable leftovers.", 1, "Grab a snack", fridge),
    ("wardrobe", "Wardrobe", "Change your shirt colour.", 2, "Open wardrobe", wardrobe),
    ("nightstand", "Nightstand", "A small bedside table. Decoration only.", 1, "", nightstand),
    ("armchair", "Armchair", "A deep, squishy chair with arms. Hard to leave.", 1, "Sit down", armchair),
    ("desk", "Computer Desk", "A desk with a computer, keyboard and a mug of something.", 2, "Use the computer", desk),
    ("stove", "Stove", "Four burners and a lot of confidence.", 1, "Cook something", stove),
    ("stereo", "Stereo", "A boombox with opinions about music.", 1, "Play music", stereo),
    ("bathtub", "Bathtub", "Warm water and plenty of bubbles.", 3, "Take a bath", bathtub),
    ("fireplace", "Fireplace", "A crackling hearth. Light it for a warm glow.", 2, "Light / put out fire", fireplace),
    ("piano", "Piano", "Eighty-eight keys, three of which you know.", 2, "Play a tune", piano),
    ("sink", "Sink", "Running water, as advertised.", 1, "Wash hands", sink),
    ("toilet", "Toilet", "Every home needs one.", 1, "Use the toilet", toilet),
    ("washer", "Washing Machine", "Spins your shirts. Sometimes returns your socks.", 1, "Do laundry", washer),
    ("desklamp", "Desk Lamp", "A small round lamp. Great for night owls.", 1, "Toggle light", desklamp),
    ("treadmill", "Treadmill", "Run for miles without leaving the room.", 2, "Start running", treadmill),
    ("aquarium", "Aquarium", "Three fish and zero opinions.", 2, "Feed the fish", aquarium),
    ("mirror", "Vanity Mirror", "A dresser with a mirror. Try a new hairstyle.", 1, "Change hairstyle", mirror),
    ("rocker", "Rocking Chair", "Rock back and forth. Peaceful.", 1, "Sit and rock", rocker),
    ("coffee", "Coffee Machine", "Fresh coffee, any time of day.", 1, "Brew a coffee", coffee),
    ("arcade", "Arcade Machine", "Insert imaginary coin. Chase a high score.", 1, "Play a game", arcade),
    ("microwave", "Microwave", "Beep. Beep. Beep.", 1, "Heat something", microwave),
    ("punchbag", "Punching Bag", "Work out your frustrations.", 1, "Punch it", punchbag),
    ("catbed", "Cat Bed", "A round bed with a very sleepy cat.", 1, "Pet the cat", catbed),
    ("shower", "Shower", "Step inside, pick a temperature and get properly clean.", 1, "Take a shower", shower),
    ("fan", "Standing Fan", "Blows a steady breeze in front of it (rotate to aim) and shoves you back. Off, low, medium, high.", 1, "Set fan speed", fan),
    ("gclock", "Grandfather Clock", "Tells the real time and strikes the hour with the Westminster chimes.", 1, "Check the time", gclock),
]

# ---------------------------------------------------- structures (block=0 -> sits on a tile edge)
def wall(c):
    b = rect(0, 0, 60, 12, shade(c, -.38), 2)
    b += rect(0, 0, 60, 8.5, c, 2, shade(c, -.5), 1)
    b += rect(2, 1.5, 56, 2, shade(c, .4), 1, op=.55)
    return svg(60, 12, b)

def door(c):
    d = shade(c, -.5)
    b = rect(0, 0, 60, 12, shade(c, -.35), 2)
    b += rect(0, 0, 6, 12, d, 1.5) + rect(54, 0, 6, 12, d, 1.5)
    b += rect(6, 1, 48, 10, c, 1.5, shade(c, -.5), 1)
    b += rect(10, 3, 18, 6, shade(c, .22), 1, op=.55) + rect(32, 3, 18, 6, shade(c, .22), 1, op=.55)
    b += circ(49, 6, 1.7, '#f2c94c', '#8a6d12', .6)
    return svg(60, 12, b)

def window(c):
    d = shade(c, -.5)
    b = rect(0, 0, 60, 12, shade(c, -.35), 2)
    b += rect(0, 0, 60, 8.5, c, 2, d, 1)
    b += rect(7, 1.5, 46, 5.5, '#a9dcff', 1, '#4b86b4', .8)
    b += rect(29, 1.5, 2, 5.5, '#fff', 0, None, op=.9)
    b += rect(9, 2.5, 14, 1.5, '#ffffff', 1, op=.7)
    b += rect(5, 9, 50, 2.5, '#ffffff', 1, op=.85)
    return svg(60, 12, b)

STRUCTURES = [
    ("wall", "Wall", "Splits rooms apart. Drag along a line to build many at once.", 0, "", wall),
    ("door", "Door", "A door in a wall. Open and close it.", 0, "Open / close door", door),
    ("window", "Window", "Lets the light in. Decoration only.", 0, "", window),
]

def write(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)

def gen_furniture():
    for fid, name, desc, block, fn, drawer in FURNITURE + STRUCTURES:
        d = os.path.join(ROOT, 'furniture', fid)
        write(os.path.join(d, 'info.txt'),
              f"name={name}\ndescription={desc}\nblock={block}\nfunction={fn}\n")
        for cname, hexv in COLORS.items():
            write(os.path.join(d, cname + '.svg'), drawer(hexv))

# ------------------------------------------------------------ floor textures
def floor_tex(name, c):
    S = 48
    d, l = shade(c, -.25), shade(c, .25)
    b = rect(0, 0, S, S, c)
    if name == 'white':
        b += f'<path d="M0 0H48V48H0Z" fill="none" stroke="{shade(c, -.15)}" stroke-width="2"/>'
        b += f'<path d="M6 40 Q18 28 26 32 T44 14" fill="none" stroke="{shade(c, -.12)}" stroke-width="1" opacity=".7"/>'
    elif name == 'light gray':
        r = random.Random(3)
        for _ in range(60):
            b += circ(r.uniform(0, S), r.uniform(0, S), r.uniform(.4, 1.3), r.choice([d, l]), None, op=.55)
        b += f'<path d="M0 0H48V48H0Z" fill="none" stroke="{shade(c, -.08)}" stroke-width="1"/>'
    elif name == 'gray':
        b += rect(0, 0, S, 24, shade(c, .05)) + rect(0, 24, S, 24, shade(c, -.05))
        b += f'<path d="M0 0H48M0 24H48M24 0V24M0 24V48M48 24V48M0 48H48" stroke="{d}" stroke-width="2" fill="none"/>'
    elif name == 'black':
        b += rect(0, 0, 24, 24, shade(c, -.25)) + rect(24, 24, 24, 24, shade(c, -.25))
        b += rect(2, 2, 8, 3, '#ffffff', 1, op=.12) + rect(26, 26, 8, 3, '#ffffff', 1, op=.12)
    elif name == 'brown':
        for i in range(4):
            tone = shade(c, [.04, -.06, .1, -.02][i])
            b += rect(0, i * 12, S, 12, tone) + f'<path d="M0 {i * 12}H48" stroke="{shade(c, -.4)}" stroke-width="1.3"/>'
            off = (i * 17) % 48
            b += f'<path d="M{off} {i * 12}V{i * 12 + 12}" stroke="{shade(c, -.4)}" stroke-width="1.3"/>'
            b += f'<path d="M{(off + 10) % 48} {i * 12 + 5}h14" stroke="{shade(c, -.18)}" stroke-width=".8" opacity=".7"/>'
    elif name == 'red':
        b = rect(0, 0, S, S, shade(c, -.5))
        for row in range(4):
            off = 0 if row % 2 == 0 else 12
            for k in range(-1, 3):
                b += rect(k * 24 + off + 1, row * 12 + 1, 22, 10, shade(c, -.1 + (row + k) % 3 * .06), 1)
    elif name == 'orange':
        b += f'<path d="M0 0H48V48H0Z" fill="none" stroke="{shade(c, -.35)}" stroke-width="2.5"/>'
        b += rect(6, 6, 36, 36, shade(c, .08), 4, None, op=.7)
        b += circ(24, 24, 4, shade(c, -.2), None, op=.4)
    elif name == 'yellow':
        for i in range(0, 48, 12):
            for j in range(0, 48, 12):
                horiz = ((i + j) // 12) % 2 == 0
                b += rect(i + 1, j + 1, 10, 10, shade(c, -.12 if horiz else .1), 1.5)
                for k in range(3):
                    b += (f'<path d="M{i + 1} {j + 3 + k * 3}h10" stroke="{d}" stroke-width=".6" opacity=".6"/>' if horiz else
                          f'<path d="M{i + 3 + k * 3} {j + 1}v10" stroke="{d}" stroke-width=".6" opacity=".6"/>')
    elif name == 'lime':
        b += rect(0, 0, S, 24, shade(c, -.06)) + rect(0, 24, S, 24, shade(c, .06))
        r = random.Random(7)
        for _ in range(34):
            x, y = r.uniform(0, S), r.uniform(0, S)
            b += f'<path d="M{x:.1f} {y:.1f}l1.5 -4" stroke="{shade(c, -.3)}" stroke-width=".9" opacity=".6"/>'
    elif name == 'green':
        r = random.Random(11)
        for _ in range(150):
            b += circ(r.uniform(0, S), r.uniform(0, S), .8, r.choice([shade(c, .25), shade(c, -.25)]), None, op=.5)
        b += f'<path d="M0 0H48V48H0Z" fill="none" stroke="{shade(c, -.15)}" stroke-width="1"/>'
    elif name == 'cyan':
        b += f'<path d="M0 0H48V48H0Z" fill="none" stroke="{shade(c, .45)}" stroke-width="3"/>'
        b += f'<path d="M24 0V48M0 24H48" stroke="{shade(c, .45)}" stroke-width="2"/>'
        b += rect(4, 4, 6, 3, '#fff', 1, op=.35)
    elif name == 'light blue':
        b += f'<path d="M24 4L44 24L24 44L4 24Z" fill="none" stroke="{shade(c, -.18)}" stroke-width="1.5"/>'
        b += f'<path d="M24 14L34 24L24 34L14 24Z" fill="{shade(c, .3)}" opacity=".8"/>'
    elif name == 'blue':
        b = rect(0, 0, S, S, shade(c, -.35))
        b += f'<path d="M24 0L48 24L24 48L0 24Z" fill="{c}" stroke="{shade(c, .35)}" stroke-width="1.5"/>'
        b += circ(24, 24, 3, shade(c, .5), None, op=.8)
    elif name == 'purple':
        b = rect(0, 0, S, S, shade(c, -.1))
        for x in (12, 36):
            for y in (12, 36):
                b += circ(x, y, 5, shade(c, .22), None, op=.8)
        for x in (0, 24, 48):
            for y in (0, 24, 48):
                b += circ(x, y, 3, shade(c, .1), None, op=.7)
    elif name == 'magenta':
        for i in range(0, 48, 12):
            b += rect(0, i, S, 6, shade(c, -.18))
        b += rect(0, 0, S, 2, shade(c, .3), 0, None, op=.5)
    elif name == 'pink':
        b += circ(12, 12, 5, shade(c, -.14)) + circ(36, 36, 5, shade(c, -.14))
        b += circ(36, 12, 2.5, '#fff', None, op=.7) + circ(12, 36, 2.5, '#fff', None, op=.7)
    return svg(S, S, b)

def gen_floors():
    for n, h in COLORS.items():
        write(os.path.join(ROOT, 'img', 'floor', n + '.svg'), floor_tex(n, h))
    r = random.Random(21)
    b = rect(0, 0, 48, 48, '#2f6b45')
    for _ in range(70):
        x, y = r.uniform(0, 48), r.uniform(0, 48)
        b += (f'<path d="M{x:.1f} {y:.1f}l1.4 -4.5" stroke="{r.choice(["#3f8a58", "#265a39", "#4aa06a"])}" '
              f'stroke-width="1" opacity=".7"/>')
    write(os.path.join(ROOT, 'img', 'ground.svg'), svg(48, 48, b))

# -------------------------------------------------------------------- player
def player_svg(direction):
    """48x64 character. {{skin}} {{shirt}} {{pants}} and the {{hairBack}} / {{hairFront}} hairstyle slots (see js/hair.js) are filled in at runtime."""
    sk, hr, sh, pn = '{{skin}}', '{{hair}}', '{{shirt}}', '{{pants}}'
    out = '#1b2336'
    b = '<ellipse cx="24" cy="58" rx="13" ry="4.5" fill="#000" opacity=".3"/>'
    if direction in ('down', 'up'):
        b += rect(14, 46, 8, 11, pn, 3, out, 1.4) + rect(26, 46, 8, 11, pn, 3, out, 1.4)
        b += rect(11, 27, 26, 22, sh, 8, out, 1.6)
        b += rect(6, 29, 7, 16, sh, 4, out, 1.4) + rect(35, 29, 7, 16, sh, 4, out, 1.4)
        b += circ(9.5, 46, 3.4, sk, out, 1.2) + circ(38.5, 46, 3.4, sk, out, 1.2)
        b += '{{hairBack}}'
        b += circ(24, 17, 13, sk, out, 1.6)
        b += '{{hairFront}}'   # hairstyle shapes live in js/hair.js
        if direction == 'down':
            b += circ(19, 18, 2, out) + circ(29, 18, 2, out)
            b += f'<path d="M20 23 Q24 26 28 23" fill="none" stroke="{out}" stroke-width="1.3" stroke-linecap="round"/>'
            b += circ(16, 22, 2.2, '#ff7a8a', None, op=.35) + circ(32, 22, 2.2, '#ff7a8a', None, op=.35)
    else:
        sgn = 1 if direction == 'right' else -1
        cx = 24
        b += rect(cx - 5, 46, 10, 11, pn, 3, out, 1.4)
        b += rect(cx - 9, 27, 18, 22, sh, 7, out, 1.6)
        b += rect(cx - 3, 29, 7, 16, sh, 4, out, 1.4)
        b += circ(cx, 46, 3.4, sk, out, 1.2)
        b += '{{hairBack}}'
        b += circ(cx, 17, 13, sk, out, 1.6)
        b += '{{hairFront}}'
        b += circ(cx + sgn * 6, 18, 2, out)
        b += (f'<path d="M{cx + sgn * 4} 23 Q{cx + sgn * 7} 25 {cx + sgn * 9} 22.5" fill="none" '
              f'stroke="{out}" stroke-width="1.2" stroke-linecap="round"/>')
    return svg(48, 64, b)

def gen_player():
    for d in ('down', 'up', 'left', 'right'):
        write(os.path.join(ROOT, 'img', 'player', d + '.svg'), player_svg(d))

# --------------------------------------------------------------------- icons
STROKE = 'fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"'

def ceiling_tiles(cols=4, rows=3):
    """Ceiling seen from below: rows of tiles that get narrower with distance (perspective grid)."""
    cx, top, bot, w_top, w_bot, gap = 12, 4.5, 19.5, 22.0, 14.0, 1.3
    rh = (bot - top - (rows - 1) * 1.6) / rows
    width = lambda y: w_top + (w_bot - w_top) * (y - top) / (bot - top)
    out = ''
    for r in range(rows):
        y0 = top + r * (rh + 1.6); y1 = y0 + rh
        pts = lambda y, c, side: cx - width(y) / 2 + (c + side) * width(y) / cols + (gap / 2 if side == 0 else -gap / 2)
        for c in range(cols):
            out += (f'<path d="M{pts(y0, c, 0):.2f} {y0:.2f}H{pts(y0, c, 1):.2f}L{pts(y1, c, 1):.2f} {y1:.2f}'
                    f'H{pts(y1, c, 0):.2f}Z"/>')
    return out

def gear_path(teeth=8, r_out=9.6, r_in=7.0):
    """Outline of a simple cog: `teeth` flat-topped teeth around a circle, centred at 12,12."""
    import math
    pts = []
    for i in range(teeth):
        a = i * 2 * math.pi / teeth
        step = 2 * math.pi / teeth
        for r, off in ((r_in, -0.34), (r_out, -0.2), (r_out, 0.2), (r_in, 0.34)):
            ang = a + off * step * 1.5
            pts.append(f'{12 + r * math.sin(ang):.2f} {12 - r * math.cos(ang):.2f}')
    return 'M' + 'L'.join(pts) + 'Z'

def icon_fill(name, body):
    write(os.path.join(ROOT, 'img', 'icons', name + '.svg'),
          f'<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24"><g fill="#fff" stroke="none">{body}</g></svg>\n')

def icon(name, body):
    write(os.path.join(ROOT, 'img', 'icons', name + '.svg'),
          f'<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24"><g {STROKE}>{body}</g></svg>\n')

def gen_icons():
    icon('build', '<path d="M14.5 5.5l4 4-9.5 9.5H5v-4z"/><path d="M13 7l4 4"/>')
    icon('play', '<path d="M8 5l11 7-11 7z" fill="#fff"/>')
    icon('fullscreen', '<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/>')
    icon('fullscreen-exit', '<path d="M9 4v5H4M20 9h-5V4M15 20v-5h5M4 15h5v5"/>')
    icon('sound-on', '<path d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4z" fill="#fff"/><path d="M15.5 9a4 4 0 010 6"/><path d="M18 6.5a8 8 0 010 11"/>')
    icon('sound-off', '<path d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4z" fill="#fff"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>')
    icon('chat', '<path d="M4 6.5A2.5 2.5 0 016.5 4h11A2.5 2.5 0 0120 6.5v7a2.5 2.5 0 01-2.5 2.5H11l-4.5 4v-4A2.5 2.5 0 014 13.5z"/><path d="M8 8.5h8M8 11.5h5"/>')
    icon('select', '<path d="M6 4l12 7.5-5.2 1.3L15.5 19l-2.4 1-2.7-6.3L6.5 17z" fill="#fff"/>')
    icon('place', '<path d="M12 3.5l8 4.2v8.6l-8 4.2-8-4.2V7.7z"/><path d="M4 7.7l8 4.3 8-4.3M12 12v8.5"/>')
    icon('wall', '<rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="M3 10h18M3 14.5h18M9 5v5M15 10v4.5M9 14.5V19"/>')
    icon('door', '<path d="M6 20V5.5A1.5 1.5 0 017.5 4h9A1.5 1.5 0 0118 5.5V20"/><path d="M4 20h16"/><circle cx="14.5" cy="12.5" r="1" fill="#fff"/>')
    icon('floor', '<path d="M3 9l9-4.5L21 9l-9 4.5z"/><path d="M3 9v4l9 4.5 9-4.5V9M12 13.5v4"/>')
    icon('room', '<rect x="4" y="5" width="16" height="14" rx="1" stroke-dasharray="3 2.4"/><path d="M9 12h6M12 9v6"/>')
    icon('erase', '<path d="M8.5 19.5L4 15l9.5-9.5a2 2 0 012.8 0l3.2 3.2a2 2 0 010 2.8L11 19.5z"/><path d="M13 19.5h7"/>')
    icon('undo', '<path d="M9 7L4.5 11.5 9 16"/><path d="M5 11.5h8.5a5 5 0 010 10H11"/>')
    icon('redo', '<path d="M15 7l4.5 4.5L15 16"/><path d="M19 11.5h-8.5a5 5 0 000 10H13"/>')
    icon('rotate', '<path d="M19.5 12a7.5 7.5 0 10-2.2 5.3"/><path d="M19.5 5.5v5h-5"/>')
    icon('trash', '<path d="M5 7h14M10 7V4.5h4V7M7 7l1 13h8l1-13"/><path d="M10.5 11v5.5M13.5 11v5.5"/>')
    icon('close', '<path d="M6 6l12 12M18 6L6 18"/>')
    icon('check', '<path d="M5 12.5l4.5 4.5L19 7.5"/>')
    icon('save', '<path d="M5 4h11l3 3v13H5z"/><path d="M8 4v5h7V4M8 20v-6h8v6"/>')
    icon('download', '<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19.5h14"/>')
    icon('upload', '<path d="M12 15V4M7.5 8.5L12 4l4.5 4.5M5 19.5h14"/>')
    icon('moon', '<path d="M19.5 14.5A8 8 0 019.5 4.5a8 8 0 1010 10z" fill="#fff"/>')
    icon('sun', '<circle cx="12" cy="12" r="4" fill="#fff"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8"/>')
    icon_fill('ceiling', ceiling_tiles())
    icon('zoom-in', '<circle cx="11" cy="11" r="6"/><path d="M16 16l4.5 4.5M11 8.5v5M8.5 11h5"/>')
    icon('zoom-out', '<circle cx="11" cy="11" r="6"/><path d="M16 16l4.5 4.5M8.5 11h5"/>')
    icon('hand', '<path d="M8 12V6.5a1.5 1.5 0 013 0V11M11 11V5a1.5 1.5 0 013 0v6M14 11V6.5a1.5 1.5 0 013 0V14c0 4-2 6.5-5.5 6.5S7 18.5 6 15.5L4.7 12a1.4 1.4 0 012.3-1.4z"/>')
    icon('home', '<path d="M4 11.5L12 4.5l8 7"/><path d="M6 10.5V20h12v-9.5"/><path d="M10 20v-5h4v5"/>')
    icon('reset', '<path d="M4 12a8 8 0 112.5 5.8"/><path d="M4 18v-5h5"/>')
    icon('plus', '<path d="M12 5v14M5 12h14"/>')
    icon('info', '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5"/><circle cx="12" cy="7.8" r=".9" fill="#fff"/>')
    icon('gear', f'<path d="{gear_path()}"/><circle cx="12" cy="12" r="3"/>')

def gen_logo():
    b = ('<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5eead4"/>'
         '<stop offset="1" stop-color="#0d9488"/></linearGradient></defs>')
    b += '<path d="M20 70 L100 18 L180 70 V150 a10 10 0 01-10 10 H30 a10 10 0 01-10-10z" fill="#0f172a" stroke="#020617" stroke-width="6" stroke-linejoin="round"/>'
    b += '<path d="M28 72 L100 26 L172 72 V150 H28z" fill="url(#g)" stroke="#0f172a" stroke-width="5" stroke-linejoin="round"/>'
    b += '<rect x="42" y="92" width="34" height="34" rx="4" fill="#fde047" stroke="#0f172a" stroke-width="5"/>'
    b += '<rect x="84" y="100" width="30" height="50" rx="4" fill="#fb7185" stroke="#0f172a" stroke-width="5"/>'
    b += '<rect x="122" y="92" width="36" height="34" rx="4" fill="#60a5fa" stroke="#0f172a" stroke-width="5"/>'
    b += '<circle cx="106" cy="126" r="3.2" fill="#fde047"/>'
    write(os.path.join(ROOT, 'img', 'logo.svg'),
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 170" width="200" height="170">' + b + '</svg>\n')

if __name__ == '__main__':
    gen_furniture()
    gen_floors()
    gen_player()
    gen_icons()
    gen_logo()
    print('assets generated')