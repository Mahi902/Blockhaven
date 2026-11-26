// Toggle the desk lamp. Its glow lights up the room at night.
export default api => {
  const on = !api.state.on;
  api.state.on = on;
  api.glow(on ? "#fff1b0" : null, 2);
  api.sound("switch");
};
