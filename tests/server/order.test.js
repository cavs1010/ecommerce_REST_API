const { assert, expect } = require("chai");
const request = require("supertest");
const app = require("../../app");
const db = require("../../db");

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
    const expected = await db.query("SELECT * FROM previous_order;");
    const expected_orders = expected.rows.map((order) => {
      return {
        id: order.id,
        customer_id: order.customer_id,
        date_purchase: order.date_purchase.toISOString(),
        status: order.status,
        shipping_address: order.shipping_address,
      };
    });
    assert.deepEqual(res.body, expected_orders);
  });
});
