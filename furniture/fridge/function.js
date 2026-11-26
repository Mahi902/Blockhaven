// Grab a snack. The fridge keeps real stock (saved with the room) and can be restocked.
const SNACKS = [["Cold soda", "a cold soda"], ["Pizza", "yesterday\u0027s pizza"], ["Yoghurt", "a suspicious yoghurt"], ["Apple", "an apple"], ["Noodles", "leftover noodles"], ["Cake", "a slice of cake"]];
const FULL = 6;
export default api => {
  const { h, choice } = api.ui;
  const left = typeof api.state.stock === "number" ? api.state.stock : FULL;
  const rows = left > 0
    ? SNACKS.map(([t, what]) => choice(t, left + " left in the fridge", () => {
        api.state.stock = left - 1; api.closeModal(); api.sound("snack");
        api.say("Mmm, " + what + "!" + (left - 1 === 0 ? " ...That was the last one." : ""));
      }))
    : [h("div", { class: "bh-label" }, "The fridge is empty. Just a light bulb and regret.")];
  if (left < FULL) rows.push(choice("Restock", "Fill it back up", () => {
    api.state.stock = FULL; api.closeModal(); api.sound("good"); api.say("Fridge restocked. Future me says thanks.");
  }));
  api.modal({ title: "Fridge", subtitle: left > 0 ? "Grab a snack" : "Nothing left", body: h("div", { class: "bh-list" }, rows) });
};
