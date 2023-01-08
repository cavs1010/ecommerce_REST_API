/*---IMPORTS---*/
const express = require("express");
const productRouter = express.Router();

const db = require("../db");

/*---HELPERS---*/
const retrieveCategoryName = async (category_id) => {
  try {
    let categoryProduct = await db.query(
      "SELECT category.name FROM category WHERE category.id = $1;",
      [category_id]
    );
    return categoryProduct.rows[0].name;
  } catch (error) {
    console.error(error);
    return error;
  }
};

const checkProductExists = async (productId) => {
  let errorMessage = "";
  try {
    const { rows } = await db.query("SELECT * FROM product WHERE id = $1;", [
      productId,
    ]);
    if (!rows.length) {
      errorMessage = `The product with id ${productId} does not exist`;
      return errorMessage;
    }
  } catch (error) {
    errorMessage = "There was an error";
    return errorMessage;
  }
};

/*--- ROUTES' HELPERS---*/
const getProducts = (req, res, next) => {
  db.query(
    "SELECT category.name AS category_name, product.id AS product_id, product.name AS product_name, product.price_unit AS price_unit FROM product INNER JOIN category ON product.category_id = category.id;",
    (error, results) => {
      if (error) {
        throw error;
      }
      res.status(200).json(results.rows);
    }
  );
};

const postProduct = async (req, res, next) => {
  const { category_id, name, price_unit } = req.body;
  try {
    const results = await db.query(
      "INSERT INTO product (category_id, name, price_unit, create_date, update_date) VALUES ($1, $2, $3, now(), now()) RETURNING *;",
      [category_id, name, price_unit]
    );
    let categoryProductName = await retrieveCategoryName(category_id);
    return res
      .status(201)
      .send(
        `The product ${results.rows[0].name} has been added under the category ${categoryProductName}, with ID: ${results.rows[0].id}.`
      );
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "There was an error" });
  }
};

const putProduct = async (req, res, next) => {
  const productId = parseInt(req.params.productId);
  const productNoExist = await checkProductExists(productId, res);
  if (productNoExist) {
    console.log(productNoExist);
    return res.status(400).send({ error: productNoExist });
  }

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
    let categoryProductName = await retrieveCategoryName(category_id);
    return res
      .status(200)
      .send(`The product with id = ${productId} was updated`);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "There was an error" });
  }
};

const deleteProduct = async (req, res, next) => {
  const productId = parseInt(req.params.productId);
  const productNoExist = await checkProductExists(productId, res);
  if (productNoExist) {
    console.log(productNoExist);
    return res.status(400).send({ error: productNoExist });
  }

  try {
    await db.query("DELETE FROM product WHERE product.id = $1", [productId]);
    return res
      .status(200)
      .send(`The product with id = ${productId} has been deleted`);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "There was an error" });
  }
};

const getIndProduct = async (req, res, next) => {
  const productId = parseInt(req.params.productId);
  const productNoExist = await checkProductExists(productId, res);
  if (productNoExist) {
    console.log(productNoExist);
    return res.status(400).send({ error: productNoExist });
  }

  try {
    const results = await db.query(
      "SELECT product.id, product.name, product.category_id, category.name AS category_name, product.price_unit, product.create_date, product.update_date FROM product INNER JOIN category ON product.category_id = category.id WHERE product.id = $1;",
      [productId]
    );
    return res.status(200).json(results.rows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "There was an error" });
  }
};

/*---ROUTES---*/
productRouter.get("/", getProducts);
productRouter.post("/", postProduct);
productRouter.put("/:productId", putProduct);
productRouter.delete("/:productId", deleteProduct);
productRouter.get("/:productId", getIndProduct);

/*---ROUTER EXPORT---*/
module.exports = productRouter;
