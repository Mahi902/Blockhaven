// Throw a punch.
const PUNCHES = [["Jab", "Quick and light", "Pap pap! Nice and snappy."], ["Hook", "Swing from the side", "WHAM! The bag swings."], ["Uppercut", "Straight up", "Pow! Feeling stronger already."], ["Combo", "Everything you have", "One-two-three-four... phew!"]];
export default api => {
  const { h, choice } = api.ui;
  const body = h("div", { class: "bh-list" }, PUNCHES.map(([t, sub, line]) => choice(t, sub, () => {
    api.closeModal(); api.sound("door"); api.after(160, () => api.sound("door")); api.say(line);
  })));
  api.modal({ title: "Punching Bag", subtitle: "Pick a move", body });
};
