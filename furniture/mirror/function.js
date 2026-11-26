// Look in the mirror and pick a hairstyle.
const NAMES = { short: "Short", buzz: "Buzz", spiky: "Spiky", long: "Long", ponytail: "Ponytail", bun: "Bun", mohawk: "Mohawk" };
export default api => {
  const { h, choice } = api.ui;
  const now = api.player.look.style;
  const body = h("div", { class: "bh-list" }, api.palette.hairStyles.map(id => choice(
    NAMES[id] || id, id === now ? "Current style" : "Try this style", () => {
      api.setLook({ style: id }); api.sound("switch"); api.closeModal(); api.say("Looking sharp!");
    })));
  api.modal({ title: "Mirror", subtitle: "Pick a hairstyle", body });
};
