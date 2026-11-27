#!/usr/bin/env python3
"""Renders hammock sprites at several sway positions, mirroring render.js drawHammock (no game needed)."""
import os, io, sys, cairosvg
from PIL import Image, ImageDraw
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
K, CAP, W0, H0 = 4, 11, 48, 96
def sprite(color):
    png = cairosvg.svg2png(url=os.path.join(ROOT, 'furniture', 'hammock', color + '.svg'), output_width=W0 * K, output_height=H0 * K)
    return Image.open(io.BytesIO(png)).convert('RGBA')
def frame(color, lat):
    img = sprite(color); pad = 14 * K
    out = Image.new('RGBA', (W0 * K + 2 * pad, H0 * K), (214, 196, 160, 255))   # floor-ish backdrop
    out.alpha_composite(img.crop((0, 0, W0 * K, CAP * K)), (pad, 0))                         # fixed posts
    out.alpha_composite(img.crop((0, (H0 - CAP) * K, W0 * K, H0 * K)), (pad, (H0 - CAP) * K))
    d = ImageDraw.Draw(out); cx = pad + W0 * K // 2
    for sy, y0 in ((1, 8), (-1, H0 - 8)):                                                     # ropes: post -> cloth ends
        ye = CAP + 1 if sy == 1 else H0 - CAP - 1
        for sx in (-1, 1):
            d.line([(cx, y0 * K), (cx + (sx * 3 + lat) * K, ye * K)], fill=(184, 153, 104, 255), width=int(1.5 * K))
    cloth = img.crop((0, CAP * K, W0 * K, (H0 - CAP) * K))
    out.alpha_composite(cloth, (pad + int(lat * K), CAP * K))                                 # swinging cloth
    return out
def sheet(color, lats, path):
    fs = [frame(color, l) for l in lats]
    w, h = fs[0].size; s = Image.new('RGBA', (w * len(fs), h + 22), (30, 41, 59, 255)); dr = ImageDraw.Draw(s)
    for i, (f, l) in enumerate(zip(fs, lats)):
        s.alpha_composite(f, (i * w, 22)); dr.text((i * w + 8, 5), f'{color}  sway {l:+d}px', fill=(255, 255, 255, 255))
    s.convert('RGB').save(path)
out = os.path.join(ROOT, 'docs', 'screenshots', 'hammock'); lats = [-10, -5, 0, 5, 10]
for c in sys.argv[1:] or ['red', 'blue', 'green', 'white']:
    sheet(c, lats, os.path.join(out, f'hammock_sway_{c.replace(" ", "_")}.png'))
