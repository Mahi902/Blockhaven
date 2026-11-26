// Cook a meal. The burners glow while you cook.
const MEALS = [
  ["Fried eggs", "Quick and easy", "Sunny side up!"],
  ["Pasta", "With too much cheese", "Al dente. Mostly."],
  ["Pancakes", "A tall stack", "Flip! ...Nailed it."],
  ["Soup", "Warm and comforting", "Smells like home."],
  ["Toast", "Slightly burnt", "Perfectly burnt, just how I like it."],
];
export default api => {
  const { h, choice } = api.ui;
  const body = h("div", { class: "bh-list" }, MEALS.map(([t, sub, line]) => choice(t, sub, () => {
    api.closeModal();
    api.glow("#ff8a3c", 2);
    api.sound("snack");
    api.say("Cooking " + t.toLowerCase() + "...");
    api.after(2600, () => { api.glow(null); api.say(line); });
  })));
  api.modal({ title: "Stove", subtitle: "What are we cooking?", body });
};
