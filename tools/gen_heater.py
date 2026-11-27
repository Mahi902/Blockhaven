#!/usr/bin/env python3
"""Generates the Space Heater sprites (16 colours): python3 tools/gen_heater.py"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gen_assets import COLORS, shade, rect, circ, svg, write, ROOT

def heater(c):
    d = shade(c, -.5)
    b = rect(8, 12, 34, 28, '#000', 5, op=.2)
    b += rect(6, 9, 34, 28, c, 5, d, 1.8)
    b += rect(10, 13, 26, 16, '#1d2026', 3, d, 1.2)
    for i in range(4):
        b += rect(12, 15 + i * 3.6, 22, 1.8, '#5a4a44', 0.9)
    b += rect(10, 31, 8, 4, shade(c, -.3), 2, d, 1) + circ(28, 33, 1.5, '#8ff0a4') + circ(33, 33, 1.5, shade(c, -.4))
    return svg(48, 48, b)

for n, h in COLORS.items():
    write(os.path.join(ROOT, 'furniture', 'heater', n + '.svg'), heater(h))
