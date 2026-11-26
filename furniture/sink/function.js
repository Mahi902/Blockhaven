// Wash your hands: the basin fills with soap bubbles, you scrub, the water rinses blue, then it drains.
export default api => {
  if (api.locked || api.state._sink) return;
  api.state._sink = { start: Date.now() };
  api.lock({ ms: 9200, anim: "scrub" });
  api.sound("snack");
  api.say("Soap time!");
  api.after(1700, () => api.sound("switch"));
  api.after(5000, () => { api.sound("snack"); api.say("Rinse..."); });
  api.after(6700, () => api.sound("splash"));
  api.after(9000, () => { api.state._sink = null; api.sound("good"); api.say("Squeaky clean hands!"); });
};
