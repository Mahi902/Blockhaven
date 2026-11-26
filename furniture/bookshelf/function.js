// Pick a book and read a tiny line from it.
const BOOKS = [
  ["The Quiet Garden", "Every room is a small world."],
  ["Cheese: A History", "It all started with a very patient cow."],
  ["How to Build a Home", "Start with the floor. Then argue about the sofa."],
  ["Night Owls", "The lamp was still on. It always was."],
  ["Tiny Blocks", "Big things are just small things, stacked."],
];
export default api => {
  const { h, choice } = api.ui;
  const body = h("div", { class: "bh-list" }, BOOKS.map(([t, line]) => choice(t, "Tap to read", () => { api.closeModal(); api.say(line); })));
  api.modal({ title: "Bookshelf", subtitle: "Pick a book", body });
};
