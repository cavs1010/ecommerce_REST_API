/*---IMPORTS---*/
const express = require("express");
const productRouter = express.Router();
const db = require("../db");

/*---HELPERS---*/
const {
  checkIndexExists,
  validateProductId,
  retrieveInformationGivenId,
} = require("./helpers");

/*--- ROUTES' HELPERS---*/
// GET
const getProducts = (req, res, next) => {
  db.query(
    "SELECT category.name AS category_name, product.id AS product_id, product.name AS product_name, product.price_unit AS price_unit FROM product INNER JOIN category ON product.category_id = category.id;",
    (error, results) => {
      if (error) {
        console.error(error);
        return res.status(500).send("There was an error");
      }
      res.status(200).json(results.rows);
    }
  );
};

// POST
const postProduct = async (req, res, next) => {
  const { category_id, name, price_unit } = req.body;
  const categoryProductName = await retrieveInformationGivenId(
    "name",
    "category",
    "id",
    category_id
  );
  try {
    const results = await db.query(
      "INSERT INTO product (category_id, name, price_unit, create_date, update_date) VALUES ($1, $2, $3, now(), now()) RETURNING *;",
      [category_id, name, price_unit]
    );
    return res
      .status(201)
      .send(
        `The product ${results.rows[0].name} has been added under the category ${categoryProductName}, with ID: ${results.rows[0].id}.`
      );
  } catch (error) {
    console.error(error);
    return res.status(500).send("There was an error");
  }
};

// PUT
const putProduct = async (req, res, next) => {
  const productId = parseInt(req.params.productId);

  const { category_id, name, price_unit } = req.body;
  let query = "UPDATE product SET ";
  let values = [];
  let i = 1;
  if (category_id) {
    query += `category_id = $${i}, `;
    i += 1;
    values.push(category_id);
  }
  if (name) {
    query += `name = $${i}, `;
    i += 1;
    values.push(name);
  }
  if (price_unit) {
    query += ` price_unit = $${i}, `;
    i += 1;
    values.push(price_unit);
  }
  query = query.slice(0, -2);
  query += ` WHERE product.id = $${i};`;
  values.push(productId);

  try {
    await db.query(query, values);
    return res
      .status(200)
      .send(`The product with id = ${productId} was updated`);
  } catch (error) {
    console.error(error);
    return res.status(500).send("There was an error");
  }
};

// DELETE
const deleteProduct = async (req, res, next) => {
  const productId = parseInt(req.params.productId);

  try {
    await db.query("DELETE FROM product WHERE product.id = $1", [productId]);
    return res
      .status(200)
      .send(`The product with id = ${productId} has been deleted`);
  } catch (error) {
    console.error(error);
    return res.status(500).send("There was an error");
  }
};

const getIndProduct = async (req, res, next) => {
  const productId = parseInt(req.params.productId);

  try {
    const results = await db.query(
      "SELECT product.id, product.name, product.category_id, category.name AS category_name, product.price_unit, product.create_date, product.update_date FROM product INNER JOIN category ON product.category_id = category.id WHERE product.id = $1;",
      [productId]
    );
    return res.status(200).json(results.rows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).send("There was an error");
  }
};

/*---ROUTES---*/
productRouter.get("/", getProducts);
productRouter.post("/", postProduct);
productRouter.put("/:productId", validateProductId, putProduct);
productRouter.delete("/:productId", validateProductId, deleteProduct);
productRouter.get("/:productId", validateProductId, getIndProduct);

/*---ROUTER EXPORT---*/
module.exports = productRouter;
