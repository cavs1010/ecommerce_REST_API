/*---IMPORTS---*/
const express = require("express");
const { get } = require("../app");
const orderRouter = express.Router();
const db = require("../db");

/*--- ROUTES' HELPERS---*/
// GET
const getOrders = async (req, res, next) => {
  try {
    const results = await db.query("SELECT * FROM previous_order;");
    return res.status(200).json(results.rows);
  } catch (error) {
    console.log(error);
    return res.status(500).send("There was an error");
  }
};

/*---ROUTES---*/
orderRouter.get("/", getOrders);

/*---ROUTER EXPORT---*/
module.exports = orderRouter;
