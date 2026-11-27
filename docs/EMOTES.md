# Adding emotes

Open the chat (chat button or Enter) and every emote is listed under the chat box as a silhouette of its pose (scroll for more). Tap one and your character plays it;
in multiplayer everyone sees it. Walking, sitting or using something stops it. One-shot emotes end by themselves, looping
ones (`loop=1`) keep going until you move.

Create `emotes/<id>/` with two files and that's it - the game finds new folders by itself:

- `info.txt`
  ```
  name=Wave        # label under the button
  duration=2.6     # seconds (for looping emotes this is only a hint)
  loop=0           # 1 = repeat until the player moves
  order=10         # position in the tray (lower first, then A-Z)
  preview=0.9      # moment (seconds) of the pose drawn as the tray silhouette
  ```
- `emote.js`
  ```js
  export default {
    // Called every frame. t = seconds since the emote started. Return any of these (all optional):
    //   x, y      shift in px (negative y = up)          rot   tilt in radians, around the feet
    //   sx, sy    squash / stretch (1 = normal)          dir   'down' | 'left' | 'up' | 'right' to turn the body
    //   arms      { l: {a, f}, r: {a, f} }  a = upper arm angle (0 down, 1.57 sideways, 3.14 straight up),
    //             f = extra forearm bend. l / r are the left / right arm as you see them from the front.
    pose(t, P, fx) { return { arms: { r: { a: 2.4, f: Math.sin(t * 10) * 0.5 } } }; },

    // Optional: draw extras in world pixels (P.x, P.y is the character's spot; the feet are at P.y + 9).
    draw(c, P, t, fx) { fx.shape(c, 'spark', P.x, P.y - 86, 20, '#fde047'); },
  };
  ```
  `fx` has `shape(c, name, x, y, size, color, alpha, rot)` (built-in SVG shapes: heart, star, spark, note, drop, anger), `text(c, s, x, y, size, color, alpha)`, `hump(u)` (0 to 1 to 0), `rand(n)`
  (a pseudo random number that is the same on every device) and `clamp`.

The tray silhouette is generated from `pose()` at the `preview` time, so new emotes get one automatically. To use your own
artwork instead, put an `icon.svg` in the folder. No emoji anywhere: they look different on every device, so effects are
drawn from SVG paths (add more to `SHAPES` in `js/emotes.js`).

Then run `python3 tools/build_index.py` to refresh `emotes/index.json` (the GitHub Action does this on push). Without the
index the game falls back to the GitHub API, so a freshly pushed folder still shows up.

Multiplayer needs nothing extra: only the emote id and a play counter travel with the normal position updates, and each
device animates it locally from the same `pose()` code.
