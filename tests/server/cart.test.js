const { assert } = require("chai");
const request = require("supertest");
const app = require("../../app");
const db = require("../../db");
const { retrieveInformationGivenId } = require("../../routes/helpers");

beforeEach(async () => {
  await db.query("BEGIN;");
});

afterEach(async () => {
  await db.query("ROLLBACK");
  await db.query(
    "SELECT SETVAL('previous_order_id_seq',  (SELECT MAX(id) FROM previous_order));"
  );
  await db.query(
    "SELECT SETVAL('cart_product_id_seq',  (SELECT MAX(id) FROM cart_product));"
  );
  await db.query(
    "SELECT SETVAL('order_product_id_seq',  (SELECT MAX(id) FROM order_product));"
  );
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
  const customerId = 26;
  const cartProductId = 29;
  it("Updates a product in a certain cart", async () => {
    const res = await request(app)
      .put(`/cart/${customerId}/${cartProductId}`)
      .send({ quantity: expectedQuantityValue });
    assert.equal(res.status, 200);
    assert.equal(
      res.text,
      `The quantity of Table in the cart id = 6 has been updated to ${expectedQuantityValue}`
    );
    const realValue = await db.query(
      "SELECT quantity FROM cart_product WHERE id = $1 ",
      [cartProductId]
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
  const customerId = 26;
  const cartProductId = 29;
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

describe("POST /cart/:customerId/checkout", async () => {
  const correctCustomerId = 45;
  const cartId = 11;
  const numberProduct = 2;
  const customerEmail = "cavs1010@gmail.com";
  let res;
  let newOrderId;

  beforeEach(async () => {
    res = await request(app).post(`/cart/${correctCustomerId}/checkout`);
  });

  it("A cart has been successfully checked out", async () => {
    assert.equal(res.status, 200);
    assert.equal(
      res.text,
      `The cart with id ${cartId}, for customer (${customerEmail}) has been checked out.`
    );
  });
  it("The cart has become an order", async () => {
    const order_created = await db.query(
      "SELECT * FROM previous_order ORDER BY id DESC LIMIT 1"
    );
    newOrderId = order_created.rows[0].id;

    assert.equal(order_created.rows[0].customer_id, correctCustomerId);
    assert.equal(order_created.rows[0].status, "pending");
  });
  it("The items associated to cartId have been eliminated from table cart_product", async () => {
    const items_cart_product = await db.query(
      "SELECT * FROM cart_product WHERE cart_id = $1",
      [cartId]
    );
    assert.equal(items_cart_product.rows.length, 0);
  });
  it("Products have been correctly added to the associated order", async () => {
    const products_order = await db.query(
      "SELECT * FROM order_product WHERE order_id = $1",
      [newOrderId]
    );
    assert.equal(products_order.rows.length, 2);
  });
});

describe("POST /cart/:customerId/checkout -> POSSIBLE ERRORS", async () => {
  it("If the car has no product, it should'nt do anything", async () => {
    const customerIdNoProducts = 21;
    res = await request(app).post(`/cart/${customerIdNoProducts}/checkout`);
    assert.equal(res.status, 400);
    assert.equal(res.text, "The cart cannot do checkout because is empty");
  });
  it("The customer doesn't exist", async () => {
    const customerId = 999;
    res = await request(app).post(`/cart/${customerId}/checkout`);
    assert.equal(res.status, 404);
  });
});
