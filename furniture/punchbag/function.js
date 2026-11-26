// Throw a punch. The bag flashes on impact and keeps your running total.
const PUNCHES = [["Jab", "Quick and light", "Pap pap! Nice and snappy.", 2], ["Hook", "Swing from the side", "WHAM! The bag swings.", 1], ["Uppercut", "Straight up", "Pow! Feeling stronger already.", 1], ["Combo", "Everything you have", "One-two-three-four... phew!", 4]];
export default api => {
  const { h, choice } = api.ui;
  const total = api.state.punches || 0;
  const body = h("div", { class: "bh-list" }, PUNCHES.map(([t, sub, line, hits]) => choice(t, sub, () => {
    api.closeModal();
    api.state.punches = total + hits;
    for (let i = 0; i < hits; i++) api.after(i * 160, () => api.sound("door"));
    api.glow("#ff8a8a", 2);
    api.say(line);
    api.after(hits * 160 + 250, () => { api.glow(null); api.save(); });
  })));
  api.modal({ title: "Punching Bag", subtitle: total ? "Punches thrown: " + total : "Pick a move", body });
};
