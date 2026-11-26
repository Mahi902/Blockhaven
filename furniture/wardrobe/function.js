// Change your outfit and look.
export default api => {
  const { h, swatches } = api.ui, pal = api.palette;
  const row = (label, key) => h("div", {}, h("div", { class: "bh-label" }, label),
    swatches({ colors: pal[key], value: api.player.look[key], onPick: c => api.setLook({ [key]: c }) }));
  api.modal({ title: "Wardrobe", subtitle: "Pick your look",
    body: h("div", { class: "bh-stack" }, row("Shirt", "shirt"), row("Pants", "pants"), row("Hair", "hair"), row("Skin", "skin")) });
};
