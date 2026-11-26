// Pet the sleepy cat. It remembers how often you have, and glows happily while it purrs.
const LINES = ["Purr... purr...", "The cat stretches and yawns.", "The cat leans into your hand.", "Mrrp? ...and back to sleep.", "A tiny, happy snore."];
export default api => {
  const pets = (api.state.pets || 0) + 1;
  api.state.pets = pets;
  const loved = pets % 5 === 0;
  api.sound("snack");
  api.glow(loved ? "#ff9bd0" : "#ffd9b0", loved ? 2.5 : 1.5);
  api.say(loved ? "The cat loves you. Obviously. (" + pets + " pets)" : LINES[Math.floor(Math.random() * LINES.length)]);
  api.after(loved ? 2600 : 1400, () => { api.glow(null); api.save(); });
};
