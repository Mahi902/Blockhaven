// A grandfather clock that shows your real local time (live, to the second) and strikes it with the
// Westminster chimes (the traditional 1793 Cambridge chime tune, public domain): four phrases, then one low
// bong per hour. You can also play just a quarter-hour chime.
const T = { B3: 59, E4: 64, Fs4: 66, Gs4: 68, E3: 52 };
const PHRASES = [
  [T.Gs4, T.Fs4, T.E4, T.B3],
  [T.E4, T.Gs4, T.Fs4, T.B3],
  [T.Gs4, T.E4, T.Fs4, T.B3],
  [T.B3, T.Fs4, T.Gs4, T.E4],
];
const NOTE_GAP = 560;   // ms between chime notes
const BONG_GAP = 1300;  // ms between hour strikes

export default api => {
  const { h, choice } = api.ui;
  const timeEl = h("div", { style: { fontSize: "34px", fontWeight: "800", textAlign: "center", letterSpacing: "1px", margin: "2px 0" } }, "");
  const dateEl = h("div", { class: "bh-label", style: { textAlign: "center", marginBottom: "10px" } }, "");
  let timer = 0, playing = 0;

  const tick = () => {
    const d = new Date();
    timeEl.textContent = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" });
    dateEl.textContent = d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
  };
  tick();
  timer = setInterval(tick, 1000);

  const chime = (phrases, strikes) => {
    if (playing) { api.say("Patience... the clock is still chiming."); return; }
    if (!api.soundOn) { api.ui.toast("Sound is off - tap the speaker button to turn it on."); }
    api.closeModal();
    playing = 1;
    api.glow("#ffd27a", 2, { temp: true });
    api.badge("\u{1F514}", { temp: true });
    let t = 200;
    phrases.forEach(p => p.forEach(m => { api.after(t, () => { if (api.exists()) api.note(m, 1.6, 0.6); }); t += NOTE_GAP; }));
    t += 500;
    for (let i = 0; i < strikes; i++) { api.after(t, () => { if (api.exists()) api.note(T.E3, 2.4, 0.8); }); t += BONG_GAP; }
    api.after(t, () => { playing = 0; if (api.exists()) { api.glow(null); api.badge(null); } });
    api.say(strikes ? "Bong! It is " + (new Date().getHours() % 12 || 12) + " o'clock." : "\u266a A quarter-hour chime.");
  };

  api.modal({
    title: "Grandfather Clock", subtitle: "Always (almost) on time",
    body: h("div", {}, timeEl, dateEl, h("div", { class: "bh-list" }, [
      choice("Strike the hour", "Westminster chimes, then the hour bongs", () => chime(PHRASES, new Date().getHours() % 12 || 12)),
      choice("Quarter-hour chime", "Just the first phrase", () => chime([PHRASES[0]], 0)),
    ])),
    onClose: () => clearInterval(timer),
  });
};
