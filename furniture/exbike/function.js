// An exercise bike: sit on it, pick a ride program and pedal. The flywheel, pedals and console animate
// while you ride; the program sets the speed (Interval alternates hard and easy). Press E (or move) to
// hop off: the distance is added to the bike's saved total.
const PROGRAMS = [
  ["Easy ride", "Relaxed spin", "easy", 0.012, "Smooth and steady."],
  ["Hill climb", "Heavy resistance", "hill", 0.008, "Legs burning... keep climbing!"],
  ["Interval", "Hard and easy bursts", "interval", 0.016, "Push! Recover! Push!"],
];
const sessions = new Map();   // item id -> { t0, kmps } (kept out of the saved room on purpose)
export default api => {
  if (api.inside) return;
  const { h, choice } = api.ui;
  const id = api.item.id, km = api.state.km || 0;
  const body = h("div", { class: "bh-list" }, PROGRAMS.map(([t, sub, mode, kmps, line]) => choice(t, sub, () => {
    api.closeModal();
    api.sit();
    api.state._ride = { start: Date.now(), mode };
    sessions.set(id, { t0: Date.now(), kmps });
    api.sound("switch");
    api.say(t + " started. " + line + " (E to stop)");
  })));
  api.modal({ title: "Exercise Bike", subtitle: km ? "Distance so far: " + km + " km" : "Pick a ride program", body });
};
export function leave(api) {
  api.state._ride = null;
  const s = sessions.get(api.item.id);
  if (!s) return;
  sessions.delete(api.item.id);
  const gained = Math.round(((Date.now() - s.t0) / 1000) * s.kmps * 100) / 100;
  api.state.km = Math.round(((api.state.km || 0) + gained) * 100) / 100;
  api.sound("good");
  api.say(gained > 0 ? "Nice ride! +" + gained + " km (" + api.state.km + " km total)" : "Barely turned the pedals.");
}
