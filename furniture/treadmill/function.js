// Step onto the treadmill and run in place at the pace you pick. Press E (or move) to step off:
// the distance you covered is added to the treadmill's running total.
const PACES = [
  ["Walk", "Easy pace", 0.7, 0.03, "Just a casual stroll."],
  ["Jog", "Steady", 1.2, 0.06, "Huff... puff... feeling good."],
  ["Sprint", "Full speed", 1.9, 0.1, "Faster! Faster!"],
];
const sessions = new Map();   // item id -> { t0, kmps } (kept out of the saved room on purpose)
export default api => {
  const { h, choice } = api.ui;
  const id = api.item.id, km = api.state.km || 0;
  const body = h("div", { class: "bh-list" }, PACES.map(([t, sub, rate, kmps, line]) => choice(t, sub, () => {
    api.closeModal();
    api.run(rate, { x: 9, y: 0 });          // stand on the belt, facing the console
    sessions.set(id, { t0: Date.now(), kmps });
    api.sound("switch");
    api.say(t + " started. " + line + " (E to stop)");
  })));
  api.modal({ title: "Treadmill", subtitle: km ? "Distance so far: " + km + " km" : "Pick a pace", body });
};
// Called when the player steps off (E, a move key, or clicking away).
export function leave(api) {
  const s = sessions.get(api.item.id);
  if (!s) return;
  sessions.delete(api.item.id);
  const gained = Math.round(((Date.now() - s.t0) / 1000) * s.kmps * 100) / 100;
  api.state.km = Math.round(((api.state.km || 0) + gained) * 100) / 100;
  api.sound("good");
  api.say(gained > 0 ? "Phew! +" + gained + " km (" + api.state.km + " km total)" : "Barely a warm-up.");
}
