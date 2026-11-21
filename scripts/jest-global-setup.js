// Tests run in a zone that is not Korea's, so code that reads the device clock's own date
// fields where it should read Asia/Seoul fails even on a machine set to KST. Set here, before
// the workers start: they inherit it, and a TZ change inside a test file does not take effect.
module.exports = async () => {
  process.env.TZ = 'America/Los_Angeles';
};
