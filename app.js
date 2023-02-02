require("dotenv").config();

const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");

const productRouter = require("./routes/product");
const customerRouter = require("./routes/customer");
const routers_cart = require("./routes/cart");
const cartRouter = require("./routes/cart");
const orderRouter = require("./routes/order");

const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

const app = express();
const PORT = process.env.PORT;

app.use(
  session({
    secret: "ThisIsASecretKeyForSigningSessionIDCookies",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  console.log("The message inside serializeUser");
  console.log(`This is what is inside of user: ${user}`);
  console.log(user);
  done(null, user.email);
});

//passport.deserializeUser;


//Passport Local Strategy
passport.use(
  new LocalStrategy({ usernameField: "email" }, (email, password, done) => {
    console.log("Local Strategy in use.");
    console.log(`Email: ${email}, Password: ${password}`);
    return done(null, { message: "Login successfull. ", email: email });
  })
);

app.use(bodyParser.json());

app.use("/product", productRouter);
app.use("/customer", customerRouter);
app.use("/cart", cartRouter);
app.use("/order", orderRouter);

app.get("/", (req, res) => {
  res.json({ info: "It is ready to use" });
});


app.post(
  "/customer/login",
  passport.authenticate("local", { failureRedirect: "/customer" }),
  function (req, res) {
    const { email, password } = req.body;
    console.log(
      `Login successful with email ${email} and password ${password}`
    );
    return res.status(200).send("Login successfully");
  }
);

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

module.exports = app;
