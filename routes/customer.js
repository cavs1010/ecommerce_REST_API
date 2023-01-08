/*---IMPORTS---*/
const express = require("express");
const customerRouter = express.Router();

const db = require("../db");

/*---HELPERS---*/
const checkCustomerExists = async (customerId) => {
  let errorMessage = "";
  try {
    const { rows } = await db.query("SELECT * FROM customer WHERE id = $1;", [
      customerId,
    ]);
    if (!rows.length) {
      errorMessage = `The customer with id ${customerId} does not exist`;
      return errorMessage;
    }
  } catch (error) {
    console.log(error);
    errorMessage = "There was an error";
    return errorMessage;
  }
};

/*--- ROUTES' HELPERS---*/
const getCostumers = (req, res, next) => {
  db.query(
    "SELECT customer.id AS id, customer.email AS email, customer.first_name AS first_name, customer.last_name AS last_name FROM customer;",
    (error, results) => {
      if (error) {
        throw error;
      }
      res.status(200).json(results.rows);
    }
  );
};

const postCustomer = async (req, res, next) => {
  const { email, password, first_name, last_name, address_id } = req.body;
  try {
    const results = await db.query(
      "INSERT INTO customer (email, password, first_name, last_name, address_id) VALUES ($1, $2, $3, $4, $5) RETURNING *;",
      [email, password, first_name, last_name, address_id]
    );
    return res
      .status(201)
      .send(
        `The user ${results.rows[0].first_name} ${results.rows[0].last_name} (${results.rows[0].email}) has been created with ID: ${results.rows[0].id}.`
      );
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "There was an error" });
  }
};

const putCustomer = async (req, res, next) => {
  const customerId = parseInt(req.params.customerId);
  const customerNotExist = await checkCustomerExists(customerId);
  if (customerNotExist) {
    console.log(customerNotExist);
    return res.status(400).send({ error: customerNotExist });
  }

  const { email, password, first_name, last_name, address_id } = req.body;
  let query = "UPDATE customer SET ";
  let values = [];
  let i = 1;
  if (email) {
    query += `email = $${i}, `;
    i += 1;
    values.push(email);
  }
  if (password) {
    query += `password = $${i}, `;
    i += 1;
    values.push(password);
  }
  if (first_name) {
    query += `first_name = $${i}, `;
    i += 1;
    values.push(first_name);
  }
  if (last_name) {
    query += `last_name = $${i}, `;
    i += 1;
    values.push(last_name);
  }
  if (address_id) {
    query += `address_id = $${i}, `;
    i += 1;
    values.push(address_id);
  }
  query = query.slice(0, -2);
  query += ` WHERE customer.id = $${i};`;
  values.push(customerId);

  try {
    await db.query(query, values);
    return res
      .status(200)
      .send(`The user with id ${customerId} has been updated`);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json("There was an error during the update of the user");
  }
};

/*---ROUTES---*/
customerRouter.get("/", getCostumers);
customerRouter.post("/", postCustomer);
customerRouter.put("/:customerId", putCustomer);

/*---ROUTER EXPORT---*/
module.exports = customerRouter;
