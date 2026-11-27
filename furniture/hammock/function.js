// Hammock: just get in. Left / right arrows (or A / D) sway you and the cloth; E, up or down gets you out.
// Works at any rotation (the sway follows the hammock's own axis).
export default api => {
  api.sway();
  api.say("Ahh... use \u25C0 \u25B6 to sway.");
};
export function leave(api) { api.say("That was lovely."); }
