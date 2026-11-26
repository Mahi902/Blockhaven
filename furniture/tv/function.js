// A TV with real channels. Each has its own live-synthesised soundtrack and a flickering screen glow.
const CH = [
  ["Cartoons", "tv-cartoons", ["#ff9bd0", "#ffd27a", "#8cc8ff", "#8ff0a4"], "Boing! Somebody fell off a cliff again."],
  ["News", "tv-news", ["#8cc8ff", "#dbe9ff", "#8cc8ff", "#6fa8e8"], "...and now, the weather: indoors."],
  ["Nature", "tv-nature", ["#8ff0a4", "#6fd3a0", "#b6f0a0"], "A rare couch potato, in its natural habitat."],
  ["Late Movie", "tv-movie", ["#c9a6ff", "#7a5cff", "#e0c8ff", "#4d3bd0"], "Ooh, a plot twist. Probably."],
];
const VOLUMES = [["Quiet", 0.3], ["Normal", 0.55], ["Loud", 0.9]];

function open(api) {
  const { h, choice } = api.ui;
  const now = api.music.now;
  const vol = typeof api.state.volume === "number" ? api.state.volume : 0.55;
  const cur = CH.find(c => c[1] === now);
  const rows = CH.map(([name, track, cols, line]) => choice(name, now === track ? "Now showing" : "Channel", () => {
    api.music.volume(vol);
    if (!api.music.play(track)) { api.say("Just static. (Sound is off - tap the speaker button.)"); return; }
    if (!api.audioReady) api.ui.toast("Your browser is still blocking sound - tap the screen once more.");
    api.glow(cols, 3, { temp: true });
    api.badge("\u{1F4FA}", { temp: true });
    api.closeModal(); api.sound("switch"); api.say(line);
  }));
  rows.push(choice("Turn off", cur ? "Screen off" : "Already off", () => {
    api.music.stop(); api.glow(null); api.badge(null); api.sound("switch"); api.closeModal();
  }));
  rows.push(h("div", { class: "bh-label" }, "Volume"));
  VOLUMES.forEach(([n, v]) => rows.push(choice(n, Math.abs(vol - v) < 0.01 ? "Current" : "Set volume", () => {
    api.state.volume = v; api.music.volume(v); open(api);
  })));
  api.modal({ title: "TV", subtitle: cur ? "Now showing: " + cur[0] : "The TV is off", body: h("div", { class: "bh-list" }, rows) });
}
export default api => open(api);
