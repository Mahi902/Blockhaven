#!/usr/bin/env python3
"""Generates the Hammock sprites only (16 colours): python3 tools/gen_hammock.py
Vertical like the bed (48x96, head at the top). Layout contract with render.js (drawHammock):
  y 0..11 and 85..96 : posts ONLY (fixed in-game, nothing else may be drawn there)
  y 11..85           : the swinging cloth; the part from y=52 down is the blanket the game re-draws over the sleeper
Ropes are drawn by the game so they can stretch while the cloth swings."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gen_assets import COLORS, shade, rect, circ, svg, write, ROOT

SHAPE = 'M20 12 L28 12 C40 22 45 34 45 48 C45 62 40 74 28 84 L20 84 C8 74 3 62 3 48 C3 34 8 22 20 12Z'

def hammock(c):
    d = shade(c, -.45); cloth = shade(c, .55); l = shade(c, .3)
    b = '<defs><clipPath id="h"><path d="%s"/></clipPath></defs>' % SHAPE
    b += f'<path d="{SHAPE}" fill="#000" opacity=".18" transform="translate(2.5 0)"/>'
    b += f'<path d="{SHAPE}" fill="{cloth}"/>'
    b += '<g clip-path="url(#h)">'
    for y in range(14, 52, 8):                                            # woven bands on the head half
        b += rect(0, y, 48, 3.2, shade(c, .35), 0, op=.75)
    b += rect(0, 52, 48, 40, c)                                           # blanket half
    b += rect(0, 52, 48, 7, l, 0, op=.9)
    for i in range(3):
        b += rect(0, 66 + i * 6, 48, 2, shade(c, -.22), 0, op=.5)
    b += '</g>'
    b += f'<path d="{SHAPE}" fill="none" stroke="{d}" stroke-width="1.8" stroke-linejoin="round"/>'
    b += f'<ellipse cx="24" cy="32" rx="10" ry="9" fill="#ffffff" stroke="#c9c9c4" stroke-width="1.1"/>'   # pillow under the head
    for y in (5.5, 90.5):
        b += circ(24, y, 4.6, '#7a5a3a', '#4a3320', 1.5) + circ(24, y, 1.8, '#4a3320')                   # posts
    return svg(48, 96, b)

for n, h in COLORS.items():
    write(os.path.join(ROOT, 'furniture', 'hammock', n + '.svg'), hammock(h))
