#!/usr/bin/env python3
"""Writes furniture/index.json: {folder: [files...]}. The game uses it to auto-recognise furniture and colour variations."""
import os, json
root = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'furniture')
out = {d: sorted(os.listdir(os.path.join(root, d))) for d in sorted(os.listdir(root)) if os.path.isdir(os.path.join(root, d))}
with open(os.path.join(root, 'index.json'), 'w') as f:
    json.dump(out, f, indent=1)
print('index.json:', len(out), 'folders')
