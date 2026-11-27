// Space heater: off / low / high. The bars glow brighter on high (see fx.js) and it casts a warm glow.
const LEVELS = [
  ["Off", "Cool down", 0, null, "The heater clicks off."],
  ["Low", "Gentle warmth", 1, 2, "Pleasantly warm."],
  ["High", "Toasty", 2, 3, "Whoa, toasty!"],
];
export default api => {
  const { h, choice } = api.ui;
  const now = api.state.lvl || 0;
  const rows = LEVELS.map(([t, sub, lvl, r, line]) => choice(t, now === lvl ? "Current setting" : sub, () => {
    api.state.lvl = lvl;
    if (r) api.glow(lvl === 2 ? "#ff7a2e" : "#ffae5a", r); else api.glow(null);
    api.sound(lvl ? "switch" : "click");
    api.closeModal();
    api.say(line);
  }));
  api.modal({ title: "Space Heater", subtitle: now ? "Running on " + LEVELS[now][0].toLowerCase() : "Switched off", body: h("div", { class: "bh-list" }, rows) });
};
