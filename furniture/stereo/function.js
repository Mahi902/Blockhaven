// A real radio: lo-fi, jazz, rock, classical and chiptune loops are synthesised live (original music,
// no audio files). The stereo glows and shows a note while it plays; pick a volume or turn it off.
const COLORS = { lofi: "#8ff0a4", jazz: "#ffd27a", rock: "#ff8a8a", classical: "#c9a6ff", chiptune: "#7fe9ff" };
const LINES = { lofi: "Chill beats to build rooms to.", jazz: "Smooth jazz fills the room.", rock: "Turn it up!", classical: "Very sophisticated.", chiptune: "Bleep bloop. Instant nostalgia." };
const VOLUMES = [["Quiet", 0.3], ["Normal", 0.55], ["Loud", 0.9]];

function open(api) {
  const { h, choice } = api.ui;
  const now = api.music.now;
  const vol = typeof api.state.volume === "number" ? api.state.volume : 0.55;
  const rows = api.music.tracks.map(([id, name]) => choice(name, now === id ? "Now playing" : "Play", () => {
    api.music.volume(vol);
    if (!api.music.play(id)) { api.say("The stereo crackles. (Is sound turned off?)"); return; }
    api.glow(COLORS[id] || "#8ff0a4", 2, { temp: true });
    api.badge("\u{1F3B5}", { temp: true });
    api.closeModal(); api.say(LINES[id] || "Music!");
  }));
  rows.push(choice("Turn off", now ? "Silence" : "Already off", () => {
    api.music.stop(); api.glow(null); api.badge(null); api.sound("switch"); api.closeModal();
    if (now) api.say("Silence.");
  }));
  rows.push(h("div", { class: "bh-label" }, "Volume"));
  VOLUMES.forEach(([n, v]) => rows.push(choice(n, Math.abs(vol - v) < 0.01 ? "Current" : "Set volume", () => {
    api.state.volume = v; api.music.volume(v); open(api);
  })));
  api.modal({ title: "Stereo", subtitle: now ? "Now playing: " + (api.music.tracks.find(t => t[0] === now) || [0, now])[1] : "The stereo is off", body: h("div", { class: "bh-list" }, rows) });
}
export default api => open(api);
