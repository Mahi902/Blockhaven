// Pick a pace and run in place. The console glows while you run and logs your distance.
const PACES = [["Walk", "Easy pace", "Just a casual stroll.", 0.1], ["Jog", "Steady", "Huff... puff... feeling good.", 0.3], ["Sprint", "Full speed", "Faster! Faster! ...Phew.", 0.6]];
const running = new Set();
export default api => {
  const { h, choice } = api.ui;
  const id = api.item.id;
  if (running.has(id)) { api.say("Already running!"); return; }
  const km = api.state.km || 0;
  const body = h("div", { class: "bh-list" }, PACES.map(([t, sub, line, dist]) => choice(t, sub, () => {
    api.closeModal();
    running.add(id);
    api.glow("#8ff0a4", 2);
    api.sound("switch");
    api.say(t + " started...");
    api.after(2800, () => {
      api.state.km = Math.round((km + dist) * 10) / 10;
      api.glow(null); running.delete(id); api.sound("good");
      api.say(line + " (" + api.state.km + " km total)"); api.save();
    });
  })));
  api.modal({ title: "Treadmill", subtitle: km ? "Distance so far: " + km + " km" : "Pick a pace", body });
};
