// Sit on the couch. While seated, the arrow keys (or A / D) along the couch slide you one seat at a time
// (left / right on a normal couch, up / down if you rotated it). Other directions, E or a click get you up.
export default api => {
  api.sit();
  api.say("\u25C0 \u25B6 to change seats.");
};
