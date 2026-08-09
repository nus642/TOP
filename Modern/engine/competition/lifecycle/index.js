const state = require("./competition-lifecycle-state");
const engine = require("./lifecycle-engine");

module.exports = { ...state, ...engine };
