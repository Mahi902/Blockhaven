// Pick a book and read a tiny line from it. The shelf remembers which ones you have read.
const BOOKS = [
  ["The Quiet Garden", "Every room is a small world."],
  ["Cheese: A History", "It all started with a very patient cow."],
  ["How to Build a Home", "Start with the floor. Then argue about the sofa."],
  ["Night Owls", "The lamp was still on. It always was."],
  ["Tiny Blocks", "Big things are just small things, stacked."],
];
export default api => {
  const { h, choice } = api.ui;
  const read = Array.isArray(api.state.read) ? api.state.read : [];
  const body = h("div", { class: "bh-list" }, BOOKS.map(([t, line]) => choice(t, read.includes(t) ? "Read" : "Tap to read", () => {
    if (!read.includes(t)) api.state.read = [...read, t];
    api.closeModal(); api.sound("click");
    const done = (api.state.read || []).length === BOOKS.length && !read.includes(t) && read.length === BOOKS.length - 1;
    api.say(done ? line + " (That was the whole shelf!)" : line);
  })));
  api.modal({ title: "Bookshelf", subtitle: read.length + " of " + BOOKS.length + " read", body });
};
