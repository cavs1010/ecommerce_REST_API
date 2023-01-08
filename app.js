require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");

const productRouter = require("./routes/product");
const customerRouter = require("./routes/customer");
const cartRouter = require("./routes/cart");

const app = express();
const PORT = process.env.PORT;

app.use(bodyParser.json());

app.use("/product", productRouter);
app.use("/customer", customerRouter);
app.use("/cart", cartRouter);

app.get("/", (req, res) => {
  res.json({ info: "It is ready to use" });
});

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
