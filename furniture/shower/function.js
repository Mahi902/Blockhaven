// Take a shower for real: pick a water temperature (or sing), and you WALK INTO the stall. The water
// runs over you (animated, with steam on warm/hot), you lather up, rinse and step back out.
// E, a click or a move key at any time turns the water off and gets you out early.
const TEMPS = [
  { id: "cold", title: "Cold", sub: "Wakes you right up", glow: "#9fd8ff", start: "Brrr! Cold water. Instantly awake.", end: "Fresh as a daisy. A very cold daisy." },
  { id: "warm", title: "Warm", sub: "Just right", glow: "#bfe8ff", start: "Ahh, perfect temperature.", end: "Squeaky clean and cosy." },
  { id: "hot", title: "Hot", sub: "Steamy, like a sauna", glow: "#ffd9c0", start: "Piping hot. Hello, steam!", end: "Pink, steamy and very relaxed." },
  { id: "sing", title: "Sing in the shower", sub: "Warm water and a little concert", glow: "#bfe8ff", start: "La la laaa! The acoustics are amazing.", end: "Encore! ...Okay, maybe not." },
];
const TUNE = [67, 69, 71, 72, 71, 69, 67, 64, 67, 69, 67];   // a made-up little tune (MIDI notes)
const WALK_IN = 450, LATHER_AT = 3200, RINSE_AT = 6000, END_AT = 9000;

export default api => {
  const { h, choice } = api.ui;
  if (api.state._shower) return;
  const count = api.state.count || 0;
  const body = h("div", { class: "bh-list" }, TEMPS.map(t => choice(t.title,
    api.state.last === t.id ? t.sub + " (your usual)" : t.sub, () => start(api, t))));
  api.modal({ title: "Shower", subtitle: count ? "Showers taken: " + count : "Pick your water temperature", body });
};

function start(api, t) {
  api.closeModal();
  if (api.state._shower) return;
  api.stepIn({ scrub: false });                                   // walk into the stall
  const sid = Date.now();
  const sh = api.state._shower = { start: sid + WALK_IN, temp: t.id === "sing" ? "warm" : t.id, phase: "rinse", sid };
  api.state.last = t.id;
  const live = () => api.exists() && api.state._shower && api.state._shower.sid === sid;
  api.after(WALK_IN, () => { if (!live()) return; api.sound("switch"); api.glow(t.glow, 2, { temp: true }); api.after(200, () => { if (live()) { api.sound("splash"); api.say(t.start); } }); });
  api.after(LATHER_AT, () => { if (!live()) return; sh.phase = "lather"; api.scrub(true); api.sound("snack"); api.say("Shampoo time!"); });
  api.after(RINSE_AT, () => { if (!live()) return; sh.phase = "rinse"; api.scrub(false); api.sound("splash"); api.say("Rinse..."); });
  if (t.id === "sing" && api.soundOn) {
    TUNE.forEach((m, i) => api.after(WALK_IN + 700 + i * 560, () => { if (live()) api.note(m, 0.7, 0.5); }));
  }
  api.after(END_AT, () => {
    if (!live()) return;
    finish(api, t.end);
    api.stand();                                                  // step back out
  });
}

function finish(api, line) {
  api.state._shower = null;
  api.scrub(false);
  api.glow(null);
  api.sound("switch");
  if (line) { api.state.count = (api.state.count || 0) + 1; api.after(250, () => api.sound("good")); api.say(line); }
  api.save();
}

// Called when you get out early (E, click, or a move key).
export function leave(api) {
  if (api.state._shower) finish(api, null), api.say("Water off. Towel time!");
}
