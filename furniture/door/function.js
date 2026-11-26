// Open / close. Closed doors block walking; open ones swing out of the way.
export default api => {
  const open = !api.item.state.open;
  api.item.state.open = open;
  api.sound("door");
};
