// Toggle the lamp. Its glow lights up the room at night.
export default api => {
  const on = !api.state.on;
  api.state.on = on;
  api.glow(on ? "#ffd27a" : null, 3);
  api.sound("switch");
};
