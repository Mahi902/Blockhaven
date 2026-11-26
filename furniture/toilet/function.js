// Use the toilet, then it flushes (a brief glow). Can't be spammed mid-flush.
const flushing = new Set();
export default api => {
  const id = api.item.id;
  if (flushing.has(id)) { api.say("Give it a second."); return; }
  flushing.add(id);
  api.sound("door");
  api.say("Ahh. Much better.");
  api.after(900, () => { api.sound("switch"); api.glow("#bfe6ff", 1.5); });
  api.after(2400, () => { api.glow(null); flushing.delete(id); });
};
