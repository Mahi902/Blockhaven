// Play a quick arcade game. The screen glows while you play.
const GAMES = [["Space Blasters", "Defend the galaxy"], ["Block Stacker", "Fit the falling blocks"], ["Pixel Racer", "Race against the clock"], ["Tiny Kong", "Climb to the top"]];
export default api => {
  const { h, choice } = api.ui;
  if (api.state.busy) { api.say("Game in progress!"); return; }
  const body = h("div", { class: "bh-list" }, GAMES.map(([t, sub]) => choice(t, sub, () => {
    api.closeModal();
    api.state.busy = true;
    api.glow("#c9a6ff", 2);
    api.sound("switch");
    api.say("Playing " + t + "...");
    const score = (Math.floor(Math.random() * 90) + 10) * 100;
    api.after(2600, () => { api.state.busy = false; api.glow(null); api.sound("good"); api.say("Game over! Score: " + score); });
  })));
  api.modal({ title: "Arcade", subtitle: "Pick a game", body });
};
