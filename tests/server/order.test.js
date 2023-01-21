const { assert, expect } = require("chai");
const request = require("supertest");
const app = require("../../app");
const db = require("../../db");

const {
  checkIndexExists,
  retrieveInformationGivenId,
} = require("../../routes/helpers");

beforeEach(async () => {
  await db.query("BEGIN;");
});

afterEach(async () => {
  await db.query("ROLLBACK");
});

describe("GET /order", () => {
  it("Returns all existing orders in the database. ", async () => {
    const res = await request(app).get("/order");
    assert.equal(res.status, 200);
    assert.isArray(res.body);
    const expected = await db.query(
      "WITH order_total_price AS(SELECT order_product.order_id AS order_id, SUM(product.price_unit * order_product.quantity) AS total_price FROM order_product INNER JOIN product ON product.id = order_product.product_id GROUP BY order_id) SELECT previous_order.id AS order_id, customer.email AS email, previous_order.date_purchase AS date_purchase, previous_order.status AS status, order_total_price.total_price AS total_paid, previous_order.shipping_address AS shipping_address FROM previous_order INNER JOIN customer ON customer.id = previous_order.customer_id INNER JOIN order_total_price ON order_total_price.order_id = previous_order.id;"
    );
    const expected_orders = expected.rows.map((order) => {
      return {
        order_id: order.order_id,
        email: order.email,
        date_purchase: order.date_purchase.toISOString(),
        status: order.status,
        total_paid: order.total_paid,
        shipping_address: order.shipping_address,
      };
    });
    assert.deepEqual(res.body, expected_orders);
  });
});

describe("GET /order/:customerId", async () => {
  it("Returns all the orders from certain customer", async () => {
    const customerId = 26;
    const res = await request(app).get(`/order/${customerId}`);
    assert.equal(res.status, 200);
    assert.isArray(res.body);
    const expected = await db.query(
      `WITH order_total_price AS (SELECT order_product.order_id AS order_id, SUM(order_product.quantity * product.price_unit) AS total_price FROM order_product INNER JOIN product on product.id = order_product.product_id GROUP BY order_product.order_id) SELECT  previous_order.id AS order_id, previous_order.date_purchase AS date_purchase, previous_order.status AS status, order_total_price.total_price AS total_paid, previous_order.shipping_address AS shipping_address FROM previous_order INNER JOIN order_total_price ON order_total_price.order_id = previous_order.id WHERE previous_order.customer_id = ${customerId};`
    );
    const expected_orders = expected.rows.map((order) => {
      return {
        order_id: order.order_id,
        date_purchase: order.date_purchase.toISOString(),
        status: order.status,
        total_paid: order.total_paid,
        shipping_address: order.shipping_address,
      };
    });
    assert.deepEqual(res.body, expected_orders);
  });

  it("Doesn't retrieve order from the customer because the customer doesn't exist in the database", async () => {
    const customerId = 9999;
    const res = await request(app).get(`/order/${customerId}`);
    assert.equal(res.status, 404);
  });
});

describe("GET /order/:customerId/:orderId", async () => {
  it("Returns the objects in a certain order for a certain customer", async () => {
    const customerId = 26;
    const orderId = 8;
    const res = await request(app).get(`/order/${customerId}/${orderId}`);
    assert.equal(res.status, 200);
    assert.isArray(res.body);
    const expected = await db.query(
      `SELECT order_product.product_id AS product_id, product.name AS product_name, order_product.quantity AS quantity, product.price_unit AS unit_price, (product.price_unit * order_product.quantity) AS total_price FROM order_product INNER JOIN previous_order ON previous_order.id = order_product.order_id INNER JOIN product ON product.id = order_product.product_id WHERE previous_order.customer_id = ${customerId} AND order_product.order_id = ${orderId};`
    );
    assert.deepEqual(res.body, expected.rows);
  });
  it("Do not return the products in certain order because the customer does'nt exist", async () => {
    const customerId = 9999;
    const orderId = 8;
    const res = await request(app).get(`/order/${customerId}/${orderId}`);
    assert.equal(res.status, 404);
  });
  it("Do not return the products in a certain order because this product does'nt exist in this order", async () => {
    const customerId = 23;
    const orderId = 10;
    const res = await request(app).get(`/order/${customerId}/${orderId}`);
    assert.equal(res.status, 404);
  });
});

describe("DELETE /order/:customerId/:orderId", async () => {
  it("Deletes an order from a certain customer", async () => {
    const customerId = 22;
    const orderId = 2;
    const customerEmail = await retrieveInformationGivenId(
      "email",
      "customer",
      "id",
      customerId
    );
    const res = await request(app).delete(`/order/${customerId}/${orderId}`);
    assert.equal(res.status, 200);
    const checkingDeletion = await checkIndexExists("previous_order", orderId);
    assert.equal(
      checkingDeletion,
      `The id ${orderId} does not exist in table previous_order`
    );
    assert.equal(
      res.text,
      `The order with id ${orderId}, from customer ${customerEmail}, has been eliminated.`
    );
  });
  it("Do not delete the order in certain customer because the customer does'nt exist", async () => {
    const customerId = 9999;
    const orderId = 8;
    const res = await request(app).delete(`/order/${customerId}/${orderId}`);
    assert.equal(res.status, 404);
  });
  it("Do not delete an order because this order does'nt exist in certain customer", async () => {
    const customerId = 23;
    const orderId = 10;
    const res = await request(app).get(`/order/${customerId}/${orderId}`);
    assert.equal(res.status, 404);
  });
});

describe("PUT /order/:customerId/orderId", async () => {
  it("Updates the status of certain order", async () => {
    const customerId = 23;
    const orderId = 3;
    const email = await retrieveInformationGivenId(
      "email",
      "customer",
      "id",
      customerId
    );
    const res = await request(app)
      .put(`/order/${customerId}/${orderId}`)
      .send({ status: "complete", address: 10 });
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.rowUpdated.rows[0].id, orderId);
    assert.deepEqual(res.body.rowUpdated.rows[0].shipping_address, 10);
    assert.deepEqual(res.body.rowUpdated.rows[0].status, "complete");
    assert.deepEqual(
      res.body.message,
      `The status and address of order ${orderId} from customer ${email} has been updated.`
    );
  });
  it("Given that status was empty, it will only update shipping address", async () => {
    const customerId = 23;
    const orderId = 3;
    const res = await request(app)
      .put(`/order/${customerId}/${orderId}`)
      .send({ address: 10 });
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.rowUpdated.rows[0].shipping_address, 10);
    assert.deepEqual(res.body.rowUpdated.rows[0].status, "deleted");
  });
  it("Given that address was empty, it will only update the status", async () => {
    const customerId = 23;
    const orderId = 3;
    const res = await request(app)
      .put(`/order/${customerId}/${orderId}`)
      .send({ status: "complete" });
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.rowUpdated.rows[0].shipping_address, 3);
    assert.deepEqual(res.body.rowUpdated.rows[0].status, "complete");
  });
  it("It doesn't updates the order of a customer because the customer doesn't exists", async () => {
    const customerId = 9999;
    const orderId = 3;
    const res = await request(app)
      .put(`/order/${customerId}/${orderId}`)
      .send({ address: 10 });
    assert.equal(res.status, 404);
  });
  it("It doesn't updates the order because the order doesn't exist", async () => {
    const customerId = 23;
    const orderId = 99999;
    const res = await request(app)
      .put(`/order/${customerId}/${orderId}`)
      .send({ address: 10 });
    assert.equal(res.status, 404);
  });
});

describe("DELETE order/:customerId/:orderId/:orderProductId", async () => {
  it("Deletes a product from certain customer and certain order given a orderProduct Id", async () => {
    const customerId = 24;
    const customerEmail = await retrieveInformationGivenId(
      "email",
      "customer",
      "id",
      customerId
    );
    const orderId = 4;
    const orderProductId = 21;
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
    const res = await request(app).delete(
      `/order/${customerId}/${orderId}/${orderProductId}`
    );
    assert.equal(res.status, 200);
    assert.equal(res.body.rowEliminated.rows[0].id, orderProductId);
    assert.equal(
      res.body.message,
      `The item ${productName} (id = ${productId}), from order ${4}, from customer ${customerEmail} has been eliminated.`
    );
  });
  it("The customer does'nt exist", async () => {
    const customerId = 9999;
    const orderId = 4;
    const orderProductId = 21;
    const res = await request(app).delete(
      `/order/${customerId}/${orderId}/${orderProductId}`
    );
    assert.equal(res.status, 404);
  });
  it("The order doesnt exist for a given customer id", async () => {
    const customerId = 24;
    const orderId = 9999;
    const orderProductId = 21;
    const res = await request(app).delete(
      `/order/${customerId}/${orderId}/${orderProductId}`
    );
    assert.equal(res.status, 404);
  });
  it("The orderProductId doesn't exist", async () => {
    const customerId = 24;
    const orderId = 4;
    const orderProductId = 9999;
    const res = await request(app).delete(
      `/order/${customerId}/${orderId}/${orderProductId}`
    );
    assert.equal(res.status, 404);
  });
});

describe("PUT order/:customerId/:orderId/:orderProductId", async () => {
  it("It correctly updates the quantity of a certain  product in a certain order and for a certain customer.", async () => {
    const customerId = 24;
    const customerEmail = await retrieveInformationGivenId(
      "email",
      "customer",
      "id",
      customerId
    );
    const orderId = 4;
    const orderProductId = 21;
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
    const newQuantity = 11;
    const res = await request(app)
      .put(`/order/${customerId}/${orderId}/${orderProductId}`)
      .send({ newQuantity: newQuantity });
    assert.equal(res.status, 200);
    assert.equal(res.body.rowUpdated.quantity, newQuantity);
    assert.equal(
      res.body.message,
      `The quantity of product ${productName} on order ${orderId} from customer ${customerEmail} has been updated to ${newQuantity}.`
    );
  });
  it("It doesnt update a product quantity because the customer doesn't exists", async () => {
    const customerId = 9999;
    const orderId = 4;
    const orderProductId = 21;
    const newQuantity = 10;
    const res = await request(app)
      .put(`/order/${customerId}/${orderId}/${orderProductId}`)
      .send({ newQuantity: newQuantity });
    assert.equal(res.status, 404);
  });
  it("It doesn't update a product quantity because the orderId doesn't exist", async () => {
    const customerId = 24;
    const orderId = 999;
    const orderProductId = 21;
    const newQuantity = 10;
    const res = await request(app)
      .put(`/order/${customerId}/${orderId}/${orderProductId}`)
      .send({ newQuantity: newQuantity });
    assert.equal(res.status, 404);
  });
  it("It doesn't update a product because the orderProductId doesn't exist fro certain order", async () => {
    const customerId = 24;
    const orderId = 4;
    const orderProductId = 9999;
    const newQuantity = 10;
    const res = await request(app)
      .put(`/order/${customerId}/${orderId}/${orderProductId}`)
      .send({ newQuantity: newQuantity });
    assert.equal(res.status, 404);
  });
  it("It doesn't update a product quantity because the neq quantity specified is negative or zero", async () => {});
});
