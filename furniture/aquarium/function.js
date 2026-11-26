// Feed the fish or toggle the tank light.
const LINES = ["The fish swarm up to eat.", "Bloop bloop. They look happy.", "One fish ate everything. Typical."];
export default api => {
  const { h, choice } = api.ui;
  const lit = !!api.state.lit;
  const body = h("div", { class: "bh-list" }, [
    choice("Feed the fish", "A pinch of flakes", () => {
      api.closeModal(); api.sound("snack"); api.say(LINES[Math.floor(Math.random() * LINES.length)]);
    }),
    choice(lit ? "Tank light off" : "Tank light on", "A soft blue glow", () => {
      api.state.lit = !lit; api.glow(lit ? null : "#6fd3ff", 3); api.sound("switch"); api.closeModal();
    }),
  ]);
  api.modal({ title: "Aquarium", subtitle: "Three happy fish", body });
};
