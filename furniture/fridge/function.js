// Grab a snack.
const SNACKS = ["a cold soda", "yesterday\u0027s pizza", "a suspicious yoghurt", "an apple", "leftover noodles", "a slice of cake"];
export default api => {
  api.sound("snack");
  api.say("Mmm, " + SNACKS[Math.floor(Math.random() * SNACKS.length)] + "!");
};
