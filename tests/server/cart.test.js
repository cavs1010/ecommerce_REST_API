const { assert } = require("chai");
const request = require("supertest");
const app = require("../../app");
const db = require("../../db");

beforeEach(async () => {
  await db.query("BEGIN;");
});

afterEach(async () => {
  await db.query("ROLLBACK");
});

describe("GET /cart", () => {
  it("Retrieves a list of carts", async () => {
    const res = await request(app).get("/cart");
    assert.equal(res.status, 200);
    assert.isArray(res.body);
    const expected = await db.query(
      "SELECT cart_product.cart_id AS cart_id, customer.id AS customer_id, customer.email AS customer_email, cart.last_modified AS cart_last_modified, SUM(product.price_unit * cart_product.quantity) AS total_value FROM cart_product INNER JOIN product ON cart_product.product_id = product.id INNER JOIN cart ON cart.id = cart_product.cart_id INNER JOIN customer ON cart.customer_id = customer.id GROUP BY (cart_product.cart_id, customer.id, customer.email, cart.last_modified) ORDER BY cart_id;"
    );
    const cart = expected.rows;
  });
});

describe("PUT /cart/:customerId/:cartProductId", () => {
  const expectedQuantityValue = 10;
  it("Updates a product in a certain cart", async () => {
    const res = await request(app)
      .put("/cart/45/34")
      .send({ quantity: expectedQuantityValue });
    assert.equal(res.status, 200);
    assert.equal(
      res.text,
      `The quantity of Shoes in the cart id = 11 has been updated to ${expectedQuantityValue}`
    );
    const realValue = await db.query(
      "SELECT quantity FROM cart_product WHERE id = 34 "
    );
    assert.equal(realValue.rows[0].quantity, expectedQuantityValue);
  });
  it("Doesn't update because the customer Id doesnt exist in the database", async () => {
    const res = await request(app)
      .put("/cart/9999/45")
      .send({ quantity: expectedQuantityValue });
    assert.equal(res.status, 404);
  });
  it("Doesn't update because the cart_product Id doesn't exist in the database", async () => {
    const res = await request(app)
      .put("/cart/45/9999")
      .send({ quantity: expectedQuantityValue });
    assert.equal(res.status, 404);
  });
});

describe("DELETE /cart/:customerId/:cartProductId", () => {
  const customerId = 45;
  const cartProductId = 34;
  it("A product in a certain cart has been successfully deleted", async () => {
    const res = await request(app).delete(
      `/cart/${customerId}/${cartProductId}`
    );
    assert.equal(res.status, 200);
    assert.equal(
      res.text,
      `The cart product with id = ${cartProductId} was deleted from customer with id = ${customerId}.`
    );
  });
  it("A product in a certain cart was not added because the customerId is not in the database", async () => {
    const res = await request(app).delete(`/cart/9999/${cartProductId}`);
    assert.equal(res.status, 404);
  });
  it("A product in a certain cart was not deleted because the cartProductId did'nt exist", async () => {
    const res = await request(app).delete(`/cart/${customerId}/9999`);
    assert.equal(res.status, 404);
  });
});
