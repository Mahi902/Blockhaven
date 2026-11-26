// A playable piano: two octaves (C4-B5) of real notes. Click / tap the keys, or use the computer keys:
//   lower octave  white z x c v b n m   black s d g h j
//   upper octave  white q w e r t y u   black 2 3 5 6 7
// Four public-domain songs can play themselves while the keys light up.
const NAMES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const N = s => { const m = /^([A-G])(#?)(\d)$/.exec(s); return 12 * (+m[3] + 1) + NAMES[m[1]] + (m[2] ? 1 : 0); };
const song = str => str.trim().split(/\s+/).map(tok => { const [n, d] = tok.split(":"); return [N(n), d ? +d : 1]; });
const SONGS = [
  ["Ode to Joy", song("E5 E5 F5 G5 G5 F5 E5 D5 C5 C5 D5 E5 E5:1.5 D5:.5 D5:2 E5 E5 F5 G5 G5 F5 E5 D5 C5 C5 D5 E5 D5:1.5 C5:.5 C5:2 D5 D5 E5 C5 D5 E5:.5 F5:.5 E5 C5 D5 E5:.5 F5:.5 E5 D5 C5 D5 G4:2 E5 E5 F5 G5 G5 F5 E5 D5 C5 C5 D5 E5 D5:1.5 C5:.5 C5:2")],
  ["Twinkle Twinkle", song("C5 C5 G5 G5 A5 A5 G5:2 F5 F5 E5 E5 D5 D5 C5:2 G5 G5 F5 F5 E5 E5 D5:2 G5 G5 F5 F5 E5 E5 D5:2 C5 C5 G5 G5 A5 A5 G5:2 F5 F5 E5 E5 D5 D5 C5:2")],
  ["F\u00fcr Elise", song("E5:.5 D#5:.5 E5:.5 D#5:.5 E5:.5 B4:.5 D5:.5 C5:.5 A4:1.5 C4:.5 E4:.5 A4:.5 B4:1.5 E4:.5 G#4:.5 B4:.5 C5:1.5 E4:.5 E5:.5 D#5:.5 E5:.5 D#5:.5 E5:.5 B4:.5 D5:.5 C5:.5 A4:1.5 C4:.5 E4:.5 A4:.5 B4:1.5 E4:.5 C5:.5 B4:.5 A4:2")],
  ["Jingle Bells", song("E5 E5 E5:2 E5 E5 E5:2 E5 G5 C5:1.5 D5:.5 E5:4 F5 F5 F5:1.5 F5:.5 F5 E5 E5 E5:.5 E5:.5 E5 D5 D5 E5 D5:2 G5:2")],
];
const BEAT = 0.42;
const LOWER_W = "zxcvbnm", LOWER_B = { s: 1, d: 3, g: 6, h: 8, j: 10 };
const UPPER_W = "qwertyu", UPPER_B = { 2: 1, 3: 3, 5: 6, 6: 8, 7: 10 };
const WHITE_SEMI = [0, 2, 4, 5, 7, 9, 11];
const BLACK_AFTER = [[0, 1], [1, 3], [3, 6], [4, 8], [5, 10]];   // [white index it sits after, semitone]

export default api => {
  const { h, button } = api.ui;
  const keyEls = new Map(), keyMap = {};
  let token = 0, count = 0, closed = false;

  const flash = (midi, black) => {
    const el = keyEls.get(midi); if (!el) return;
    el.style.background = "#ffd27a";
    setTimeout(() => { el.style.background = black ? "#222" : "#fff"; }, 160);
  };
  const press = (midi, dur) => { api.note(midi, dur || 1.6); flash(midi, [1, 3, 6, 8, 10].includes((midi - 60) % 12)); count++; };

  const WPCT = 100 / 14, BPCT = 6;
  const keys = [];
  for (let o = 0; o < 2; o++) {
    WHITE_SEMI.forEach((semi, w) => {
      const midi = 60 + o * 12 + semi, letter = (o ? UPPER_W : LOWER_W)[w];
      keyMap[letter] = midi;
      const el = h("div", { style: { position: "absolute", left: (o * 7 + w) * WPCT + "%", width: WPCT + "%", top: "0", height: "100%", background: "#fff", border: "1px solid #7a7f87", borderRadius: "0 0 6px 6px", boxSizing: "border-box", cursor: "pointer", display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: "6px", fontSize: "11px", color: "#7a7f87", userSelect: "none", touchAction: "none" },
        onPointerDown: e => { e.preventDefault(); press(midi); } }, letter.toUpperCase());
      keyEls.set(midi, el); keys.push(el);
    });
  }
  for (let o = 0; o < 2; o++) {
    BLACK_AFTER.forEach(([w, semi]) => {
      const midi = 60 + o * 12 + semi, table = o ? UPPER_B : LOWER_B;
      const letter = Object.keys(table).find(k => table[k] === semi);
      keyMap[letter] = midi;
      const el = h("div", { style: { position: "absolute", left: ((o * 7 + w + 1) * WPCT - BPCT / 2) + "%", width: BPCT + "%", top: "0", height: "60%", background: "#222", border: "1px solid #000", borderRadius: "0 0 4px 4px", boxSizing: "border-box", cursor: "pointer", zIndex: "2", display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: "4px", fontSize: "10px", color: "#aaa", userSelect: "none", touchAction: "none" },
        onPointerDown: e => { e.preventDefault(); e.stopPropagation(); press(midi); } }, letter);
      keyEls.set(midi, el); keys.push(el);
    });
  }

  const onKey = e => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    const midi = keyMap[String(e.key).toLowerCase()];
    if (midi) { e.preventDefault(); press(midi); }
  };
  document.addEventListener("keydown", onKey);

  const playSong = notes => {
    const id = ++token; let i = 0;
    const next = () => {
      if (id !== token || closed || i >= notes.length) return;
      const [m, b] = notes[i++];
      press(m, Math.max(0.5, b * BEAT * 1.6));
      setTimeout(next, b * BEAT * 1000);
    };
    next();
  };

  const keyboard = h("div", { style: { position: "relative", width: "100%", height: "150px", margin: "4px 0 10px" } }, keys);
  const songRow = h("div", { style: { display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" } },
    h("span", { class: "bh-label" }, "Play a song:"),
    ...SONGS.map(([name, notes]) => button(name, { kind: "blue", small: true, onClick: () => { api.say("\u266a " + name); playSong(notes); } })),
    button("Stop", { kind: "red", small: true, onClick: () => { token++; } }));

  if (!api.soundOn) api.ui.toast("Sound is off - tap the speaker button to turn it on.");
  api.glow("#ffd27a", 1.5, { temp: true });
  api.badge("\u{1F3B9}", { temp: true });
  const total = api.state.notes || 0;
  api.modal({
    title: "Piano", subtitle: total ? "Notes played so far: " + total : "Click the keys, or use your keyboard",
    body: h("div", {}, keyboard, songRow), wide: true,
    onClose: () => {
      closed = true; token++;
      document.removeEventListener("keydown", onKey);
      if (count) api.state.notes = (api.state.notes || 0) + count;
      api.glow(null); api.badge(null); api.save();
    },
  });
};
