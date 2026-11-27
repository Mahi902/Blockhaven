// Lava lamp: on / off and wax colour. While on, blobs rise and sink inside the glass (see fx.js) and the room glows.
const WAX = [
  ["Orange", "#ff8a3d", "Warm and wobbly."],
  ["Pink", "#ff6fb5", "Soft pink bubbles."],
  ["Green", "#5fe07a", "Very swampy. Very cool."],
  ["Blue", "#5aa9ff", "Calm blue drift."],
];
export default api => {
  const { h, choice } = api.ui;
  const st = api.state, on = !!st.on;
  const rows = [choice(on ? "Switch off" : "Switch on", on ? "The blobs slow down and settle" : "It takes a moment to warm up", () => {
    st.on = !on;
    if (st.on) { st.wax = st.wax || WAX[0][1]; api.glow(st.wax, 2); api.sound("switch"); api.say("The blobs start to drift."); }
    else { api.glow(null); api.sound("click"); api.say("The lamp cools down."); }
    api.closeModal();
  })];
  WAX.forEach(([t, col, line]) => rows.push(choice(t + " wax", st.wax === col ? "Current colour" : "Change the wax colour", () => {
    st.wax = col; st.on = true; api.glow(col, 2); api.sound("switch"); api.say(line); api.closeModal();
  })));
  api.modal({ title: "Lava Lamp", subtitle: on ? "Running" : "Switched off", body: h("div", { class: "bh-list" }, rows) });
};
