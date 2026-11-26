// Cat (NPC): sit it where it is, or stand it so it follows you. Rename it. It purrs, and at night it curls up
// (in a cat bed if there is one).
export default api => {
  const b = api.bot, { h, choice } = api.ui;
  const body = h("div", { class: "bh-list" });
  const inp = h("input", { value: b.name, maxlength: 16, placeholder: "Cat name", style: "width:100%;box-sizing:border-box;padding:10px;font:700 16px sans-serif;border:3px solid #0f172a;border-radius:10px;margin-bottom:8px;user-select:text" });
  inp.addEventListener("input", () => b.rename(inp.value));
  inp.addEventListener("keydown", e => e.stopPropagation());
  inp.addEventListener("keyup", e => e.stopPropagation());
  body.appendChild(inp);
  const mk = (label, sub, pose) => {
    const el = choice(label, b.pose === pose ? "Current" : sub, () => { api.closeModal(); b.setPose(pose); });
    if (b.pose === pose) el.style.outline = "3px solid #22c55e";
    return el;
  };
  body.appendChild(mk("Sit", "Stays where it is", "sit"));
  body.appendChild(mk("Stand", "Follows you around", "stand"));
  api.modal({ title: b.name || "Cat", subtitle: b.sleeping ? "Sleeping" : b.pose === "stand" ? "Standing, following you" : "Sitting", body, buttons: [] });
};
