const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const db = require("../db");
const { retrieveInformationGivenId } = require("../routes/helpers");

// Set up passport strategy
passport.use(
  new LocalStrategy(
    { usernameField: "email" },
    async (email, password, done) => {
      res = await db.query("SELECT * FROM customer WHERE email = $1", [email]);
      let userRetrieved = res.rows;
      if (!res.rows.length) {
        console.log("ERROR");
        return done(null, false, {
          message: "user was not found***************_____________",
        });
      }
      return done(null, {
        message: "Login successfull. camilo",
        email: email,
      });
    }
  )
);

// Serialize User
passport.serializeUser((user, done) => {
  console.log("Entra al serializador");
  //console.log(user);
  done(null, user.email);
});

// TODO: Create Deserializer
passport.deserializeUser(async (email, done) => {
  res = await db.query("SELECT * FROM customer WHERE email = $1", [email]);
  let userRetrieved = res.rows;
  console.log("DESSSERIALIZEEEEE");
  if (!res.rows.length) {
    return done("error");
  }
  return done(null, userRetrieved);
});
module.exports = passport;
