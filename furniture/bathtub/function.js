// Hop in and actually swim: W/A/S/D or the arrow keys paddle you up and down the tub (with splashes and bubbles).
// E, the button, or a click climbs back out.
export default api => {
  if (typeof api.swim === "function") api.swim(); else api.lie();   // lie() only if the game engine is an old cached copy
  api.say("Splash! Time for a swim.");
};
export function leave(api) { api.say("Squeaky clean!"); api.sound("door"); }
