// Blockhaven - multiplayer. Peer to peer over WebRTC; the two devices swap connection codes as QR codes
// (or pasted text), so no server or internet is needed (same Wi-Fi / hotspot).
import { S } from './state.js';
import * as W from './world.js';
import { h, button, choice, openModal, closeModal, toast } from './ui.js';
import { sound } from './audio.js';
import { VERSION } from './config.js';
import { npcSnapshot, npcApply } from './npc.js';

export const MP = { role: null, started: false, myRole: 'editor', myId: null, peers: new Map(), defaultRole: 'viewer', lobby: null };
let hooks = null, seq = 1, applying = false, lastSent = '', worldTimer = 0, posTimer = 0;
export const active = () => !!MP.role;
export const isGuest = () => MP.role === 'guest';
export const isHost = () => MP.role === 'host';
export const canEdit = () => MP.role !== 'guest' || MP.myRole === 'editor';
export function init(h_) { hooks = h_; }

// ---- codes ------------------------------------------------------------------
const b64 = u8 => btoa(String.fromCharCode(...u8)), unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
async function pipe(u8, S_) { const r = new Response(new Blob([u8]).stream().pipeThrough(S_)); return new Uint8Array(await r.arrayBuffer()); }
async function pack(desc) {
  const raw = new TextEncoder().encode(JSON.stringify({ t: desc.type, s: desc.sdp }));
  try { return 'Z' + b64(await pipe(raw, new CompressionStream('deflate-raw'))); } catch (e) { return 'R' + b64(raw); }
}
async function unpack(code) {
  code = String(code || '').trim(); const k = code[0], u = unb64(code.slice(1));
  const raw = k === 'Z' ? await pipe(u, new DecompressionStream('deflate-raw')) : u;
  const o = JSON.parse(new TextDecoder().decode(raw)); return { type: o.t, sdp: o.s };
}
const gathered = pc => new Promise(res => {
  if (pc.iceGatheringState === 'complete') return res();
  const t = setTimeout(res, 3500);
  pc.addEventListener('icegatheringstatechange', () => { if (pc.iceGatheringState === 'complete') { clearTimeout(t); res(); } });
});
async function wantCamera() {   // lets the browser show real LAN addresses; best effort
  try { const s = await navigator.mediaDevices.getUserMedia({ video: true }); s.getTracks().forEach(t => t.stop()); } catch (e) { /* fine */ }
}
const newPc = () => new RTCPeerConnection({ iceServers: [] });

// ---- messaging (chunked so big worlds fit) ------------------------------------
function send(dc, obj) {
  if (!dc || dc.readyState !== 'open') return;
  const s = JSON.stringify(obj), id = seq++, n = Math.ceil(s.length / 12000) || 1;
  for (let i = 0; i < n; i++) dc.send(`${id}:${i}:${n}:${s.slice(i * 12000, (i + 1) * 12000)}`);
}
function receiver(cb) {
  const parts = new Map();
  return ev => {
    const m = String(ev.data), a = m.indexOf(':'), b = m.indexOf(':', a + 1), c = m.indexOf(':', b + 1);
    const id = m.slice(0, a), i = +m.slice(a + 1, b), n = +m.slice(b + 1, c), data = m.slice(c + 1);
    let p = parts.get(id); if (!p) { p = []; parts.set(id, p); }
    p[i] = data; if (p.filter(x => x !== undefined).length === n) { parts.delete(id); try { cb(JSON.parse(p.join(''))); } catch (e) { console.error(e); } }
  };
}
const toAll = (obj, except = null) => { for (const p of MP.peers.values()) if (p.id !== except) send(p.dc, obj); };
let beatTimer = 0;
function startBeat() {
  clearInterval(beatTimer);
  beatTimer = setInterval(() => {
    const now = Date.now();
    if (isHost()) {
      toAll({ t: 'ping' });
      for (const p of MP.peers.values()) if (MP.started && p.hello && !p.ready) send(p.dc, { t: 'start', world: W.getSnapshot() });
      for (const p of [...MP.peers.values()]) if (now - (p.seen || now) > 15000) dropPeer(p, 'lost connection');
    } else if (isGuest()) {
      send(MP.dc, { t: 'ping' });
      if (now - (MP.seen || now) > 15000) { toast('Lost connection to the host', 3500); leave(true); }
    }
  }, 1000);
}
document.addEventListener('visibilitychange', () => { if (document.hidden) return; const n = Date.now(); MP.seen = n; for (const p of MP.peers.values()) p.seen = n; });
window.addEventListener('offline', () => { if (isGuest()) { toast('You went offline', 3000); leave(true); } });
window.addEventListener('pagehide', () => { if (isGuest() && MP.dc) send(MP.dc, { t: 'bye' }); else if (isHost()) toAll({ t: 'end' }); });
const me = () => ({ name: S.player.name, look: S.player.look });

// ---- QR ---------------------------------------------------------------------
function qrImg(text) {
  const q = window.qrcode(0, 'L'); q.addData(text); q.make();
  return h('img', { class: 'mp-qr', src: q.createDataURL(3, 2), alt: 'Connection code' });
}
function scanner(onCode) {
  const video = h('video', { class: 'mp-video', playsinline: true, muted: true });
  const cv = document.createElement('canvas'), cx = cv.getContext('2d', { willReadFrequently: true });
  let stream = null, alive = true, done = false;
  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then(s => {
    stream = s; video.srcObject = s; video.play();
    const tick = () => {
      if (!alive) return;
      if (video.videoWidth) {
        cv.width = video.videoWidth; cv.height = video.videoHeight; cx.drawImage(video, 0, 0);
        const r = window.jsQR(cx.getImageData(0, 0, cv.width, cv.height).data, cv.width, cv.height);
        if (r && r.data && !done) { done = true; onCode(r.data); }
      }
      requestAnimationFrame(tick);
    };
    tick();
  }).catch(() => toast('Camera not available - paste the code instead', 3200));
  return { el: video, stop: () => { alive = false; if (stream) stream.getTracks().forEach(t => t.stop()); } };
}
function codeBox(code) {
  const ta = h('textarea', { class: 'bh-input mp-code', readonly: true }); ta.value = code;
  ta.addEventListener('keydown', e => e.stopPropagation());
  return h('div', { class: 'bh-stack' }, ta, button('Copy code', { kind: 'dark', small: true, onClick: () => { ta.select(); try { navigator.clipboard.writeText(code); } catch (e) { document.execCommand('copy'); } toast('Code copied'); } }));
}
function pasteBox(label, onSubmit) {
  const ta = h('textarea', { class: 'bh-input mp-code', placeholder: 'Paste the code here' });
  ta.addEventListener('keydown', e => e.stopPropagation());
  return h('div', { class: 'bh-stack' }, ta, button(label, { kind: 'blue', small: true, onClick: () => ta.value.trim() && onSubmit(ta.value) }));
}


// One step of the connection: either "show a code" or "scan a code". A "Can't scan?" link at the bottom swaps
// the QR / camera for the plain text code / paste box.
const instr = (a, b) => h('div', { style: 'text-align:center;margin-bottom:6px' }, h('div', { style: 'font:800 20px Fredoka,sans-serif;color:#fde047;text-shadow:0 2px 0 rgba(0,0,0,.5)' }, a), b ? h('div', { class: 'bh-text' }, b) : null);
function showStep(code) {
  const area = h('div', {}); let alt = false;
  const link = h('button', { class: 'bh-text', type: 'button', style: 'background:none;border:0;text-decoration:underline;cursor:pointer;color:inherit;margin:8px auto 0;display:block' });
  const draw = () => { area.replaceChildren(alt ? codeBox(code) : qrImg(code)); link.textContent = alt ? 'Show the QR code' : "Can't scan?"; };
  link.addEventListener('click', () => { alt = !alt; draw(); }); draw();
  return { el: h('div', { class: 'bh-stack' }, instr('Ask the other person to scan', alt ? '' : 'Hold this code in front of their camera'), area, link), stop() {} };
}
function scanStep(onCode, what) {
  const area = h('div', {}); let alt = false, sc = null;
  const link = h('button', { class: 'bh-text', type: 'button', style: 'background:none;border:0;text-decoration:underline;cursor:pointer;color:inherit;margin:8px auto 0;display:block' });
  const draw = () => {
    if (sc) { sc.stop(); sc = null; }
    if (alt) area.replaceChildren(pasteBox('Connect', onCode)); else { sc = scanner(onCode); area.replaceChildren(sc.el); }
    link.textContent = alt ? 'Use the camera' : "Can't scan?";
  };
  link.addEventListener('click', () => { alt = !alt; draw(); }); draw();
  return { el: h('div', { class: 'bh-stack' }, instr("It's your turn to scan", what), area, link), stop() { if (sc) sc.stop(); } };
}

// ---- home screen: host or join --------------------------------------------------
export function openMultiplayer(worlds) {
  if (!window.RTCPeerConnection) { toast('This browser does not support multiplayer'); return; }
  openModal({
    title: 'Multiplayer', subtitle: 'Are you hosting or joining?',
    body: h('div', { class: 'bh-stack' },
      choice('Host', 'Pick one of your worlds and let others in', () => pickWorld(worlds)),
      choice('Join', 'Scan a host\'s code to join their world', openJoin)),
  });
}
function pickWorld(worlds) {
  openModal({
    title: 'Host a world', subtitle: 'Which world do you want to host?',
    body: h('div', { class: 'bh-stack' }, ...worlds.map(w => choice(w.name, 'Played ' + new Date(w.played).toLocaleDateString(), () => beginHost(w.id))),
      button('Back', { kind: 'dark', small: true, onClick: () => openMultiplayer(worlds) })),
  });
}
function beginHost(worldId) {
  stop(true);
  startBeat(); MP.role = 'host'; MP.worldId = worldId; MP.started = false; MP.peers = new Map(); MP.defaultRole = 'viewer'; MP.myId = 'host';
  openInvite();
}

// ---- host: invite players ---------------------------------------------------------
export async function openInvite() {
  await wantCamera();
  const pc = newPc(), dc = pc.createDataChannel('bh');
  const peer = { id: 'p' + (seq++), pc, dc, name: 'Player', look: null, role: MP.defaultRole, x: 0, y: 0, dir: 'down', mv: false, joined: false };
  dc.onmessage = receiver(m => hostGot(peer, m));
  dc.onopen = () => { peer.joined = true; peer.seen = Date.now(); MP.peers.set(peer.id, peer); sound('chat'); };
  dc.onclose = () => dropPeer(peer, 'left');
  pc.onconnectionstatechange = () => { if (['failed', 'closed', 'disconnected'].includes(pc.connectionState)) setTimeout(() => { if (pc.connectionState !== 'connected') dropPeer(peer, 'left'); }, 4000); };
  await pc.setLocalDescription(await pc.createOffer()); await gathered(pc);
  const code = await pack(pc.localDescription);
  const box = h('div', {}); let step = null, card = null;
  const set = (st, buttons) => { if (step) step.stop(); step = st; box.replaceChildren(st.el); };
  const finish = async txt => {
    try { await pc.setRemoteDescription(await unpack(txt)); if (step) step.stop(); box.replaceChildren(instr('Connecting...', 'Hang on a moment')); }
    catch (e) { toast('That code did not work'); }
  };
  const toScan = () => { set(scanStep(finish, 'Scan the reply code on their screen')); next.classList.add('hidden'); };
  const next = button('They scanned it', { kind: 'green', onClick: toScan });
  set(showStep(code));
  openModal({ title: 'Invite a player', subtitle: 'Works over the same Wi-Fi or hotspot', body: h('div', { class: 'bh-stack' }, box, next), locked: !MP.started,
    buttons: [{ label: 'Back', kind: MP.started ? 'dark' : 'red', onClick: () => { if (MP.peers.size) openLobby(); else { closeModal(); if (!MP.started) stop(true); } } }],
    onClose: () => { if (step) step.stop(); if (!peer.joined) { try { pc.close(); } catch (e) { /* ignore */ } } } });
}
function openLobby() {
  const names = () => [...MP.peers.values()].map(p => p.name).join(', ') || 'nobody yet';
  const body = h('div', { class: 'bh-stack' }, h('p', { class: 'bh-text' }, 'Connected: ' + names()),
    button('Invite another player', { kind: 'blue', onClick: openInvite }));
  const buttons = MP.started ? [{ label: 'Done', kind: 'green', onClick: closeModal }] : [{ label: 'Start game', kind: 'green', onClick: () => { closeModal(); hooks.startHost(MP.worldId); } }, { label: 'Cancel', kind: 'red', onClick: () => { closeModal(); stop(true); } }];
  openModal({ title: 'Player connected', subtitle: MP.started ? 'They are in your world' : 'Invite more, or start the game', body, buttons, locked: !MP.started });
}
export function onHostStart() { MP.started = true; startLoops(); W.listeners.push(onWorldChange); toAll({ t: 'start', world: W.getSnapshot() }); }

function hostGot(p, m) {
  p.seen = Date.now();
  if (m.t === 'ping') return;
  if (m.t === 'bye') { dropPeer(p, 'left'); return; }
  if (m.t === 'ready') { p.ready = true; return; }
  if (m.t === 'hello') {
    p.name = String(m.name || 'Player').slice(0, 16); p.look = m.look; p.hello = true;
    if (m.v !== VERSION) toast('Version mismatch: host ' + VERSION + ', player ' + m.v + '. Refresh both devices.', 5000);
    send(p.dc, { t: 'welcome', v: VERSION, id: p.id, role: p.role, started: MP.started, world: W.getSnapshot() });
    if (MP.started) send(p.dc, { t: 'start', world: W.getSnapshot() });
    toast(p.name + ' joined'); rebuildRemote(); openLobby();
  } else if (m.t === 'pos') { p.x = m.x; p.y = m.y; p.dir = m.dir; p.mv = m.mv; p.look = m.look || p.look; p.seat = m.seat; p.lock = m.lock; }
  else if (m.t === 'chat') { const text = String(m.text || '').slice(0, 140); chatIn(p.id, p.name, text); toAll({ t: 'chat', from: p.id, name: p.name, text }, p.id); }
  else if (m.t === 'states') { applyStates(m.s); toAll({ t: 'states', s: m.s }, p.id); }
  else if (m.t === 'world' && p.role === 'editor') { applyRemote(m.snap); toAll({ t: 'world', snap: m.snap }, p.id); }
}
function dropPeer(p, why) {
  if (!MP.peers.has(p.id)) return;
  MP.peers.delete(p.id); try { p.pc.close(); } catch (e) { /* ignore */ }
  if (p.hello) toast(p.name + ' ' + why); rebuildRemote();
}
export function setRole(id, role) { const p = MP.peers.get(id); if (!p) return; p.role = role; send(p.dc, { t: 'role', role }); }
export function kick(id) { const p = MP.peers.get(id); if (!p) return; send(p.dc, { t: 'kick' }); setTimeout(() => dropPeer(p, 'was kicked'), 150); }

// ---- guest: join --------------------------------------------------------------------
export function openJoin() {
  if (!window.RTCPeerConnection) { toast('This browser does not support multiplayer'); return; }
  let step = null, busy = false;
  const box = h('div', {});
  const go = async txt => {
    if (busy) return; busy = true;
    try {
      const offer = await unpack(txt); if (step) step.stop(); await wantCamera();
      const pc = newPc(); await pc.setRemoteDescription(offer);
      pc.ondatachannel = e => guestChannel(e.channel);
      pc.onconnectionstatechange = () => { if (['failed', 'closed', 'disconnected'].includes(pc.connectionState)) setTimeout(() => { if (isGuest() && pc.connectionState !== 'connected') { toast('Lost connection to the host', 3500); leave(true); } }, 4000); };
      await pc.setLocalDescription(await pc.createAnswer()); await gathered(pc);
      MP.pc = pc; const code = await pack(pc.localDescription);
      step = showStep(code); box.replaceChildren(step.el, h('p', { class: 'bh-text', style: 'text-align:center' }, 'Waiting for the host to scan...'));
    } catch (e) { busy = false; toast('That code did not work'); }
  };
  step = scanStep(go, "Scan the host's code"); box.replaceChildren(step.el);
  openModal({ title: 'Join a game', subtitle: 'Both devices on the same Wi-Fi or hotspot', body: box,
    onClose: () => { if (step) step.stop(); if (!MP.role && MP.pc) { try { MP.pc.close(); } catch (e) { /* ignore */ } MP.pc = null; } } });
}
function guestChannel(dc) {
  MP.role = 'guest'; MP.dc = dc; MP.started = false; MP.peers = new Map(); MP.seen = Date.now(); MP.starting = false; startBeat();
  dc.onmessage = receiver(guestGot);
  let said = false; const hi = () => { if (said) return; said = true; send(dc, { t: 'hello', v: VERSION, ...me() }); };
  dc.onopen = hi; if (dc.readyState === 'open') hi();
  dc.onclose = () => { if (MP.role === 'guest') { toast('Disconnected from the host', 3000); leave(true); } };
}
function guestGot(m) {
  MP.seen = Date.now();
  if (m.t === 'ping') return;
  if (m.t === 'welcome') {
    if (S.started) return;
    MP.myId = m.id; MP.myRole = m.role; MP.snap = m.world; W.useKey(null);
    if (m.v !== VERSION) toast('Version mismatch: host ' + m.v + ', you ' + VERSION + '. Refresh both devices.', 5000);
    if (m.started) enterGuest(m.world); else lobbyGuest();
  }
  else if (m.t === 'start') { enterGuest(m.world || MP.snap); send(MP.dc, { t: 'ready' }); }
  else if (m.t === 'players') { S.remote = m.list.filter(r => r.id !== MP.myId).map(r => { const old = S.remote.find(o => o.id === r.id); return { ...r, walk: old ? old.walk : 0, bubble: old && old.bubble }; }); }
  else if (m.t === 'npc') npcApply(m.d);
  else if (m.t === 'states') applyStates(m.s);
  else if (m.t === 'chat') chatIn(m.from, m.name, m.text);
  else if (m.t === 'world') { if (S.started) applyRemote(m.snap); else MP.snap = m.snap; }
  else if (m.t === 'role') { MP.myRole = m.role; toast('Your role is now ' + m.role, 3000); hooks.syncBar(); }
  else if (m.t === 'kick') { toast('You were removed by the host', 3500); leave(true); }
  else if (m.t === 'end') { toast('The host ended the session', 3500); leave(true); }
}
function enterGuest(snap) {
  if (S.started) return;
  try { MP.starting = true; closeModal(); hooks.startGuest(snap || MP.snap); S.npcGuest = true; startLoops(); W.listeners.push(onWorldChange); send(MP.dc, { t: 'ready' }); }
  catch (e) { console.error(e); MP.starting = false; toast('Could not enter the world: ' + e.message, 6000); }
}
function lobbyGuest() {
  if (S.started) return;
  openModal({ title: 'Connected', subtitle: 'Waiting for the host to start...', body: h('p', { class: 'bh-text' }, 'You joined as ' + (MP.myRole === 'editor' ? 'an editor' : 'a viewer') + '.'),
    locked: true, buttons: [{ label: 'Leave', kind: 'red', onClick: () => { MP.starting = true; closeModal(); leave(); } }],
    onClose: () => { if (isGuest() && !MP.starting && !S.started) leave(); } });
}

// ---- shared loops ---------------------------------------------------------------------------
function rebuildRemote() {
  if (!isHost()) return;
  S.remote = [...MP.peers.values()].filter(p => p.hello).map(p => ({ id: p.id, name: p.name, look: p.look, x: p.x, y: p.y, dir: p.dir, mv: p.mv, seat: p.seat, lock: p.lock, walk: (S.remote.find(o => o.id === p.id) || {}).walk || 0, bubble: (S.remote.find(o => o.id === p.id) || {}).bubble }));
}
function seatOf(P) { if (!P.seat) return null; try { return JSON.parse(JSON.stringify(P.seat)); } catch (e) { return null; } }
let npcTick = 0;
function startLoops() {
  clearInterval(posTimer);
  posTimer = setInterval(() => {
    const P = S.player, mine = { x: P.x, y: P.y, dir: P.dir, mv: !!P.moving, seat: seatOf(P), lock: P.lock ? { anim: P.lock.anim } : null };
    if (isHost()) {
      rebuildRemote();
      toAll({ t: 'players', list: [{ id: 'host', name: P.name, look: P.look, ...mine }, ...[...MP.peers.values()].filter(p => p.hello).map(p => ({ id: p.id, name: p.name, look: p.look, x: p.x, y: p.y, dir: p.dir, mv: p.mv, seat: p.seat, lock: p.lock }))] });
      if (++npcTick % 2 === 0) { const d = npcSnapshot(); if (Object.keys(d).length) toAll({ t: 'npc', d }); }
    } else if (isGuest()) send(MP.dc, { t: 'pos', ...mine, look: P.look });
  }, 100);
  S.onSay = text => {
    if (isHost()) toAll({ t: 'chat', from: 'host', name: S.player.name, text });
    else if (isGuest()) send(MP.dc, { t: 'chat', text });
  };
}
function chatIn(id, name, text) {
  const r = id === 'host' && isGuest() ? S.remote.find(o => o.id === 'host') : S.remote.find(o => o.id === id);
  if (r) r.bubble = { text, ttl: 6 };
  toast(name + ': ' + text, 3500); sound('chat');
}
export function tickRemote(dt) { for (const r of S.remote) { if (r.bubble) r.bubble.ttl -= dt; if (r.mv) r.walk = (r.walk || 0) + dt * 11; } }
function onWorldChange() {
  if (applying || !S.started) return;
  clearTimeout(worldTimer);
  if (isGuest() && MP.myRole !== 'editor') { worldTimer = setTimeout(() => { const st = statesOf(); if (JSON.stringify(st) !== lastStates) { lastStates = JSON.stringify(st); send(MP.dc, { t: 'states', s: st }); } }, 250); return; }
  worldTimer = setTimeout(() => {
    const snap = W.getSnapshot(); if (snap === lastSent) return; lastSent = snap;
    if (isHost()) toAll({ t: 'world', snap }); else send(MP.dc, { t: 'world', snap });
  }, 350);
}
let lastStates = '';
function statesOf() {
  const o = {}; for (const it of W.world.items) if (it.state) o['i' + it.id] = it.state;
  for (const e of W.world.edges) if (e.state) o[`e${e.o},${e.x},${e.y}`] = e.state;
  return o;
}
function applyStates(st) {
  applying = true;
  for (const it of W.world.items) { const v = st['i' + it.id]; if (v) it.state = v; }
  for (const e of W.world.edges) { const v = st[`e${e.o},${e.x},${e.y}`]; if (v) e.state = v; }
  W.touch(); applying = false;
}
function applyRemote(snap) {
  applying = true; lastSent = snap;
  try { W.applySnapshot(snap); S.selected = null; } catch (e) { console.error(e); }
  applying = false;
}

// ---- ending ---------------------------------------------------------------------------------
export function stop(silent) {   // host stops the session
  if (isHost()) toAll({ t: 'end' });
  setTimeout(() => { for (const p of [...MP.peers.values()]) { try { p.pc.close(); } catch (e) { /* ignore */ } } }, 200);
  cleanup(); if (!silent) toast('Multiplayer session stopped');
}
export function leave(fromHost) {
  if (!MP.role) return;
  if (isGuest() && MP.dc) { if (!fromHost) send(MP.dc, { t: 'bye' }); const d = MP.dc; setTimeout(() => { try { d.close(); } catch (e) { /* ignore */ } }, 150); }
  try { MP.pc && MP.pc.close(); } catch (e) { /* ignore */ }
  cleanup(); hooks.exitToMenu();
}
function cleanup() {
  clearInterval(beatTimer); clearInterval(posTimer); clearTimeout(worldTimer);
  const i = W.listeners.indexOf(onWorldChange); if (i >= 0) W.listeners.splice(i, 1);
  MP.role = null; MP.started = false; MP.peers = new Map(); MP.dc = null; MP.pc = null; MP.myRole = 'editor';
  S.remote = []; S.onSay = null; S.npcGuest = false; lastSent = '';
  if (hooks) hooks.syncBar();
}

// ---- host: permissions ------------------------------------------------------------------------------
export function openPermissions() {
  const body = h('div', { class: 'bh-stack' });
  const draw = () => {
    body.replaceChildren();
    const chips = (cur, set) => h('div', { class: 'bh-chips' }, ...['viewer', 'editor'].map(r => {
      const b = h('button', { class: 'bh-tab' + (cur === r ? ' on' : ''), type: 'button' }, r === 'viewer' ? 'Viewer' : 'Editor');
      b.addEventListener('click', () => { sound('click'); set(r); draw(); }); return b;
    }));
    body.append(h('div', { class: 'bh-label' }, 'Role for new players'), chips(MP.defaultRole, r => { MP.defaultRole = r; }),
      h('div', { class: 'bh-label' }, 'Players'));
    const ps = [...MP.peers.values()].filter(p => p.hello);
    if (!ps.length) body.append(h('p', { class: 'bh-text' }, 'Nobody has joined yet.'));
    for (const p of ps) body.append(h('div', { class: 'mp-row' }, h('b', {}, p.name), chips(p.role, r => setRole(p.id, r)),
      button('Kick', { kind: 'red', small: true, onClick: () => { kick(p.id); setTimeout(draw, 250); } })));
    body.append(button('Invite a player', { kind: 'blue', small: true, onClick: openInvite }));
  };
  draw();
  openModal({ title: 'Permissions', subtitle: 'Viewers can only walk around. Editors can build.', body,
    buttons: [{ label: 'Stop session', kind: 'red', onClick: () => { closeModal(); stop(); } }] });
}
