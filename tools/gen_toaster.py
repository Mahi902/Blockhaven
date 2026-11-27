#!/usr/bin/env python3
"""Generates the Toaster sprites (16 colours): python3 tools/gen_toaster.py"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gen_assets import COLORS, shade, rect, circ, svg, write, ROOT

def toaster(c):
    d = shade(c, -.5)
    b = rect(8, 14, 36, 26, '#000', 6, op=.2)
    b += rect(6, 11, 36, 26, c, 6, d, 1.8)
    b += rect(6, 11, 36, 5, '#ffffff', 5, op=.3)
    b += rect(10, 18, 28, 6, '#15171d', 2.5) + rect(10, 27, 28, 6, '#15171d', 2.5)
    b += rect(40, 16, 5, 4, shade(c, -.3), 1.5, d, 1) + rect(41, 26, 3, 6, '#2a2c33', 1.2)
    b += circ(37, 14, 1.2, '#8ff0a4')
    return svg(48, 48, b)

for n, h in COLORS.items():
    write(os.path.join(ROOT, 'furniture', 'toaster', n + '.svg'), toaster(h))
