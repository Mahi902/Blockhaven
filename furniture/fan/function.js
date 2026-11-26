// A standing fan: off / low / medium / high. While it runs the blades spin, wind streaks blow out of its
// front and it SHOVES you away at your own walking speed if you stand in its path (rotate it in build mode
// to aim it). Higher speeds blow further (2 / 3 / 4 tiles). The setting is saved with the room.
const SPEEDS = [
  { id: 0, title: "Off", sub: "Silence", line: "The fan winds down." },
  { id: 1, title: "Low", sub: "A gentle breeze, reaches 2 tiles", line: "A gentle breeze. Lovely." },
  { id: 2, title: "Medium", sub: "Properly refreshing, reaches 3 tiles", line: "Nice and breezy." },
  { id: 3, title: "High", sub: "Hold on to your hair, reaches 4 tiles", line: "WHOOOOSH! Hold on to your hat!" },
];

export default api => {
  const { h, choice } = api.ui;
  const now = api.state.speed || 0;
  const rows = SPEEDS.map(s => choice(s.title, now === s.id ? "Current setting" : s.sub, () => {
    api.state.speed = s.id;
    api.sound(s.id ? "switch" : "click");
    api.closeModal();
    api.say(s.line);
  }));
  api.modal({ title: "Standing Fan", subtitle: now ? "Running on " + SPEEDS[now].title.toLowerCase() : "The fan is off", body: h("div", { class: "bh-list" }, rows) });
};
