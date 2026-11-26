// Play a little tune. The piano glows and plays a run of notes while you play.
const TUNES = [
  ["Twinkle twinkle", "A classic", "C C G G A A G...", 7],
  ["Jazz chords", "Very fancy", "Bum... ba-dum... bum. Smooth.", 4],
  ["Mystery sonata", "You made it up", "Dramatic chords fill the room.", 5],
  ["Chopsticks", "Everyone knows it", "Plink plonk plink plonk plink!", 6],
];
const playing = new Set();
export default api => {
  const { h, choice } = api.ui;
  const id = api.item.id;
  if (playing.has(id)) { api.say("Still playing..."); return; }
  const body = h("div", { class: "bh-list" }, TUNES.map(([t, sub, line, notes]) => choice(t, sub, () => {
    api.closeModal();
    playing.add(id);
    api.state.played = (api.state.played || 0) + 1;
    api.glow("#ffd27a", 2);
    api.say(line);
    for (let i = 0; i < notes; i++) api.after(i * 260, () => api.sound("good"));
    api.after(notes * 260 + 300, () => { api.glow(null); playing.delete(id); api.save(); });
  })));
  const n = api.state.played || 0;
  api.modal({ title: "Piano", subtitle: n ? "Tunes played: " + n : "Play a tune", body });
};
