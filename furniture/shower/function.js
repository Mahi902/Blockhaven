// Take a shower: pick a water temperature (or sing!), then you lather up, rinse and towel off.
// The stall glows and shows a badge while the water runs, and it keeps count of your showers.
const TEMPS = [
  { id: "cold", title: "Cold", sub: "Wakes you right up", glow: "#9fd8ff", badge: "\u{1F4A7}", start: "Brrr! Cold water. Instantly awake.", end: "Fresh as a daisy. A very cold daisy." },
  { id: "warm", title: "Warm", sub: "Just right", glow: "#bfe8ff", badge: "\u{1F6BF}", start: "Ahh, perfect temperature.", end: "Squeaky clean and cosy." },
  { id: "hot", title: "Hot", sub: "Steamy, like a sauna", glow: "#ffd9c0", badge: "\u2668\uFE0F", start: "Piping hot. Hello, steam!", end: "Pink, steamy and very relaxed." },
  { id: "sing", title: "Sing in the shower", sub: "Warm water and a little concert", glow: "#bfe8ff", badge: "\u{1F3A4}", start: "La la laaa! The acoustics are amazing.", end: "Encore! ...Okay, maybe not." },
];
const TUNE = [67, 69, 71, 72, 71, 69, 67, 64, 67, 69, 67];   // a made-up little tune (MIDI notes)
const DURATION = 8200;

export default api => {
  const { h, choice } = api.ui;
  if (api.locked || api.state._busy) { api.say("Already showering..."); return; }
  const count = api.state.count || 0;
  const body = h("div", { class: "bh-list" }, TEMPS.map(t => choice(t.title,
    api.state.last === t.id ? t.sub + " (your usual)" : t.sub, () => start(api, t))));
  api.modal({ title: "Shower", subtitle: count ? "Showers taken: " + count : "Pick your water temperature", body });
};

function start(api, t) {
  api.closeModal();
  if (api.locked || api.state._busy) return;
  api.state._busy = true;
  api.state.last = t.id;
  api.lock({ ms: DURATION, anim: "scrub" });
  api.glow(t.glow, 2, { temp: true });
  api.badge(t.badge, { temp: true });
  api.sound("switch");
  api.after(350, () => { api.sound("splash"); api.say(t.start); });
  api.after(3000, () => { if (api.exists()) { api.sound("snack"); api.say("Shampoo time!"); } });
  api.after(5400, () => { if (api.exists()) { api.sound("splash"); api.say("Rinse..."); } });
  if (t.id === "sing" && api.soundOn) {
    TUNE.forEach((m, i) => api.after(900 + i * 560, () => { if (api.exists()) api.note(m, 0.7, 0.5); }));
  }
  api.after(DURATION - 100, () => {
    api.state._busy = false;
    if (!api.exists()) return;
    api.state.count = (api.state.count || 0) + 1;
    api.glow(null); api.badge(null);
    api.sound("switch"); api.after(250, () => api.sound("good"));
    api.say(t.end);
    api.save();
  });
}
