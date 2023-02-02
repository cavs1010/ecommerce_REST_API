const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

// Set up passport strategy
passport.use(
  new LocalStrategy({ usernameField: "email" }, (email, password, done) => {
    console.log("Local Strategy in use.");
    console.log(`Email: ${email}, Password: ${password}`);
    return done(null, { message: "Login successfull. ", email: email });
  })
);

// Serialize User
passport.serializeUser((user, done) => {
  console.log("The message inside serializeUser");
  console.log(`This is what is inside of user: ${user}`);
  console.log(user);
  done(null, user.email);
});

// TODO: Create Deserializer

module.exports = passport;
