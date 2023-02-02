const passport = require("passport");

const LocalStrategy = require("passport-local").Strategy;

console.log("Inside localStrategy");

passport.use(
  new LocalStrategy({ usernameField: "email" }, (email, password, done) => {
    console.log("Local Strategy in use.");
    console.log(`Email: ${email}, Password: ${password}`);
    return done(null, { message: "Login successfull. ", email: email });
  })
);

module.exports = passport;
