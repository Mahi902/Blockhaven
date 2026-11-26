// Cleaning Robot (NPC): pick the rooms, press Start. It cleans, goes back to the dock to drain dirty water,
// fill clean water and empty it (it cannot be started during that). While it moves, chase it and press E to
// pause it; its dock is always home. After 30s of being unable to work it returns to the dock (teleports if stuck).
// From the dock you can pause, resume or call it back.
export default api => {
  const b = api.bot, { h, choice } = api.ui;
  if ((b.status === "clean" || b.status === "wait") && b.near) { b.stop(); api.sound("switch"); return; }
  const rooms = b.rooms, chosen = new Set(b.chosen);
  const labels = {
    idle: "Ready", clean: "Cleaning", return: "Returning to the dock", home: "Heading home",
    wait: "Waiting for a clear path", paused: "Paused", stuck: "Cannot work, returning soon", service: "Servicing: draining, refilling, emptying",
  };
  const body = h("div", { class: "bh-list" });
  const inp = h("input", { value: b.name, maxlength: 16, placeholder: "Robot name", style: "width:100%;box-sizing:border-box;padding:10px;font:700 16px sans-serif;border:3px solid #0f172a;border-radius:10px;margin-bottom:8px;user-select:text" });
  inp.addEventListener("input", () => b.rename(inp.value));
  inp.addEventListener("keydown", e => e.stopPropagation());
  inp.addEventListener("keyup", e => e.stopPropagation());
  body.appendChild(inp);
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
  if (b.status === "clean" || b.status === "wait") buttons.push({ label: "Pause", kind: "blue", onClick: () => { api.closeModal(); b.stop(); } });
  if (b.paused) buttons.push({ label: "Resume", kind: "green", onClick: () => { api.closeModal(); b.resume(); } });
  if (b.working && b.status !== "service") buttons.push({ label: "Call back", kind: "blue", onClick: () => { api.closeModal(); b.recall(); } });
  api.modal({
    title: "Cleaning Robot",
    subtitle: labels[b.status] + (b.status === "clean" ? " - catch it and press E to pause it" : ""),
    body, buttons,
  });
};
