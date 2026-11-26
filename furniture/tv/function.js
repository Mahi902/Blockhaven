// A remote with a few channels. The screen glows while it is on.
const CH = [["Off", null], ["Cartoons", "#ff9bd0"], ["News", "#8cc8ff"], ["Nature", "#8ff0a4"], ["Late Movie", "#c9a6ff"]];
export default api => {
  const { h, choice } = api.ui;
  const body = h("div", { class: "bh-list" }, CH.map(([name, col]) => choice(name, col ? "Channel" : "Turn off", () => {
    api.state.channel = name; api.glow(col, 3); api.sound("switch"); api.closeModal();
  })));
  api.modal({ title: "TV", subtitle: api.state.channel ? "Now showing: " + api.state.channel : "The TV is off", body });
};
