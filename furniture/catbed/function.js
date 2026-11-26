// Pet the sleepy cat.
const LINES = ["Purr... purr...", "The cat stretches and yawns.", "The cat leans into your hand.", "Mrrp? ...and back to sleep.", "A tiny, happy snore."];
export default api => {
  api.state.pets = (api.state.pets || 0) + 1;
  api.sound("snack");
  api.say(api.state.pets % 5 === 0 ? "The cat loves you. Obviously." : LINES[Math.floor(Math.random() * LINES.length)]);
};
