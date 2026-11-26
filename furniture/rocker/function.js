// Sit and rock - and spin! Arrow keys (or A / D) spin you left or right. E, Up or Down gets you off.
export default api => {
  api.spin();
  api.say("Wheee! Use \u25C0 \u25B6 to spin. E to get off.");
};
export function leave(api) { api.say("Woah... dizzy!"); }
