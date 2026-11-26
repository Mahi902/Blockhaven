// Heat something up. The window glows while it runs.
const FOODS = [["Leftover pizza", "Crispy edge, lava middle", "Hot pizza. Mind the cheese."], ["Popcorn", "Listen for the pops", "Popped! Slightly burnt, as tradition demands."], ["Soup", "Stir halfway", "Steaming soup, ready to go."], ["Mug cake", "Two minutes of magic", "Warm mug cake. Dangerously good."]];
export default api => {
  const { h, choice } = api.ui;
  if (api.state.busy) { api.say("Still heating..."); return; }
  const body = h("div", { class: "bh-list" }, FOODS.map(([t, sub, line]) => choice(t, sub, () => {
    api.closeModal();
    api.state.busy = true;
    api.glow("#ffe9a0", 2);
    api.sound("switch");
    api.say("Heating " + t.toLowerCase() + "...");
    api.after(2400, () => { api.state.busy = false; api.glow(null); api.sound("good"); api.say(line); });
  })));
  api.modal({ title: "Microwave", subtitle: "What are we heating?", body });
};
