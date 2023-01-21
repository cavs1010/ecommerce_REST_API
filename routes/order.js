/*---IMPORTS---*/
const { assert } = require("chai");
const express = require("express");
const { get } = require("../app");
const orderRouter = express.Router();
const db = require("../db");

//Helpers
const {
  validateCustomerId,
  validateOrderIdGivenCustomerID,
  retrieveInformationGivenId,
  validateProductIdGivenCustomerIDAndOrderId,
} = require("./helpers");

/*--- ROUTES' HELPERS---*/
// GET
const getOrders = async (req, res, next) => {
  try {
    const results = await db.query(
      "WITH order_total_price AS(SELECT order_product.order_id AS order_id, SUM(product.price_unit * order_product.quantity) AS total_price FROM order_product INNER JOIN product ON product.id = order_product.product_id GROUP BY order_id) SELECT previous_order.id AS order_id, customer.email AS email, previous_order.date_purchase AS date_purchase, previous_order.status AS status, order_total_price.total_price AS total_paid, previous_order.shipping_address AS shipping_address FROM previous_order INNER JOIN customer ON customer.id = previous_order.customer_id INNER JOIN order_total_price ON order_total_price.order_id = previous_order.id;"
    );
    return res.status(200).json(results.rows);
  } catch (error) {
    console.log(error);
    return res.status(500).send("There was an error");
  }
};

const getOrdersByCustomerId = async (req, res, next) => {
  const customerId = parseInt(req.params.customerId);
  try {
    const results = await db.query(
      "WITH order_total_price AS (SELECT order_product.order_id AS order_id, SUM(order_product.quantity * product.price_unit) AS total_price FROM order_product INNER JOIN product on product.id = order_product.product_id GROUP BY order_product.order_id) SELECT  previous_order.id AS order_id, previous_order.date_purchase AS date_purchase, previous_order.status AS status, order_total_price.total_price AS total_paid, previous_order.shipping_address AS shipping_address FROM previous_order INNER JOIN order_total_price ON order_total_price.order_id = previous_order.id WHERE previous_order.customer_id = $1;",
      [customerId]
    );
    return res.status(200).json(results.rows);
  } catch (error) {
    console.log(error);
    return res.status(500).send("There was an error");
  }
};

const getProductsByOrderIdAndCustomerId = async (req, res, next) => {
  const customerId = parseInt(req.params.customerId);
  const orderId = parseInt(req.params.orderId);
  try {
    const results = await db.query(
      "SELECT order_product.product_id AS product_id, product.name AS product_name, order_product.quantity AS quantity, product.price_unit AS unit_price, (product.price_unit * order_product.quantity) AS total_price FROM order_product INNER JOIN previous_order ON previous_order.id = order_product.order_id INNER JOIN product ON product.id = order_product.product_id WHERE previous_order.customer_id = $1 AND order_product.order_id = $2;",
      [customerId, orderId]
    );
    return res.status(200).json(results.rows);
  } catch (error) {
    console.log(error);
    return res.status(500).json("There was an error");
  }
};

const deleteOrderByOrderIdAndCustomerId = async (req, res, next) => {
  const customerId = parseInt(req.params.customerId);
  const orderId = parseInt(req.params.orderId);
  const customerEmail = await retrieveInformationGivenId(
    "email",
    "customer",
    "id",
    customerId
  );
  try {
    let response = await db.query(
      "DELETE FROM previous_order WHERE id = $1 AND customer_id = $2",
      [orderId, customerId]
    );
    return res
      .status(200)
      .send(
        `The order with id ${orderId}, from customer ${customerEmail}, has been eliminated.`
      );
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send("There was an error while deleting an order of a certain customer");
  }
};

const updateOrderByOrderIdAndCustomerId = async (req, res, next) => {
  const customerId = parseInt(req.params.customerId);
  const orderId = parseInt(req.params.orderId);
  const email = await retrieveInformationGivenId(
    "email",
    "customer",
    "id",
    customerId
  );
  const { status, address } = req.body;
  let query = "UPDATE previous_order SET ";
  let values = [];
  let i = 1;
  if (status) {
    query += `status = $${i}, `;
    i += 1;
    values.push(status);
  }
  if (address) {
    query += `shipping_address = $${i}, `;
    i += 1;
    values.push(address);
  }
  query = query.slice(0, -2);
  query += ` WHERE previous_order.id = $${i} RETURNING *`;
  values.push(orderId);
  try {
    const data = await db.query(query, values);
    const response = {
      message: `The status and address of order ${orderId} from customer ${email} has been updated.`,
      rowUpdated: data,
    };
    return res.status(200).json(response);
  } catch (error) {
    console.log(error);
    return res.status(500).send("There was an error");
  }
};

const deleteProductFromOrderFromCustomer = async (req, res, next) => {
  const customerId = parseInt(req.params.customerId);
  const customerEmail = await retrieveInformationGivenId(
    "email",
    "customer",
    "id",
    customerId
  );
  const orderId = parseInt(req.params.orderId);
  const orderProductId = parseInt(req.params.orderProductId);
  const productId = await retrieveInformationGivenId(
    "product_id",
    "order_product",
    "id",
    orderProductId
  );
  const productName = await retrieveInformationGivenId(
    "name",
    "product",
    "id",
    productId
  );
  try {
    const data = await db.query(
      "DELETE FROM order_product WHERE order_id = $1 AND id = $2 RETURNING *",
      [orderId, orderProductId]
    );
    const response = {
      message: `The item ${productName} (id = ${productId}), from order ${4}, from customer ${customerEmail} has been eliminated.`,
      rowEliminated: data,
    };
    return res.status(200).json(response);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .send("There was an error while deleting the product from certain order");
  }
};

const updateProductInOrderForCustomer = async (req, res, send) => {
  const customerId = parseInt(req.params.customerId);
  const customerEmail = await retrieveInformationGivenId(
    "email",
    "customer",
    "id",
    customerId
  );
  const orderId = parseInt(req.params.orderId);
  const orderProductId = parseInt(req.params.orderProductId);
  const { newQuantity } = req.body;
  const productId = await retrieveInformationGivenId(
    "product_id",
    "order_product",
    "id",
    orderProductId
  );
  const productName = await retrieveInformationGivenId(
    "name",
    "product",
    "id",
    productId
  );
  try {
    let response = await db.query(
      "UPDATE order_product SET quantity = $1 WHERE id = $2 AND order_id = $3 RETURNING *",
      [newQuantity, orderProductId, orderId]
    );
    const reply = {
      message: `The quantity of product ${productName} on order ${orderId} from customer ${customerEmail} has been updated to ${newQuantity}.`,
      rowUpdated: response.rows[0],
    };
    return res.status(200).json(reply);
  } catch (error) {
    console.log(error);
    return res.status(500).send("There was an error");
  }
};

/*---ROUTES---*/
orderRouter.get("/", getOrders);
orderRouter.get(
  "/:customerId/:orderId",
  validateCustomerId,
  validateOrderIdGivenCustomerID,
  getProductsByOrderIdAndCustomerId
);
orderRouter.get("/:customerId", validateCustomerId, getOrdersByCustomerId);
orderRouter.delete(
  "/:customerId/:orderId/:orderProductId",
  validateCustomerId,
  validateOrderIdGivenCustomerID,
  validateProductIdGivenCustomerIDAndOrderId,
  deleteProductFromOrderFromCustomer
);
orderRouter.delete(
  "/:customerId/:orderId",
  validateCustomerId,
  deleteOrderByOrderIdAndCustomerId
);
orderRouter.put(
  "/:customerId/:orderId/:orderProductId",
  validateCustomerId,
  validateOrderIdGivenCustomerID,
  validateProductIdGivenCustomerIDAndOrderId,
  updateProductInOrderForCustomer
);
orderRouter.put(
  "/:customerId/:orderId",
  validateCustomerId,
  validateOrderIdGivenCustomerID,
  updateOrderByOrderIdAndCustomerId
);

/*---ROUTER EXPORT---*/
module.exports = orderRouter;
