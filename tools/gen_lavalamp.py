#!/usr/bin/env python3
"""Generates the Lava Lamp sprites (16 body colours): python3 tools/gen_lavalamp.py"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gen_assets import COLORS, shade, rect, circ, svg, write, ROOT

def lavalamp(c):
    b = circ(26, 26, 16, '#000', None, op=.2)
    b += circ(24, 24, 16, c, shade(c, -.5), 1.8)
    b += circ(24, 24, 12.5, '#1c2230', shade(c, -.55), 1.2)
    b += circ(24, 24, 11, '#2c3650', None, op=.9)
    b += circ(20, 19, 4, '#ffffff', None, op=.18)
    b += circ(24, 24, 3, shade(c, -.4), shade(c, -.6), 1)
    return svg(48, 48, b)

for n, h in COLORS.items():
    write(os.path.join(ROOT, 'furniture', 'lavalamp', n + '.svg'), lavalamp(h))
