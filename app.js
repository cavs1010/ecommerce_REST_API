require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");

const productsRouter = require("./routes/products");

const app = express();
const PORT = process.env.PORT;

app.use(bodyParser.json());

app.use("/product", productsRouter);

app.get("/", (req, res) => {
  res.json({ info: "It is ready to use" });
});

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
