// Start a wash cycle. The machine glows while it runs.
const CYCLES = [["Quick wash", "Short and sweet", 2200], ["Normal wash", "Every day clothes", 3600], ["Heavy wash", "Very dirty laundry", 5200]];
export default api => {
  const { h, choice } = api.ui;
  if (api.state.busy) { api.say("Still washing..."); return; }
  const body = h("div", { class: "bh-list" }, CYCLES.map(([t, sub, ms]) => choice(t, sub, () => {
    api.closeModal();
    api.state.busy = true;
    api.glow("#8cc8ff", 2);
    api.sound("switch");
    api.say(t + " started.");
    api.after(ms, () => { api.state.busy = false; api.glow(null); api.sound("good"); api.say("Laundry done! Fresh and fluffy."); });
  })));
  api.modal({ title: "Washing Machine", subtitle: "Pick a cycle", body });
};
