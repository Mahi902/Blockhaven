// Toaster: pick a food, the slots glow while it toasts (see fx.js), then it pops up. Use it again to take the toast.
const FOODS = [
  ["Bread", "Classic, 5 seconds", 5000, "#d9a45a", "Golden toast. Butter time."],
  ["Bagel", "Thick, 8 seconds", 8000, "#c98a4a", "A perfectly toasted bagel."],
  ["Waffle", "Frozen, 7 seconds", 7000, "#e0b050", "Crispy waffle. Syrup, please."],
];
export default api => {
  const { h, choice } = api.ui;
  const st = api.state, H = st.heat;
  if (H) {
    const left = H.start + H.dur - Date.now();
    if (left > 0) { api.say("Still toasting... " + api.fmtTime(left) + " left."); api.sound("switch"); return; }
    st.heat = null; api.glow(null); api.sound("good"); api.say(H.line); api.save(); return;
  }
  const body = h("div", { class: "bh-list" }, FOODS.map(([t, sub, ms, col, line]) => choice(t, sub, () => {
    api.closeModal();
    st.heat = { start: Date.now(), dur: ms, col, line };
    api.glow("#ff8a3d", 1, ms);
    api.sound("switch"); api.say("Toasting " + t.toLowerCase() + "...");
    api.after(ms, () => { if (api.exists() && st.heat) { api.sound("good"); api.say("Ding! Toast is up."); } });
    api.save();
  })));
  api.modal({ title: "Toaster", subtitle: "What are we toasting?", body });
};
