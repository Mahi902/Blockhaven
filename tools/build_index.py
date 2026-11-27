#!/usr/bin/env python3
"""Writes furniture/index.json and emotes/index.json: {folder: [files...]}.
The game uses them to auto-recognise furniture / colour variations and emotes."""
import os, json
base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
for name in ('furniture', 'emotes'):
    root = os.path.join(base, name)
    if not os.path.isdir(root):
        continue
    out = {d: sorted(os.listdir(os.path.join(root, d))) for d in sorted(os.listdir(root)) if os.path.isdir(os.path.join(root, d))}
    with open(os.path.join(root, 'index.json'), 'w') as f:
        json.dump(out, f, indent=1)
    print(f'{name}/index.json:', len(out), 'folders')
