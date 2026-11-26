// Use the toilet.
export default api => {
  api.sound("door");
  api.say("Ahh. Much better.");
  api.after(900, () => api.sound("switch"));
};
