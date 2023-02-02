const passport = require("passport");
const LocalStrategy = require("./strategies/local");

passport.use(LocalStrategy);

module.exports = passport;
