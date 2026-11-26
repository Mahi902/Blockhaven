// Arcade cabinet: four real mini-games you can actually play, with a saved high-score table.
//   Space Blasters - shoot the invaders        Block Stacker - drop blocks to build a tower
//   Pixel Racer    - dodge traffic, beat the clock     Tiny Kong - climb the girders, jump the barrels
// Controls: A/D or arrow keys to move, W/up to climb or boost, Space to fire / drop / jump. On a phone, use the buttons.
const W = 320, H = 380;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rnd = (a, b) => a + Math.random() * (b - a);
const hit = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const pad = n => String(Math.floor(n)).padStart(5, "0");

const LIST = [
  ["blasters", "Space Blasters", "Defend the galaxy", "\u25C0 \u25B6 move  \u2022  Space fires"],
  ["stacker", "Block Stacker", "Fit the falling blocks", "Space drops the block - line it up!"],
  ["racer", "Pixel Racer", "Race against the clock", "\u25C0 \u25B6 steer  \u2022  \u25B2 boost  \u2022  grab the clocks"],
  ["kong", "Tiny Kong", "Climb to the top", "\u25C0 \u25B6 walk  \u2022  \u25B2 \u25BC ladders  \u2022  Space jumps"],
];
const ACTION = { blasters: "FIRE", stacker: "DROP", racer: "BOOST", kong: "JUMP" };

// ---------------------------------------------------------------- Space Blasters
function blasters(io) {
  const ship = { x: W / 2, y: H - 34 };
  let bullets = [], shots = [], en = [], dir = 1, ox = 0, oy = 0, cd = 0, inv = 0, lives = 3, score = 0, wave = 1, fireT = 1.2;
  const stars = Array.from({ length: 45 }, () => ({ x: rnd(0, W), y: rnd(0, H), s: rnd(8, 36) }));
  const spawn = () => { en = []; for (let r = 0; r < 4; r++) for (let c = 0; c < 8; c++) en.push({ r, c, alive: true }); ox = 20; oy = 44; dir = 1; };
  const pos = e => ({ x: ox + e.c * 32, y: oy + e.r * 26, w: 20, h: 14 });
  spawn();
  return {
    get score() { return score; },
    hud: () => "LIVES " + lives + "  WAVE " + wave,
    update(dt) {
      if (io.keys.left) ship.x -= 175 * dt;
      if (io.keys.right) ship.x += 175 * dt;
      ship.x = clamp(ship.x, 16, W - 16);
      cd -= dt; inv -= dt;
      if ((io.keys.fire || io.keys.up) && cd <= 0) { bullets.push({ x: ship.x - 1.5, y: ship.y - 8, w: 3, h: 9 }); cd = 0.28; io.blip(76, 0.07); }
      bullets.forEach(b => { b.y -= 400 * dt; });
      bullets = bullets.filter(b => b.y > -10);
      const alive = en.filter(e => e.alive);
      ox += dir * (26 + wave * 7 + (32 - alive.length) * 2.2) * dt;
      if (alive.length) {
        const xs = alive.map(e => pos(e).x), lo = Math.min(...xs), hi = Math.max(...xs) + 20;
        if ((dir > 0 && hi > W - 6) || (dir < 0 && lo < 6)) { dir = -dir; oy += 14; }
      }
      fireT -= dt;
      if (fireT <= 0 && alive.length) {
        fireT = rnd(0.5, 1.2) / (1 + wave * 0.12);
        const p = pos(alive[Math.floor(Math.random() * alive.length)]);
        shots.push({ x: p.x + 8, y: p.y + 14, w: 4, h: 9 });
      }
      shots.forEach(s => { s.y += (150 + wave * 12) * dt; });
      shots = shots.filter(s => s.y < H + 10);
      for (const b of bullets) for (const e of alive) {
        if (e.alive && !b.dead && hit(b, pos(e))) { e.alive = false; b.dead = true; score += 10 + (3 - e.r) * 5; io.blip(84 + (3 - e.r) * 2, 0.12); }
      }
      bullets = bullets.filter(b => !b.dead);
      const sr = { x: ship.x - 12, y: ship.y, w: 24, h: 14 };
      if (inv <= 0) for (const s of shots) if (hit(s, sr)) { s.dead = true; lives--; inv = 1.4; io.sfx("error"); if (lives <= 0) io.end(); break; }
      shots = shots.filter(s => !s.dead);
      if (en.some(e => e.alive && pos(e).y + 14 > ship.y)) { lives = 0; io.end(); }
      if (!en.some(e => e.alive)) { wave++; score += 100; shots = []; bullets = []; spawn(); io.sfx("good"); }
    },
    draw(c) {
      c.fillStyle = "#070a1c"; c.fillRect(0, 0, W, H);
      c.fillStyle = "#fff";
      stars.forEach(s => { s.y = (s.y + s.s * 0.016) % H; c.globalAlpha = 0.35 + s.s / 80; c.fillRect(s.x, s.y, 1.5, 1.5); });
      c.globalAlpha = 1;
      const cols = ["#ff7a8a", "#ffb347", "#8ff0a4", "#8cc8ff"];
      for (const e of en) if (e.alive) {
        const p = pos(e); c.fillStyle = cols[e.r];
        c.fillRect(p.x + 3, p.y, 14, 10); c.fillRect(p.x, p.y + 3, 20, 6);
        c.fillRect(p.x + 2, p.y + 10, 3, 4); c.fillRect(p.x + 15, p.y + 10, 3, 4);
        c.fillStyle = "#070a1c"; c.fillRect(p.x + 5, p.y + 3, 3, 3); c.fillRect(p.x + 12, p.y + 3, 3, 3);
      }
      c.fillStyle = "#fff"; bullets.forEach(b => c.fillRect(b.x, b.y, b.w, b.h));
      c.fillStyle = "#ff5c7a"; shots.forEach(s => c.fillRect(s.x, s.y, s.w, s.h));
      if (inv <= 0 || Math.floor(inv * 10) % 2) {
        c.fillStyle = "#8cc8ff"; c.fillRect(ship.x - 12, ship.y + 6, 24, 8); c.fillRect(ship.x - 4, ship.y, 8, 8);
        c.fillStyle = "#dbe9ff"; c.fillRect(ship.x - 2, ship.y - 5, 4, 6);
      }
    },
  };
}

// ---------------------------------------------------------------- Block Stacker
function stacker(io) {
  const RH = 18, BASE = H - 24;
  const rows = [{ x: 90, w: 140 }];
  let cur = null, cuts = [], score = 0, perfects = 0, flash = 0;
  const spawn = () => { const p = rows[rows.length - 1]; cur = { x: 0, w: p.w, dir: 1 }; };
  const col = i => "hsl(" + ((i * 23) % 360) + ",75%,62%)";
  spawn();
  return {
    get score() { return score; },
    hud: () => "ROWS " + rows.length + "  PERFECT " + perfects,
    update(dt) {
      flash -= dt;
      cur.x += cur.dir * Math.min(300, 105 + rows.length * 8) * dt;
      if (cur.x < 0) { cur.x = 0; cur.dir = 1; }
      if (cur.x + cur.w > W) { cur.x = W - cur.w; cur.dir = -1; }
      cuts.forEach(k => { k.vy += 500 * dt; k.y += k.vy * dt; });
      cuts = cuts.filter(k => k.y < H + 40);
      if (io.tap.fire || io.tap.up) {
        io.tap.fire = io.tap.up = false;
        const p = rows[rows.length - 1], y = BASE - rows.length * RH;
        const left = Math.max(p.x, cur.x), right = Math.min(p.x + p.w, cur.x + cur.w), ov = right - left;
        if (ov < 4) { cuts.push({ x: cur.x, w: cur.w, y, vy: 0, c: col(rows.length) }); io.sfx("error"); io.end(); return; }
        if (Math.abs(cur.x - p.x) < 5) { rows.push({ x: p.x, w: p.w }); score += 150; perfects++; flash = 0.25; io.blip(88, 0.2); io.blip(95, 0.25); }
        else {
          if (cur.x < left) cuts.push({ x: cur.x, w: left - cur.x, y, vy: 0, c: col(rows.length) });
          if (cur.x + cur.w > right) cuts.push({ x: right, w: cur.x + cur.w - right, y, vy: 0, c: col(rows.length) });
          rows.push({ x: left, w: ov }); score += 100; io.blip(72 + Math.min(20, rows.length), 0.15);
        }
        spawn();
      }
    },
    draw(c) {
      c.fillStyle = flash > 0 ? "#2a2f66" : "#141836"; c.fillRect(0, 0, W, H);
      const top = BASE - (rows.length + 1) * RH, shift = Math.max(0, 130 - top);
      c.save(); c.translate(0, shift);
      c.fillStyle = "#2b2f55"; c.fillRect(0, BASE, W, 40 + shift);
      rows.forEach((r, i) => { const y = BASE - (i + 1) * RH; c.fillStyle = col(i); c.fillRect(r.x, y, r.w, RH - 2); c.fillStyle = "rgba(255,255,255,.25)"; c.fillRect(r.x, y, r.w, 3); });
      const cy = BASE - (rows.length + 1) * RH;
      c.fillStyle = col(rows.length); c.fillRect(cur.x, cy, cur.w, RH - 2); c.fillStyle = "rgba(255,255,255,.25)"; c.fillRect(cur.x, cy, cur.w, 3);
      cuts.forEach(k => { c.fillStyle = k.c; c.fillRect(k.x, k.y - RH, k.w, RH - 2); });
      c.restore();
    },
  };
}

// ---------------------------------------------------------------- Pixel Racer
function racer(io) {
  const RX = 60, RW = 200;
  const car = { x: W / 2 - 11, y: H - 72, w: 22, h: 38 };
  let obs = [], clocks = [], dist = 0, speed = 150, time = 40, inv = 0, spawnT = 0.4, clockT = 5, roadOff = 0, slow = 0;
  const COLS = ["#8cc8ff", "#ffb347", "#8ff0a4", "#c9a6ff", "#ff9bd0"];
  const body = (c, x, y, w, h, col) => {
    c.fillStyle = col; c.fillRect(x, y + 2, w, h - 4); c.fillRect(x + 2, y, w - 4, h);
    c.fillStyle = "rgba(0,0,0,.45)"; c.fillRect(x + 3, y + 8, w - 6, 8); c.fillRect(x + 3, y + h - 12, w - 6, 5);
    c.fillStyle = "#111"; c.fillRect(x - 2, y + 5, 3, 9); c.fillRect(x + w - 1, y + 5, 3, 9); c.fillRect(x - 2, y + h - 14, 3, 9); c.fillRect(x + w - 1, y + h - 14, 3, 9);
  };
  return {
    get score() { return dist; },
    hud: () => "TIME " + Math.ceil(time) + "s",
    update(dt) {
      time -= dt; inv -= dt; slow -= dt;
      if (time <= 0) { time = 0; io.end(); return; }
      car.x = clamp(car.x + ((io.keys.right ? 1 : 0) - (io.keys.left ? 1 : 0)) * 215 * dt, RX + 4, RX + RW - 4 - car.w);
      speed = Math.min(330, 150 + dist / 5) + (io.keys.up || io.keys.fire ? 55 : 0) - (io.keys.down ? 50 : 0);
      if (slow > 0) speed *= 0.45;
      dist += speed * dt / 9; roadOff = (roadOff + speed * dt) % 40;
      spawnT -= dt;
      if (spawnT <= 0) { spawnT = rnd(0.45, 1.0) * 220 / speed; obs.push({ x: rnd(RX + 6, RX + RW - 28), y: -44, w: 22, h: 38, v: rnd(40, 100), col: COLS[Math.floor(Math.random() * COLS.length)] }); }
      clockT -= dt;
      if (clockT <= 0) { clockT = rnd(5, 8); clocks.push({ x: rnd(RX + 14, RX + RW - 14), y: -20, r: 9 }); }
      obs.forEach(o => { o.y += (speed - o.v) * dt; });
      clocks.forEach(k => { k.y += speed * dt; });
      obs = obs.filter(o => o.y < H + 50 && o.y > -120);
      clocks = clocks.filter(k => k.y < H + 20);
      const box = { x: car.x + 3, y: car.y + 4, w: car.w - 6, h: car.h - 8 };
      for (const o of obs) if (inv <= 0 && hit(box, { x: o.x + 2, y: o.y + 3, w: o.w - 4, h: o.h - 6 })) { o.y = H + 99; time = Math.max(0, time - 3); inv = 1.4; slow = 0.8; io.sfx("error"); }
      for (const k of clocks) if (Math.hypot(k.x - (car.x + 11), k.y - (car.y + 19)) < 20) { k.y = H + 99; time = Math.min(60, time + 2.5); io.blip(90, 0.15); }
    },
    draw(c) {
      c.fillStyle = "#2f8f4a"; c.fillRect(0, 0, W, H);
      c.fillStyle = "#3aa85a"; for (let y = -40 + roadOff; y < H; y += 40) { c.fillRect(8, y, 10, 14); c.fillRect(W - 20, y + 18, 10, 14); }
      c.fillStyle = "#3b3f48"; c.fillRect(RX, 0, RW, H);
      c.fillStyle = "#e8e8e8"; c.fillRect(RX - 4, 0, 4, H); c.fillRect(RX + RW, 0, 4, H);
      c.fillStyle = "#f5d76e"; for (let y = -40 + roadOff; y < H; y += 40) { c.fillRect(RX + RW / 3 - 1, y, 3, 22); c.fillRect(RX + 2 * RW / 3 - 1, y, 3, 22); }
      obs.forEach(o => body(c, o.x, o.y, o.w, o.h, o.col));
      clocks.forEach(k => { c.fillStyle = "#ffd27a"; c.beginPath(); c.arc(k.x, k.y, k.r, 0, 7); c.fill(); c.strokeStyle = "#7a5a1a"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(k.x, k.y - 5); c.lineTo(k.x, k.y); c.lineTo(k.x + 4, k.y + 2); c.stroke(); });
      if (inv <= 0 || Math.floor(inv * 12) % 2) body(c, car.x, car.y, car.w, car.h, "#ff5c7a");
    },
  };
}

// ---------------------------------------------------------------- Tiny Kong
function kong(io) {
  const FY = [352, 290, 228, 166, 104];
  const LX = f => (f % 2 === 0 ? 268 : 52);
  const JT = 0.62;
  const pl = { x: 40, f: 0, y: FY[0], climbing: false, L: 0, jump: 0, face: 1, walk: 0 };
  let barrels = [], lives = 3, score = 0, level = 1, spawnT = 1.2, inv = 0, t = 0;
  const reset = () => { Object.assign(pl, { x: 40, f: 0, y: FY[0], climbing: false, jump: 0 }); barrels = []; inv = 1.5; spawnT = 1.2; };
  const lift = () => (pl.jump > 0 ? Math.sin(Math.PI * (1 - pl.jump / JT)) * 22 : 0);
  return {
    get score() { return score; },
    hud: () => "LIVES " + lives + "  LEVEL " + level,
    update(dt) {
      t += dt; inv -= dt;
      if (pl.jump > 0) pl.jump -= dt;
      if (!pl.climbing) {
        const mv = (io.keys.right ? 1 : 0) - (io.keys.left ? 1 : 0);
        pl.x = clamp(pl.x + mv * 100 * dt, 12, W - 12);
        if (mv) { pl.face = mv; pl.walk += dt * 12; }
        if (io.tap.fire && pl.jump <= 0) { pl.jump = JT; io.blip(79, 0.1); }
        if (pl.jump <= 0) {
          if (pl.f < 4 && io.keys.up && Math.abs(pl.x - LX(pl.f)) < 10) { pl.climbing = true; pl.L = pl.f; pl.x = LX(pl.f); }
          else if (pl.f > 0 && io.keys.down && Math.abs(pl.x - LX(pl.f - 1)) < 10) { pl.climbing = true; pl.L = pl.f - 1; pl.x = LX(pl.f - 1); }
        }
      } else {
        const v = ((io.keys.down ? 1 : 0) - (io.keys.up ? 1 : 0)) * 72 * dt;
        pl.y += v; if (v) pl.walk += dt * 12;
        if (pl.y <= FY[pl.L + 1]) { pl.y = FY[pl.L + 1]; pl.f = pl.L + 1; pl.climbing = false; }
        else if (pl.y >= FY[pl.L]) { pl.y = FY[pl.L]; pl.f = pl.L; pl.climbing = false; }
      }
      io.tap.fire = false;
      if (pl.f === 4 && !pl.climbing) { score += 500 + level * 100; level++; io.sfx("good"); io.blip(88, 0.3); reset(); return; }
      spawnT -= dt;
      if (spawnT <= 0) { barrels.push({ x: 132, y: FY[4] - 7, f: 4, fall: false, spin: 0 }); spawnT = Math.max(0.75, 1.9 - level * 0.16) + rnd(0, 0.7); }
      const sp = 68 + level * 9;
      for (const b of barrels) {
        b.spin += dt * 8;
        if (b.fall) { b.y += 150 * dt; if (b.y >= FY[b.f] - 7) { b.y = FY[b.f] - 7; b.fall = false; } continue; }
        const d = b.f % 2 === 0 ? 1 : -1;
        b.x += d * sp * dt;
        if ((d > 0 && b.x > W - 10) || (d < 0 && b.x < 10)) { b.f--; if (b.f < 0) b.gone = true; else b.fall = true; }
      }
      barrels = barrels.filter(b => !b.gone);
      const hgt = lift(), cy = pl.y - 10 - hgt;
      for (const b of barrels) {
        if (b.fall) continue;
        if (!b.scored && !pl.climbing && pl.jump > 0 && b.f === pl.f && Math.abs(b.x - pl.x) < 12 && hgt > 9) { b.scored = true; score += 50; io.blip(91, 0.1); }
        if (inv <= 0 && Math.abs(b.x - pl.x) < 11 && Math.abs(b.y - cy) < 13) {
          lives--; io.sfx("error");
          if (lives <= 0) { io.end(); return; }
          reset(); return;
        }
      }
    },
    draw(c) {
      c.fillStyle = "#10142e"; c.fillRect(0, 0, W, H);
      FY.forEach((y, f) => {
        c.fillStyle = "#b5532e"; c.fillRect(8, y, W - 16, 6);
        c.fillStyle = "#e28a5e"; for (let x = 14; x < W - 10; x += 16) c.fillRect(x, y + 1, 3, 3);
        if (f < 4) {
          const x = LX(f); c.fillStyle = "#8cc8ff"; c.fillRect(x - 8, FY[f + 1] + 6, 2, y - FY[f + 1] - 6); c.fillRect(x + 6, FY[f + 1] + 6, 2, y - FY[f + 1] - 6);
          for (let r = FY[f + 1] + 12; r < y; r += 9) c.fillRect(x - 8, r, 16, 2);
        }
      });
      const kx = 96, ky = FY[4];
      c.fillStyle = "#7a4a2a"; c.fillRect(kx - 16, ky - 34, 32, 34); c.fillRect(kx - 10, ky - 46, 20, 14); c.fillRect(kx - 26, ky - 30 + Math.sin(t * 6) * 3, 10, 18); c.fillRect(kx + 16, ky - 30 - Math.sin(t * 6) * 3, 10, 18);
      c.fillStyle = "#e8c9a0"; c.fillRect(kx - 7, ky - 42, 14, 8); c.fillStyle = "#111"; c.fillRect(kx - 5, ky - 40, 3, 3); c.fillRect(kx + 2, ky - 40, 3, 3);
      c.fillStyle = "#ff9bd0"; c.fillRect(24, ky - 14, 10, 14); c.fillStyle = "#ffd9a8"; c.fillRect(26, ky - 22, 7, 8);
      for (const b of barrels) {
        c.save(); c.translate(b.x, b.y); c.rotate(b.spin); c.fillStyle = "#c97a3a"; c.beginPath(); c.arc(0, 0, 7, 0, 7); c.fill();
        c.strokeStyle = "#5a3418"; c.lineWidth = 2; c.beginPath(); c.moveTo(-7, 0); c.lineTo(7, 0); c.stroke(); c.restore();
      }
      if (inv <= 0 || Math.floor(inv * 12) % 2) {
        const hgt = lift(), px = pl.x, py = pl.y - hgt, step = pl.climbing ? Math.sin(pl.walk) * 2 : 0;
        c.fillStyle = "#3a3f9a"; c.fillRect(px - 5, py - 9, 10, 9);
        c.fillStyle = "#ff5c7a"; c.fillRect(px - 6, py - 18, 12, 10);
        c.fillStyle = "#ffd9a8"; c.fillRect(px - 5, py - 25, 10, 8);
        c.fillStyle = "#ff5c7a"; c.fillRect(px - 6, py - 28, 12, 4); c.fillRect(px + (pl.face > 0 ? 3 : -9), py - 26, 6, 2);
        if (pl.climbing || Math.abs(Math.sin(pl.walk)) > 0.5) { c.fillStyle = "#ffd9a8"; c.fillRect(px - 8, py - 17 + step, 3, 5); c.fillRect(px + 5, py - 17 - step, 3, 5); }
      }
    },
  };
}
const MAKERS = { blasters, stacker, racer, kong };

// ---------------------------------------------------------------- the cabinet
const KEYMAP = { arrowleft: "left", a: "left", arrowright: "right", d: "right", arrowup: "up", w: "up", arrowdown: "down", s: "down", " ": "fire", enter: "fire", z: "fire", x: "fire" };

export default api => {
  const { h, button, choice } = api.ui;
  delete api.state.busy;                                   // from the old fake game
  const best = () => api.state.hi || (api.state.hi = {});

  function menu() {
    const body = h("div", { class: "bh-list" }, LIST.map(([id, name, sub]) =>
      choice(name, best()[id] ? sub + "  \u2022  Best " + best()[id] : sub, () => play(id))));
    api.modal({ title: "Arcade", subtitle: "Pick a game", body, onClose: () => api.glow(null) });
    api.glow("#c9a6ff", 2, { temp: true });
  }

  function play(id) {
    const info = LIST.find(g => g[0] === id);
    const io = { keys: {}, tap: {}, blip: (m, d = 0.12) => api.note(m, d, 0.5), sfx: n => api.sound(n), end: () => finish() };
    let game = MAKERS[id](io), over = false, overT = 0, stopped = false, raf = 0, newBest = false, last = performance.now();

    const canvas = h("canvas", { width: W * 2, height: H * 2, style: { width: "100%", maxWidth: "340px", display: "block", margin: "0 auto", borderRadius: "10px", border: "3px solid #2b2f55", background: "#000", imageRendering: "pixelated", touchAction: "none" } });
    const c = canvas.getContext("2d");

    function finish() {
      if (over) return;
      over = true; overT = 0; io.keys = {};
      const s = Math.floor(game.score), b = best();
      newBest = s > (b[id] || 0);
      if (newBest) b[id] = s;
      api.state.plays = (api.state.plays || 0) + 1;
      api.save();
      api.sound("good");
      api.say(newBest ? "New high score on " + info[1] + ": " + s + "!" : "Game over! Score: " + s);
    }
    function restart() { io.keys = {}; io.tap = {}; game = MAKERS[id](io); over = false; newBest = false; }

    function drawFrame() {
      c.setTransform(2, 0, 0, 2, 0, 0);
      game.draw(c);
      c.fillStyle = "rgba(0,0,0,.55)"; c.fillRect(0, 0, W, 20);
      c.font = "bold 12px monospace"; c.textBaseline = "middle";
      c.fillStyle = "#ffd27a"; c.textAlign = "left"; c.fillText("SCORE " + pad(game.score), 8, 10);
      c.fillStyle = "#dbe9ff"; c.textAlign = "right"; c.fillText(game.hud(), W - 8, 10);
      if (over) {
        c.fillStyle = "rgba(5,8,25,.78)"; c.fillRect(0, 0, W, H);
        c.textAlign = "center";
        c.fillStyle = "#ff7a8a"; c.font = "bold 28px monospace"; c.fillText("GAME OVER", W / 2, H / 2 - 44);
        c.fillStyle = "#fff"; c.font = "bold 16px monospace"; c.fillText("SCORE " + pad(game.score), W / 2, H / 2 - 8);
        c.fillStyle = newBest ? "#8ff0a4" : "#9aa7d6"; c.fillText((newBest ? "NEW BEST  " : "BEST  ") + pad(best()[id] || 0), W / 2, H / 2 + 18);
        if (overT > 0.7 && Math.floor(overT * 2) % 2 === 0) { c.fillStyle = "#ffd27a"; c.font = "bold 13px monospace"; c.fillText("PRESS SPACE TO PLAY AGAIN", W / 2, H / 2 + 56); }
      }
    }
    function loop(now) {
      if (stopped) return;
      const dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
      try {
        if (over) { overT += dt; if (overT > 0.7 && io.tap.fire) restart(); }
        else game.update(dt);
        io.tap = {};
        drawFrame();
      } catch (e) { console.error("[arcade]", e); stopped = true; return; }
      raf = requestAnimationFrame(loop);
    }

    const down = e => {
      const k = KEYMAP[String(e.key).toLowerCase()]; if (!k) return;
      e.preventDefault(); e.stopPropagation();
      if (!e.repeat) io.tap[k] = true;
      io.keys[k] = true;
    };
    const up = e => { const k = KEYMAP[String(e.key).toLowerCase()]; if (k) { e.preventDefault(); io.keys[k] = false; } };
    document.addEventListener("keydown", down, true);
    document.addEventListener("keyup", up, true);

    // on-screen pad for touch
    const pb = (label, key, extra) => {
      const b = h("button", { type: "button", class: "bh-btn bh-blue", style: Object.assign({ minWidth: "52px", height: "46px", fontSize: "18px", touchAction: "none", userSelect: "none" }, extra || {}) }, label);
      const on = e => { e.preventDefault(); io.keys[key] = true; io.tap[key] = true; };
      const off = e => { e.preventDefault(); io.keys[key] = false; };
      b.addEventListener("pointerdown", on); b.addEventListener("pointerup", off); b.addEventListener("pointerleave", off); b.addEventListener("pointercancel", off);
      return b;
    };
    const showUp = id === "racer" || id === "kong";
    const pad2 = h("div", { style: { display: "flex", gap: "8px", justifyContent: "center", alignItems: "center", margin: "10px 0 6px", flexWrap: "wrap" } },
      pb("\u25C0", "left"), pb("\u25B6", "right"),
      showUp ? pb("\u25B2", "up") : null, id === "kong" ? pb("\u25BC", "down") : null,
      pb(ACTION[id], "fire", { minWidth: "84px", fontSize: "14px" }));
    const foot = h("div", { style: { display: "flex", gap: "8px", justifyContent: "center" } },
      button("Back to games", { kind: "dark", small: true, onClick: () => menu() }));

    api.modal({
      title: info[1], subtitle: info[3],
      body: h("div", {}, canvas, pad2, foot),
      onClose: () => {
        stopped = true; cancelAnimationFrame(raf);
        document.removeEventListener("keydown", down, true); document.removeEventListener("keyup", up, true);
        api.glow(null);
      },
    });
    api.glow("#c9a6ff", 2, { temp: true });
    api.sound("switch");
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    raf = requestAnimationFrame(loop);
  }

  menu();
};
