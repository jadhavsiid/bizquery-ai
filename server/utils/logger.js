// === logger.js ===
const timestamp = () => new Date().toISOString();

const log = (...args) => {
  console.log(`[${timestamp()}]`, ...args);
};

const error = (...args) => {
  console.error(`[${timestamp()} ❌]`, ...args);
};

module.exports = {
  log,
  error
};
