// Pick a pace and run in place.
const PACES = [["Walk", "Easy pace", "Just a casual stroll."], ["Jog", "Steady", "Huff... puff... feeling good."], ["Sprint", "Full speed", "Faster! Faster! ...Phew."]];
export default api => {
  const { h, choice } = api.ui;
  if (api.state.busy) { api.say("Already running!"); return; }
  const body = h("div", { class: "bh-list" }, PACES.map(([t, sub, line]) => choice(t, sub, () => {
    api.closeModal();
    api.state.busy = true;
    api.sound("switch");
    api.say(t + " started...");
    api.after(2800, () => { api.state.busy = false; api.sound("good"); api.say(line); });
  })));
  api.modal({ title: "Treadmill", subtitle: "Pick a pace", body });
};
