require("dotenv").config();
const { application } = require("express");
const express = require("express");

const app = express();
const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
