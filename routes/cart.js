/*---IMPORTS---*/
const express = require("express");
const cartRouter = express.Router();
const db = require("../db");

//Helpers
const { checkIndexExists, retrieveInformationGivenId } = require("./helpers");

/*--- ROUTES' HELPERS---*/
// GET
const getCarts = async (req, res, next) => {
  try {
    const results = await db.query(
      "SELECT cart_product.cart_id AS cart_id, customer.id AS customer_id, customer.email AS customer_email, cart.last_modified AS cart_last_modified, SUM(product.price_unit * cart_product.quantity) AS total_value FROM cart_product INNER JOIN product ON cart_product.product_id = product.id INNER JOIN cart ON cart.id = cart_product.cart_id INNER JOIN customer ON cart.customer_id = customer.id GROUP BY (cart_product.cart_id, customer.id, customer.email, cart.last_modified) ORDER BY cart_id;"
    );
    res.status(200).json(results.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).send("There was an error");
  }
};

// GET cart by customer id
const getCartByCustomer = async (req, res, next) => {
  const customerId = parseInt(req.params.customerId);
  const customerNotExist = await checkIndexExists("customer", customerId);
  if (customerNotExist) {
    console.log(customerNotExist);
    return res.status(400).send({ error: customerNotExist });
  }

  try {
    const results = await db.query(
      "SELECT cart_product.product_id AS product_id, product.name AS product_name, cart_product.quantity AS quantity, cart.customer_id AS customer_id, product.price_unit AS price_unit, (cart_product.quantity * product.price_unit) AS total_price FROM cart INNER JOIN cart_product ON cart_product.cart_id = cart.id INNER JOIN product ON cart_product.product_id = product.id WHERE cart.customer_id = $1;",
      [customerId]
    );
    return res.status(200).json(results.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).send("There was an error");
  }
};

//DELETE
const deleteCartByCustomer = async (req, res, next) => {
  const customerId = parseInt(req.params.customerId);
  const customerNotExist = await checkIndexExists("customer", customerId);
  if (customerNotExist) {
    console.log(customerNotExist);
    return res.status(400).send({ error: customerNotExist });
  }

  const cartId = await retrieveInformationGivenId(
    "id",
    "cart",
    "customer_id",
    customerId
  );
  try {
    await db.query(
      "DELETE FROM cart_product WHERE cart_product.cart_id = $1;",
      [cartId]
    );
    return res
      .status(200)
      .send(`The cart of customer ${customerId} has been emptied`);
  } catch (error) {
    console.error(error);
    return res.status(500).send("There was an error");
  }
};

// POST product
const postCartByCustomer = async (req, res, next) => {
  const customerId = parseInt(req.params.customerId);
  const customerNotExist = await checkIndexExists("customer", customerId);
  if (customerNotExist) {
    console.log(customerNotExist);
    return res.status(400).send({ error: customerNotExist });
  }

  const cartId = await retrieveInformationGivenId(
    "id",
    "cart",
    "customer_id",
    customerId
  );
  const { product_id, quantity } = req.body;
  if (!product_id || !quantity) {
    return res
      .status(500)
      .send("The product_id and the customer_id should not been zero or null");
  }
  try {
    await db.query(
      "INSERT INTO cart_product (product_id, quantity, cart_id) VALUES ($1, $2, $3) RETURNING *;",
      [product_id, quantity, cartId]
    );
    const nameProduct = await retrieveInformationGivenId(
      "name",
      "product",
      "id",
      product_id
    );
    const emailCustomer = await retrieveInformationGivenId(
      "email",
      "customer",
      "id",
      customerId
    );
    const unitPrice = await retrieveInformationGivenId(
      "price_unit",
      "product",
      "id",
      product_id
    );
    return res
      .status(201)
      .send(
        `An item ${nameProduct} has been added to customer ${emailCustomer}(id = ${customerId}), quantity = ${quantity}, with an unit price of ${unitPrice}, and total price of $${
          parseFloat(unitPrice.slice(1)) * quantity
        }`
      );
  } catch (error) {
    console.error(error);
    return res.status(500).send("There was an error");
  }
};

/*---ROUTES---*/
cartRouter.get("/", getCarts);
cartRouter.get("/:customerId", getCartByCustomer);
cartRouter.delete("/:customerId", deleteCartByCustomer);
cartRouter.post("/:customerId", postCartByCustomer);

/*---ROUTER EXPORT---*/
module.exports = cartRouter;
