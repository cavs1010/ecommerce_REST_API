/*---IMPORTS---*/
const express = require("express");
const productsRouter = express.Router();

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

/*---CONNECTIONS---*/
const getProduct = (req, res, next) => {
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
        `The product ${name} has been added under the category ${categoryProductName}, with ID: ${results.rows[0].id}.`
      );
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "There was an error" });
  }
};

const putProduct = async (req, res, next) => {
  const productId = parseInt(req.params.id);
  const { category_id, name, price_unit } = req.body;
  try {
    await db.query(
      "UPDATE product SET category_id = $1, name = $2, price_unit = $3, update_date = now() WHERE id = $4",
      [category_id, name, price_unit, productId]
    );
    let categoryProductName = await retrieveCategoryName(category_id);
    return res
      .status(200)
      .send(
        `The product with id = ${productId} was updated with a new category ${categoryProductName} (id = ${category_id}), name = ${name}, and price per unit = $${price_unit}`
      );
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "There was an error" });
  }
};

/*---ROUTES---*/
productsRouter.get("/", getProduct);
productsRouter.post("/", postProduct);
productsRouter.put("/:id", putProduct);

module.exports = productsRouter;