// A real little library: pick a book, then read it page by page.
// Turn pages with the buttons, the arrow keys, or A / D. The shelf remembers which books you finished.
const BOOKS = [
  { t: "Aesop's Fables", a: "retold", c: "#c0392b", pages: [
    "THE TORTOISE AND THE HARE\n\nA hare laughed at a tortoise for being so slow. \"Race me,\" said the tortoise. The hare darted far ahead, grew bored, and lay down for a nap beneath a tree.\n\nThe tortoise just kept walking.",
    "When the hare woke up, the tortoise was already stepping over the finish line.\n\nSlow and steady wins the race.",
    "THE FOX AND THE GRAPES\n\nA hungry fox saw a bunch of ripe grapes hanging from a high vine. He jumped. He jumped again. He jumped until he was out of breath, but the grapes stayed out of reach.\n\n\"They were probably sour anyway,\" he sniffed, and walked away.",
    "It is easy to scorn what we cannot have.",
    "THE LION AND THE MOUSE\n\nA lion caught a tiny mouse and was about to eat her. \"Spare me,\" she squeaked, \"and someday I will repay you.\" The lion laughed, but he let her go.",
    "Days later the lion was caught in a hunter's net. The mouse heard his roars, ran to him, and gnawed through the ropes until he was free.\n\nNo kindness is ever wasted, and no friend is too small.",
    "THE BOY WHO CRIED WOLF\n\nA shepherd boy was bored, so he shouted, \"Wolf! Wolf!\" The villagers came running, and he laughed at them. He did it again the next day.\n\nThen a real wolf came. He shouted and shouted, but nobody believed him.",
    "Nobody trusts a liar, even when he finally tells the truth.\n\n- THE END -",
  ] },
  { t: "The Quiet Garden", a: "a short story", c: "#2f8f5b", pages: [
    "CHAPTER ONE\n\nBehind the old house on Pebble Lane there was a wall, and behind the wall there was a garden nobody had visited in years.\n\nMara found the key by accident, rusted and shaped like a leaf, inside a teapot at the back of a cupboard.",
    "The gate groaned open. Inside, everything was green and tangled. Roses climbed the wall. Mint had escaped from its bed and was colonising the path. A lone apple tree stood in the middle like it was waiting for someone.",
    "CHAPTER TWO\n\nMara came back the next morning with gloves, scissors, and a flask of tea. She cleared the path first. \"A garden should let you walk through it,\" her grandmother used to say.",
    "By the end of the week there was a bench. By the end of the month there were tomatoes, a row of beans, and a robin who sat on the spade handle every time she put it down.",
    "CHAPTER THREE\n\nOne evening Mara sat on the bench and noticed how quiet it was. Not silent: bees, wind in the leaves, the robin muttering. A quiet made of small, kind sounds.",
    "She understood then that she had not found the garden by accident, and that it had not really been abandoned. It had only been waiting.\n\nShe left the gate open that night.\n\n- THE END -",
  ] },
  { t: "Cheese: A History", a: "mostly true", c: "#e6a817", pages: [
    "CHAPTER 1: THE PATIENT COW\n\nIt all started with a very patient cow, and a person who forgot their milk in a pouch made from a sheep's stomach.\n\nIt was a bad idea. It was also the best bad idea in history.",
    "CHAPTER 2: THE CAVE\n\nPeople soon learned that if you leave cheese in a cool cave for months, it gets stronger, crumblier and smellier, and somehow people like it more.\n\nNobody has ever explained this satisfactorily.",
    "CHAPTER 3: THE HOLES\n\nSome cheeses have holes. These are made by tiny bubbles of gas from friendly bacteria. Cheese-makers call them \"eyes\". The more eyes, the more the cheese watches you from the fridge.",
    "CHAPTER 4: THE LESSON\n\nCheese teaches us that good things take time, that a little rot can be delicious, and that everything is better melted.\n\n- THE END -",
  ] },
  { t: "How to Build a Home", a: "a practical guide", c: "#3b6fd1", pages: [
    "STEP ONE: THE FLOOR\n\nStart with the floor. Nothing else matters until you have somewhere to stand. Choose a colour you can live with. Remember: you will drop things on it.",
    "STEP TWO: THE WALLS\n\nWalls keep the inside in and the outside out. Leave a gap for a door. A house without a door is not a home, it is a very sturdy hat.",
    "STEP THREE: THE SOFA\n\nPlace the sofa. Move the sofa. Move it back. Argue about the sofa. This is the longest step and it is the most important one.",
    "STEP FOUR: THE LAMP\n\nAdd a lamp. A home needs a small light that says someone lives here, and they are doing fine.",
    "STEP FIVE: LIVE IN IT\n\nA home is never finished. Add a plant. Add a chair. Add a cat if one arrives. Home is built by living in it.\n\n- THE END -",
  ] },
  { t: "Night Owls", a: "a short story", c: "#6a4bb3", pages: [
    "The lamp was still on. It always was.\n\nIn the flat at the top of the stairs, Jonah and his cat Biscuit had a deal: Jonah would stay up too late and Biscuit would pretend not to judge.",
    "At 2 a.m. the city went quiet. A bus sighed past. Somewhere, a neighbour was practising the same four notes on a piano, getting them a little wrong, a little better each night.",
    "Jonah realised he knew this stranger's music better than he knew the stranger. He opened the window. Four notes drifted in, and this time, all four were right.",
    "He found himself smiling in the dark. Biscuit blinked slowly, which is cat for \"fine, you may stay up\".\n\nThe lamp was still on. It always would be.\n\n- THE END -",
  ] },
  { t: "Tiny Blocks", a: "an essay", c: "#d1568b", pages: [
    "Big things are just small things, stacked.\n\nA wall is a thousand bricks. A song is a handful of notes. A town is a lot of small rooms with the lights on.",
    "Nobody builds a castle in a day. They place one block, then another, and then they step back and look.",
    "If a block is wrong, move it. If the whole room is wrong, that is fine too: blocks are made to be rearranged.",
    "So start with one tiny block. Right here. Right now.\n\n- THE END -",
  ] },
];

export default api => {
  const { h, button } = api.ui;
  const done = () => (Array.isArray(api.state.read) ? api.state.read : []);
  let keyfn = null;
  const off = () => { if (keyfn) { document.removeEventListener("keydown", keyfn, true); keyfn = null; } };

  const shelf = () => {
    off();
    const read = done();
    const rows = BOOKS.map(b => {
      const isRead = read.includes(b.t);
      const spine = h("button", { type: "button", style: {
        display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", textAlign: "left", cursor: "pointer",
        padding: "10px 12px", margin: "0 0 6px", border: "2px solid rgba(0,0,0,.45)", borderLeft: "14px solid rgba(0,0,0,.3)", borderRadius: "4px 8px 8px 4px",
        background: b.c, color: "#fff", font: "700 15px Fredoka, sans-serif", textShadow: "0 1px 0 rgba(0,0,0,.4)" } },
        h("span", {}, b.t, h("span", { style: { display: "block", font: "500 11px sans-serif", opacity: .85 } }, b.a + " \u2022 " + b.pages.length + " pages")),
        h("span", { style: { fontSize: "13px" } }, isRead ? "\u2713 read" : "open"));
      spine.addEventListener("click", () => { api.sound("click"); open(b, 0); });
      return spine;
    });
    api.modal({ title: "Bookshelf", subtitle: read.length + " of " + BOOKS.length + " books finished", body: h("div", {}, rows), onClose: off });
  };

  const open = (b, i) => {
    off();
    const last = b.pages.length - 1;
    const page = h("div", { style: {
      background: "#fbf3df", color: "#3b2a1a", borderRadius: "6px", padding: "18px 18px 12px", minHeight: "230px",
      boxShadow: "inset 0 0 0 2px #d8c7a3, inset 8px 0 14px rgba(120,80,30,.18)", font: "500 15px/1.55 Georgia, serif", whiteSpace: "pre-wrap" } }, b.pages[i]);
    const num = h("div", { style: { textAlign: "center", fontSize: "12px", margin: "8px 0", color: "#94a3b8" } }, "Page " + (i + 1) + " of " + b.pages.length);
    const go = d => { const n = Math.max(0, Math.min(last, i + d)); if (n !== i) { api.sound("click"); open(b, n); } };
    if (i === last) {
      const read = done();
      if (!read.includes(b.t)) { api.state.read = [...read, b.t]; api.save(); }
    }
    const nav = h("div", { style: { display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" } },
      button("\u25C0 Prev", { kind: "blue", small: true, onClick: () => go(-1) }),
      button("Shelf", { kind: "dark", small: true, onClick: () => shelf() }),
      button("Next \u25B6", { kind: "blue", small: true, onClick: () => go(1) }));
    const kf = e => {
      const k = String(e.key).toLowerCase();
      if (k === "arrowright" || k === "d") { e.preventDefault(); e.stopPropagation(); go(1); }
      else if (k === "arrowleft" || k === "a") { e.preventDefault(); e.stopPropagation(); go(-1); }
    };
    api.modal({ title: b.t, subtitle: b.a + " \u2022 \u25C0 \u25B6 keys turn the page", body: h("div", {}, page, num, nav), onClose: off });
    keyfn = kf; document.addEventListener("keydown", kf, true);   // after modal(): opening it runs the previous onClose
  };

  shelf();
};
