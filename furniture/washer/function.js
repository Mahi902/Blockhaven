// Washing machine: stand next to it, pick a cycle and it sucks your shirt and trousers in (you are left in your undies).
// When the cycle ends, use it again to collect your clean clothes and get dressed.
const CYCLES = [["Quick wash", "12 seconds", 12000], ["Normal wash", "22 seconds", 22000], ["Heavy wash", "36 seconds, very dirty", 36000]];
const UNDIES = "#f1f5f9";
export default api => {
  const { h, choice } = api.ui;
  if (api.locked) return;
  const L = api.state.laundry;

  if (L && !L.collected) {
    const left = L.start + L.dur - Date.now();
    if (left > 0) { api.say("Still washing... " + api.fmtTime(left) + " left."); api.sound("switch"); return; }
    // collect
    const me = api.player, to = api.itemPos;
    api.lock({ ms: 1500, anim: "suck" });
    api.sound("door");
    api.flyCloth(to, { x: me.x, y: me.y - 14 }, "shirt", L.shirt, 800, 0);
    api.flyCloth(to, { x: me.x, y: me.y - 4 }, "pants", L.pants, 800, 450, () => {
      api.setLook({ shirt: L.shirt, pants: L.pants });
      api.state.laundry = null; api.sound("good"); api.say("Fresh and fluffy! Clothes back on.");
    });
    return;
  }

  const look = api.clothes;
  if (look.shirt === look.skin && look.pants === UNDIES) { api.say("You have no clothes to wash!"); return; }
  const body = h("div", { class: "bh-list" }, CYCLES.map(([t, sub, ms]) => choice(t, sub, () => {
    api.closeModal();
    const me = api.player, to = api.itemPos, c = api.clothes;
    api.lock({ ms: 2200, anim: "suck", toward: to });
    api.sound("switch"); api.say("Whoooosh! Your clothes!");
    api.flyCloth({ x: me.x, y: me.y - 14 }, to, "shirt", c.shirt, 900, 250);
    api.flyCloth({ x: me.x, y: me.y - 4 }, to, "pants", c.pants, 900, 900, () => {
      api.setLook({ shirt: c.skin, pants: UNDIES });
      api.say("Brr! Wait for the wash...");
    });
    api.state.laundry = { start: Date.now() + 2100, dur: ms, shirt: c.shirt, pants: c.pants, collected: false };
    api.glow("#8cc8ff", 2, ms + 2100);
    api.save();
  })));
  api.modal({ title: "Washing Machine", subtitle: "Pick a cycle - it takes your clothes!", body });
};
