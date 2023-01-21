const { assert } = require("chai");
const request = require("supertest");
const app = require("../../app");
const db = require("../../db");

beforeEach(async () => {
  await db.query("BEGIN;");
});
afterEach(async () => {
  await db.query("ROLLBACK;");
});

describe("GET /product", () => {
  it("Retrieves a list of products", async () => {
    const res = await request(app).get("/product");
    assert.equal(res.status, 200);
    assert.isArray(res.body);

    const result = await db.query(
      "SELECT category.name AS category_name, product.id AS product_id, product.name AS product_name, product.price_unit AS price_unit FROM product INNER JOIN category ON product.category_id = category.id;"
    );
    const products = result.rows;
    assert.deepEqual(res.body, products);
  });
});

describe("POST /product", () => {
  it("Post a new product in the database", async () => {
    const res = await request(app)
      .post("/product")
      .send({ category_id: 2, name: "TestObject92", price_unit: 155 });
  });
});
