# Blockhaven
A free-form apartment sandbox: build rooms, place furniture, walk around, sit, sleep, talk. No quests.

- Play: https://mahi902.github.io/Blockhaven/
- Controls: WASD / click to move, E to use, Enter to talk, B to build, R rotate, Ctrl+Z undo.
- Rooms: in Build mode use the Room tool to drag an outline, then set the room's floor, walls and ceiling. The Floor tool paints many tiles at once (floor colours are textures).
- Emotes: click the chat button (or press Enter), then tap any emote silhouette under the chat box; everyone in a multiplayer game sees it. Move to stop. Add your own by dropping a folder in `emotes/` - see `docs/EMOTES.md`. In multiplayer, walk up to another player for "Perform Emote Together" (hug, handshake, high five...): they tap to accept, double tap to decline.
- Furniture format: see `docs/FURNITURE.md`. Regenerate the stock sprites with `python3 tools/gen_assets.py`.
