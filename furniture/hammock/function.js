// Hammock: climb in and lie down. It sways gently while you are in it (see fx.js). E / a move key climbs out.
const MODES = [
  ["Lie back", "Just swaying, watching the ceiling", "Ahh... gentle swaying.", 0],
  ["Take a nap", "Zzz for a little while", "Zzz...", 1],
];
export default api => {
  const { h, choice } = api.ui;
  const body = h("div", { class: "bh-list" }, MODES.map(([t, sub, line, nap]) => choice(t, sub, () => {
    api.closeModal();
    api.lie();
    api.sound("sit");
    api.say(line);
    if (nap) api.badge("Zzz", { ms: 6000, temp: true, seat: true });
  })));
  api.modal({ title: "Hammock", subtitle: "Make yourself comfortable", body });
};
export function leave(api) { api.badge(null); api.say("That was lovely."); }
