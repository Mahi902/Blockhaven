// Pick a station. The stereo glows while music is playing.
const TRACKS = [
  ["Off", null, "Silence."],
  ["Lo-fi beats", "#8ff0a4", "Chill beats to build rooms to."],
  ["Jazz", "#ffd27a", "Smooth jazz fills the room."],
  ["Rock", "#ff8a8a", "Turn it up!"],
  ["Classical", "#c9a6ff", "Very sophisticated."],
];
export default api => {
  const { h, choice } = api.ui;
  const body = h("div", { class: "bh-list" }, TRACKS.map(([name, col, line]) => choice(name, col ? "Play" : "Turn off", () => {
    api.state.track = col ? name : null;
    api.glow(col, 2); api.sound("switch"); api.closeModal(); api.say(line);
  })));
  api.modal({ title: "Stereo", subtitle: api.state.track ? "Now playing: " + api.state.track : "The stereo is off", body });
};
