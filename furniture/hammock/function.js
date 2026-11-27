// Hammock: climb in and lie down. Left / right arrows (or A / D) sway you and the hammock together;
// up / down or E climbs out. Works at any rotation (it sways around its own centre).
const MODES = [
  ["Lie back", "Sway with the arrow keys", "Ahh... use \u25C0 \u25B6 to sway. E to climb out.", 0],
  ["Take a nap", "Zzz for a little while", "Zzz...", 1],
];
export default api => {
  const { h, choice } = api.ui;
  const body = h("div", { class: "bh-list" }, MODES.map(([t, sub, line, nap]) => choice(t, sub, () => {
    api.closeModal();
    api.sway();
    api.sound("sit");
    api.say(line);
    if (nap) api.badge("Zzz", { ms: 6000, temp: true, seat: true });
  })));
  api.modal({ title: "Hammock", subtitle: "Make yourself comfortable", body });
};
export function leave(api) { api.badge(null); api.say("That was lovely."); }
