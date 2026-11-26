// Turn the tap on or off. Running water glows; it shuts itself off after a while.
export default api => {
  const running = !api.state.running;
  api.state.running = running;
  api.glow(running ? "#9fd8ff" : null, 1.5);
  api.sound("snack");
  api.say(running ? "Splash! Squeaky clean." : "Tap off.");
  if (running) api.after(8000, () => {
    if (api.state.running) { api.state.running = false; api.glow(null); api.save(); }
  });
};
