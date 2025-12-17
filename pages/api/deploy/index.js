// Re-export the catch-all route handler
const handler = require("./[...slug]");
module.exports = handler;
