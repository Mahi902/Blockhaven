// Play a little tune.
const TUNES = [
  ["Twinkle twinkle", "A classic", "C C G G A A G..."],
  ["Jazz chords", "Very fancy", "Bum... ba-dum... bum. Smooth."],
  ["Mystery sonata", "You made it up", "Dramatic chords fill the room."],
  ["Chopsticks", "Everyone knows it", "Plink plonk plink plonk plink!"],
];
export default api => {
  const { h, choice } = api.ui;
  const body = h("div", { class: "bh-list" }, TUNES.map(([t, sub, line]) => choice(t, sub, () => {
    api.closeModal(); api.sound("good"); api.after(220, () => api.sound("good")); api.say(line);
  })));
  api.modal({ title: "Piano", subtitle: "Play a tune", body });
};
