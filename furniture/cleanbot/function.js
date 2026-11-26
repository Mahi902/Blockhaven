// Cleaning Robot (NPC): pick the rooms, press Start. It cleans, goes back to the dock to drain dirty water,
// fill clean water and empty it (it cannot be started during that). While it moves, chase it and press E to
// stop it; where it stops becomes its new home. It walks around you and new obstacles, and talks.
export default api => {
  const b = api.bot, { h, choice } = api.ui;
  if (b.moving && b.near) { b.stop(); api.sound("switch"); return; }
  const rooms = b.rooms, chosen = new Set(b.chosen);
  const labels = {
    idle: "Ready", clean: "Cleaning", return: "Returning to the dock", home: "Heading home",
    wait: "Waiting for a clear path", service: "Servicing: draining, refilling, emptying",
  };
  const body = h("div", { class: "bh-list" });
  if (!rooms.length) body.appendChild(h("p", { class: "bh-text" }, "No rooms yet. Use the Room tool in build mode to outline the areas to clean."));
  const canStart = b.status === "idle";
  rooms.forEach(r => {
    const mark = () => (chosen.has(r.id) ? "Selected" : "Tap to select");
    const el = choice(r.name, mark(), () => {
      if (!canStart) return;
      chosen.has(r.id) ? chosen.delete(r.id) : chosen.add(r.id);
      el.querySelector(".bh-choice-s").textContent = mark();
      el.style.outline = chosen.has(r.id) ? "3px solid #22c55e" : "";
      b.choose([...chosen]);
    });
    if (chosen.has(r.id)) el.style.outline = "3px solid #22c55e";
    if (!canStart) el.style.opacity = "0.6";
    body.appendChild(el);
  });
  const buttons = [];
  if (canStart && rooms.length) buttons.push({ label: "Start cleaning", kind: "green", onClick: () => {
    if (!chosen.size) { api.toast("Pick at least one room."); return; }
    api.closeModal();
    api.sound("switch");
    b.start([...chosen]);
  } });
  api.modal({
    title: "Cleaning Robot",
    subtitle: labels[b.status] + (b.moving ? " - catch it and press E to stop it" : ""),
    body, buttons,
  });
};
