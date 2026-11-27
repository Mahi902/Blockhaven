// Blockhaven - shared runtime state (everything that is not saved in the world file)
import { DEFAULT_LOOK, TILE } from './config.js';

export const S = {
  started: false,
  settings: { clickMove: true },
  mode: 'play',               // 'play' | 'build'
  tool: 'select',             // select | place | floor | room | erase
  selected: null,             // { kind: 'item'|'edge'|'room', id }
  camera: { x: 0, y: 0, zoom: 0.9 },
  view: { w: 800, h: 600, dpr: 1 },
  night: false,
  showCeilings: false,
  modalOpen: false,
  tick: 0,

  // player
  player: {
    name: 'Guest', x: 0, y: 0, dir: 'down', walk: 0, moving: false,
    seat: null,               // { id, lying, back:{x,y} } while sitting / lying down
    look: { ...DEFAULT_LOOK },
  },
  path: null,                 // [{x,y}] world px waypoints for click-to-move
  pendingInteract: null,      // { kind, id } to run on arrival
  bubbles: [],                // { text, ttl, name }
  keys: {},
  touchDir: { up: false, down: false, left: false, right: false },
  nearby: null,               // { kind, obj } interactable in reach

  // build tools
  place: { type: null, color: 'white', rot: 0 },
  floorChoice: 'brown',
  hoverWorld: null,           // {x,y} world px under pointer
  ghost: null,                // { type, x, y, rot, ok } cell coords
  linePreview: null,          // [{o,x,y,ok}] edges about to be placed
  rectPreview: null,          // {x,y,w,h,kind}
  dragItem: null,
  remote: [],                 // other players in a multiplayer session
  onSay: null,
};

export const worldToScreen = (wx, wy) => ({
  x: (wx - S.camera.x) * S.camera.zoom + S.view.w / 2,
  y: (wy - S.camera.y) * S.camera.zoom + S.view.h / 2,
});
export const screenToWorld = (sx, sy) => ({
  x: (sx - S.view.w / 2) / S.camera.zoom + S.camera.x,
  y: (sy - S.view.h / 2) / S.camera.zoom + S.camera.y,
});
export const cellOf = px => Math.floor(px / TILE);