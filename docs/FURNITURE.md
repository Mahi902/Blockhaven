# Adding furniture

Create `furniture/<id>/` with:

- `info.txt`
  ```
  name=Couch
  description=A soft three-seater.
  block=3          # area in tiles; 0 = a wall-style piece that sits on a tile edge
  function=Sit down  # tooltip shown while using it; empty = decoration
  ```
- One SVG per colour, named after the colour: `white, light gray, gray, black, brown, red, orange, yellow, lime, green, cyan, light blue, blue, purple, magenta, pink`. Any `*.svg` is picked up automatically. Sprite size comes from the SVG `viewBox` (48 units = 1 tile).
- Optional `function.js`. No `function.js` (or an empty `function=`) means pure decoration.

```js
export default api => { api.sit(); };            // or api.lie(), api.modal({...}), api.glow('#ffd27a', 3) ...
```
`api.ui` gives `h, button, choice, swatches, toast` built on the game's own CSS, so function.js never needs CSS of its own.

The game finds folders through `furniture/index.json` (rebuilt by the GitHub Action, or `python3 tools/build_index.py`), falling back to the GitHub API.
