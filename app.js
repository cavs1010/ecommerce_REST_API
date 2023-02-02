require("dotenv").config();

const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");

const productRouter = require("./routes/product");
const customerRouter = require("./routes/customer");
const routers_cart = require("./routes/cart");
const cartRouter = require("./routes/cart");
const orderRouter = require("./routes/order");

const app = express();
const PORT = process.env.PORT;

app.use(
  session({
    secret: "ThisIsASecretKeyForSigningSessionIDCookies",
    resave: false,
    saveUninitialized: false,
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

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

module.exports = app;
