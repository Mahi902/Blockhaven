#!/usr/bin/env python3
"""Generates the Hammock sprites only (16 colours): python3 tools/gen_hammock.py
Posts stay fixed in-game, the cloth swings. Vertical like the bed (48x96, head at the top): the game draws the sleeper's head at y=40 and re-draws the
sprite from y=52 down over them, so that lower part is the blanket that tucks the sleeper in."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gen_assets import COLORS, shade, rect, circ, svg, write, ROOT

def hammock(c):
    d = shade(c, -.45); l = shade(c, .4); rope = '#b89968'
    b = '<rect x="6" y="7" width="40" height="86" rx="12" fill="#000" opacity=".2"/>'
    # ropes are drawn by the game (render.js drawHammock) so they can stretch while the cloth swings
    b += rect(6, 12, 36, 76, shade(c, .15), 14, d, 1.6)                  # hammock cloth
    b += rect(12, 22, 24, 22, '#ffffff', 8, '#c9c9c4', 1.1)               # pillow under the head
    b += rect(8, 52, 32, 34, c, 10, d, 1.4)                               # blanket (drawn over the sleeper)
    b += rect(8, 52, 32, 8, l, 6, op=.9)
    for i in range(3):
        b += rect(13, 65 + i * 6, 22, 2, shade(c, -.2), 1, op=.5)
    for y in (6, 90):
        b += circ(24, y, 5, '#7a5a3a', '#4a3320', 1.5) + circ(24, y, 2, '#4a3320')   # posts
    return svg(48, 96, b)

for n, h in COLORS.items():
    write(os.path.join(ROOT, 'furniture', 'hammock', n + '.svg'), hammock(h))
