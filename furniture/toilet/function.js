// Sit down on the toilet. When you get up it flushes (a brief glow). Can't be spammed mid-flush.
const flushing = new Set();
export default api => {
  api.sit();
  api.say("*sits down*");
  api.after(1400, () => { if (api.exists() && api.player.isSeated) api.say("Ahh..."); });
};
export function leave(api) {
  const id = api.item.id;
  if (flushing.has(id)) return;
  flushing.add(id);
  api.sound("door");
  api.after(450, () => { api.sound("switch"); api.glow("#bfe6ff", 1.5, { temp: true }); api.say("*flush*"); });
  api.after(2400, () => { api.glow(null); flushing.delete(id); });
}
