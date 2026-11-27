#!/usr/bin/env python3
"""Generates the Hammock sprites only (16 colours): python3 tools/gen_hammock.py"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gen_assets import COLORS, shade, rect, circ, svg, write, ROOT

def hammock(c):
    d = shade(c, -.45); l = shade(c, .4)
    b = '<ellipse cx="50" cy="28" rx="40" ry="14" fill="#000" opacity=".2"/>'
    # ropes
    b += f'<path d="M12 24 L24 14 M12 24 L24 34 M84 24 L72 14 M84 24 L72 34" stroke="{shade("#b89968", -.2)}" stroke-width="1.6" stroke-linecap="round"/>'
    # fabric
    b += f'<path d="M22 12 Q48 18 74 12 Q80 24 74 36 Q48 30 22 36 Q16 24 22 12Z" fill="{c}" stroke="{d}" stroke-width="1.6"/>'
    for i in range(6):
        x = 28 + i * 8
        b += f'<path d="M{x} {14 + abs(i - 2.5)} Q{x - 1} 24 {x} {34 - abs(i - 2.5)}" fill="none" stroke="{l}" stroke-width="2.2" opacity=".75"/>'
    b += f'<path d="M24 22 Q48 27 72 22" fill="none" stroke="{d}" stroke-width="1" opacity=".5"/>'
    # pillow
    b += rect(26, 18, 12, 12, '#ffffff', 5, shade('#f4f4f2', -.25), 1.1, op=.9)
    # posts (seen from above)
    for x in (10, 86):
        b += circ(x, 24, 6, '#7a5a3a', '#4a3320', 1.6) + circ(x, 24, 2.4, '#4a3320')
    return svg(96, 48, b)

for n, h in COLORS.items():
    write(os.path.join(ROOT, 'furniture', 'hammock', n + '.svg'), hammock(h))
