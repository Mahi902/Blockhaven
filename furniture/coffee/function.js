// Brew a coffee. The machine glows while it brews.
const DRINKS = [["Espresso", "Short and strong", "Wide awake now."], ["Latte", "Milky and smooth", "Perfect with a little foam art."], ["Mocha", "Chocolate coffee", "Dessert disguised as coffee."], ["Hot chocolate", "No coffee at all", "Warm and cosy."]];
export default api => {
  const { h, choice } = api.ui;
  if (api.state.busy) { api.say("Still brewing..."); return; }
  const body = h("div", { class: "bh-list" }, DRINKS.map(([t, sub, line]) => choice(t, sub, () => {
    api.closeModal();
    api.state.busy = true;
    api.glow("#ff9a3c", 2);
    api.sound("switch");
    api.say("Brewing " + t.toLowerCase() + "...");
    api.after(2400, () => { api.state.busy = false; api.glow(null); api.sound("snack"); api.say(line); });
  })));
  api.modal({ title: "Coffee Machine", subtitle: "What would you like?", body });
};
