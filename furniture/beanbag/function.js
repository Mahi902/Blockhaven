// A bean bag: plop down and sink in (it squashes under you), or fluff it up first. A freshly fluffed
// bean bag is extra comfy until you next sit on it. Sitting is left with E, a click or a move key.
const PLOP = ["Plooop. You sink right in.", "Oof... it swallowed you. Perfect.", "The bean bag sighs. So do you."];
const FLUFFED = ["Ahhh, perfectly fluffed. Extra comfy!", "Cloud level reached.", "It hugs back. Pure bliss."];

export default api => {
  if (api.inside) return;
  const { h, choice } = api.ui;
  const fluffed = !!api.state.fluffed;
  api.modal({
    title: "Bean Bag", subtitle: fluffed ? "Freshly fluffed" : "A bit flat...",
    body: h("div", { class: "bh-list" }, [
      choice("Plop down", fluffed ? "Sink into the fluffy bean bag" : "Sit and sink in", () => {
        api.closeModal();
        api.sit();
        api.state._plop = Date.now();
        api.sound("click");
        const line = fluffed ? FLUFFED : PLOP;
        api.say(line[Math.floor(Math.random() * line.length)]);
        api.state.fluffed = false;
      }),
      choice("Fluff it up", "Punch and shake the beans around", () => {
        api.closeModal();
        api.state._fluff = Date.now();
        api.state.fluffed = true;
        api.sound("click"); api.after(160, () => api.sound("click")); api.after(340, () => api.sound("click"));
        api.say("Fluff fluff fluff! Nice and plump.");
      }),
    ]),
  });
};

export function leave(api) { api.say("Getting up takes real effort..."); }
