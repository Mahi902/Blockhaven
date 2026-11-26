// Cat Bed: call any of your cats over. A sitting or sleeping cat wakes, stands up and trots to the bed.
export default api => {
  const { h, choice } = api.ui, cats = api.cats;
  const body = h("div", { class: "bh-list" });
  if (!cats.length) body.appendChild(h("p", { class: "bh-text" }, "No cats yet. Place one from the NPC section."));
  cats.forEach(c => body.appendChild(choice(c.name, c.color + (c.sleeping ? " - sleeping" : c.pose === "stand" ? " - standing" : " - sitting"), () => {
    api.closeModal(); api.sound("meow"); api.callCat(c.id);
  })));
  api.modal({ title: "Call Cat", subtitle: cats.length ? "Pick a cat to call over" : "", body, buttons: [] });
};
