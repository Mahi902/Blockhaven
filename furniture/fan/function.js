// A standing fan with an off switch and three speeds. The speed is saved with the room, so a fan you
// left running is still running when you come back. A badge above it shows its speed.
const SPEEDS = [
  { id: 0, title: "Off", sub: "Silence", badge: null, line: "The fan winds down." },
  { id: 1, title: "Low", sub: "A gentle breeze", badge: "\u{1F343}", line: "A gentle breeze. Lovely." },
  { id: 2, title: "Medium", sub: "Properly refreshing", badge: "\u{1F32C}\uFE0F", line: "Nice and breezy." },
  { id: 3, title: "High", sub: "Hold on to your hair", badge: "\u{1F300}", line: "WHOOOOSH! Hold on to your hat!" },
];

function show(api) {
  const { h, choice } = api.ui;
  const now = api.state.speed || 0;
  const rows = SPEEDS.map(s => choice(s.title, now === s.id ? "Current setting" : s.sub, () => {
    api.state.speed = s.id;
    api.badge(s.badge);
    api.sound(s.id ? "switch" : "click");
    api.closeModal();
    api.say(s.line);
  }));
  api.modal({ title: "Standing Fan", subtitle: now ? "Running on " + SPEEDS[now].title.toLowerCase() : "The fan is off", body: h("div", { class: "bh-list" }, rows) });
}

export default api => show(api);
