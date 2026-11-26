// Use the computer. The screen glows while it is on.
const ACTIONS = [
  ["Play a game", "Just one round", "One more round... okay, ten more."],
  ["Browse the web", "Mostly cats", "Forty tabs open. Nothing read."],
  ["Write something", "A great novel, probably", "Chapter one: it was a dark and cosy night."],
  ["Check email", "Probably spam", "Three newsletters and a coupon."],
];
export default api => {
  const { h, choice } = api.ui;
  const on = !!api.state.on;
  const body = h("div", { class: "bh-list" }, [
    choice(on ? "Turn screen off" : "Turn screen on", "Power", () => {
      api.state.on = !on; api.glow(on ? null : "#8cc8ff", 2); api.sound("switch"); api.closeModal();
    }),
    ...ACTIONS.map(([t, sub, line]) => choice(t, sub, () => {
      api.state.on = true; api.glow("#8cc8ff", 2); api.closeModal(); api.say(line);
    })),
  ]);
  api.modal({ title: "Computer", subtitle: on ? "The screen is on" : "The screen is off", body });
};
