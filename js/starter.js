// Blockhaven - the starter apartment (built through the same API the player uses)
import * as W from './world.js';
import { catalog } from './catalog.js';

export const SPAWN = { x: 11.5, y: 9.5 };   // cell coords

export function buildStarter() {
  W.clearAll();
  const has = id => catalog.has(id);
  const wallLine = (type, o, x, y, len, color = 'white') => {
    for (let i = 0; i < len; i++) if (has(type)) W.placeEdge(type, o, o === 'h' ? x + i : x, o === 'h' ? y : y + i, color);
  };
  const one = (type, o, x, y, color) => { if (has(type)) W.placeEdge(type, o, x, y, color); };

  // outer walls
  wallLine('wall', 'h', 6, 4, 20); wallLine('wall', 'h', 6, 18, 20);
  wallLine('wall', 'v', 6, 4, 14); wallLine('wall', 'v', 26, 4, 14);
  // inner walls
  wallLine('wall', 'v', 16, 4, 8); wallLine('wall', 'h', 6, 12, 20); wallLine('wall', 'v', 14, 12, 6);
  // doors (front door + inside doors)
  one('door', 'h', 16, 18, 'brown'); one('door', 'v', 16, 8, 'brown');
  one('door', 'h', 10, 12, 'brown'); one('door', 'h', 20, 12, 'brown'); one('door', 'v', 14, 15, 'brown');
  // windows
  [[8, 4], [11, 4], [19, 4], [22, 4], [8, 18], [21, 18], [24, 18]].forEach(([x, y]) => one('window', 'h', x, y, 'white'));
  [[6, 6], [6, 14], [26, 6], [26, 14]].forEach(([x, y]) => one('window', 'v', x, y, 'white'));

  // rooms + floors
  const rooms = [
    ['Living room', 6, 4, 10, 8, 'brown'],
    ['Kitchen', 16, 4, 10, 8, 'white'],
    ['Bedroom', 6, 12, 8, 6, 'light blue'],
    ['Dining room', 14, 12, 12, 6, 'gray'],
  ];
  for (const [name, x, y, w, h, floor] of rooms) {
    const r = W.addRoom(x, y, w, h); r.name = name; W.setRoomFloor(r, floor);
  }
  W.paintFloor([[15, 18], [16, 18], [17, 18], [15, 19], [16, 19], [17, 19]], 'light gray');

  // furniture
  const put = (type, x, y, rot, color) => { if (has(type) && W.canPlace(type, x, y, rot)) W.placeItem(type, x, y, rot, color); };
  // living room
  put('couch', 8, 9, 2, 'blue'); put('tv', 9, 5, 0, 'black'); put('bookshelf', 13, 5, 0, 'brown');
  put('plant', 7, 5, 0, 'orange'); put('lamp', 14, 10, 0, 'yellow');
  // kitchen
  put('fridge', 17, 5, 0, 'white');
  put('nightstand', 18, 5, 0, 'light gray'); put('nightstand', 19, 5, 0, 'light gray'); put('nightstand', 20, 5, 0, 'light gray');
  put('plant', 24, 5, 0, 'orange');
  // bedroom
  put('bed', 7, 13, 0, 'red'); put('nightstand', 9, 13, 0, 'brown'); put('lamp', 6, 13, 0, 'yellow');
  put('wardrobe', 11, 16, 2, 'brown');
  // dining room
  put('table', 18, 14, 0, 'brown');
  put('chair', 18, 13, 0, 'white'); put('chair', 19, 13, 0, 'white');
  put('chair', 18, 16, 2, 'white'); put('chair', 19, 16, 2, 'white');
  put('bookshelf', 22, 17, 0, 'brown'); put('plant', 24, 13, 0, 'orange'); put('lamp', 15, 13, 0, 'yellow');

  W.clearHistory();
  W.touch();
}