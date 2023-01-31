/*---IMPORTS---*/
const { response } = require("../app");
const db = require("../db");

/*---HELPERS---*/

const retrieveInformationGivenId = async (
  columnRetrieved,
  tableName,
  columnToFilter,
  valueFiltered
) => {
  try {
    let results = await db.query(
      `SELECT ${columnRetrieved} FROM ${tableName} WHERE ${columnToFilter}` +
        " = $1",
      [valueFiltered]
    );
    return results.rows[0][columnRetrieved];
  } catch (error) {
    console.error(error);
    return;
  }
};

const checkIndexExists = async (tableName, indexToCheck) => {
  let errorMessage = "";
  try {
    const { rows } = await db.query(
      `SELECT * FROM ${tableName} ` + "WHERE id = $1;",
      [indexToCheck]
    );
    if (!rows.length) {
      errorMessage = `The id ${indexToCheck} does not exist in table ${tableName}`;
      return errorMessage;
    }
  } catch (error) {
    console.log(error);
    errorMessage = "There was an error";
    return errorMessage;
  }
};

const validateCustomerId = async (req, res, next) => {
  const customerId = parseInt(req.params.customerId);
  const customerNotExist = await checkIndexExists("customer", customerId);
  if (customerNotExist) {
    console.log(customerNotExist);
    return res.status(404).send({ error: customerNotExist });
  }
  next();
};

const validateProductId = async (req, res, next) => {
  const productId = parseInt(req.params.productId);
  const productNoExist = await checkIndexExists("product", productId);
  if (productNoExist) {
    console.log(productNoExist);
    return res.status(404).send({ error: productNoExist });
  }
  next();
};

const validateCart_ProductId = async (req, res, next) => {
  const cartProductId = parseInt(req.params.cartProductId);
  const cartProductNoExist = await checkIndexExists(
    "cart_product",
    cartProductId
  );
  if (cartProductNoExist) {
    console.log(cartProductNoExist);
    return res.status(404).send({ error: cartProductNoExist });
  }
  next();
};

const validateOrderIdGivenCustomerID = async (req, res, next) => {
  const customerId = parseInt(req.params.customerId);
  const orderId = parseInt(req.params.orderId);
  const response = await db.query(
    "SELECT * FROM previous_order WHERE customer_id = $1 AND id = $2;",
    [customerId, orderId]
  );
  if (!response.rows.length) {
    console.log(
      `The order with id ${orderId} doesn't exist for customer with id ${customerId}`
    );
    return res.status(404).send({ error: "There was an error" });
  }
  next();
};

const validateProductIdGivenCustomerIDAndOrderId = async (req, res, next) => {
  const customerId = parseInt(req.params.customerId);
  const orderId = parseInt(req.params.orderId);
  const orderProductId = parseInt(req.params.orderProductId);
  const response = await db.query(
    "SELECT order_product.id AS order_product_id, order_product.order_id AS order_id, previous_order.customer_id AS customer_id FROM order_product INNER JOIN previous_order ON previous_order.id = order_product.order_id WHERE order_product.id = $1 AND order_product.order_id = $2 AND previous_order.customer_id = $3;",
    [orderProductId, orderId, customerId]
  );
  if (!response.rows.length) {
    console.log(
      `The order_product_id ${orderProductId} doesn't exist for order ${orderId} and customer ${customerId}`
    );
    return res.status(404).send({ error: "There was an error" });
  }
  next();
};

const checkThatEmailDoesNotExist = async (req, res, next) => {
  const userEmail = req.body.email;
  const checkEmail = await db.query(
    "SELECT * FROM customer WHERE email = $1;",
    [userEmail]
  );
  if (checkEmail.rows.length != 0) {
    return res.status(400).send({ error: "Email already exist" });
  }
  next();
};

/*---EXPORTS---*/
const helpers = {
  validateCustomerId,
  validateProductId,
  validateCart_ProductId,
  retrieveInformationGivenId,
  checkIndexExists,
  validateOrderIdGivenCustomerID,
  validateProductIdGivenCustomerIDAndOrderId,
  checkThatEmailDoesNotExist,
};
module.exports = helpers;
