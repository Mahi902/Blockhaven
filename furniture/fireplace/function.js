// Light or put out the fire. It glows warmly while burning.
export default api => {
  const on = !api.state.on;
  api.state.on = on;
  api.glow(on ? "#ff9a3c" : null, 4);
  api.sound("switch");
  api.say(on ? "Cosy. The fire crackles." : "The fire dies down.");
};
