const { assert } = require("chai");
const request = require("supertest");
const app = require("../../app");
const db = require("../../db");
const retrieveInformationGivenId = require("../../routes/helpers");

beforeEach(async () => {
  await db.query("BEGIN;");
});

afterEach(async () => {
  await db.query("ROLLBACK;");
  await db.query(
    "SELECT SETVAL('customer_id_seq',  (SELECT MAX(id) FROM customer));"
  );
});

describe("GET /customer", () => {
  it("Retrieve a list of all the customers", async () => {
    const res = await request(app).get("/customer");
    assert.equal(res.status, 200);
    assert.isArray(res.body);
  });
});

describe("POST /customer/register", () => {
  const first_name = "Andrew";
  const last_name = "Michaels";
  let email = "andrew_michaels@example.com";
  const addres_id = 9;
  const password = "My_password";
  it("Creates a new customer", async () => {
    const res = await request(app).post("/customer/register").send({
      email: email,
      password: password,
      first_name: first_name,
      last_name: last_name,
      addres_id: addres_id,
    });
    assert.equal(res.status, 201);
    const dataCheck = await db.query(
      "SELECT * FROM customer ORDER BY id DESC LIMIT 1;"
    );
    assert.equal(dataCheck.rows[0].email, email);
  });
  it("A customer cannot be registrated if the email already exists in the database", async () => {
    email = "user1@example.com";
    const res = await request(app).post("/customer/register").send({
      email: email,
      password: password,
      first_name: first_name,
      last_name: last_name,
      addres_id: addres_id,
    });
    assert.equal(res.status, 400);
  });
});

describe("PUT /customer/:customerId", () => {
  const new_first_name = "James";
  const new_password = "newPass001";
  let customerId = 27;
  it("The data of the customer has been updated accordingly", async () => {
    const res = await request(app)
      .put(`/customer/${customerId}`)
      .send({ first_name: new_first_name, password: new_password });
    assert.equal(res.status, 200);
    const dataCheck = await db.query("SELECT * FROM customer WHERE id = $1", [
      customerId,
    ]);
    assert.equal(dataCheck.rows[0].first_name, new_first_name);
  });
  it("It doesn't update a customer that doesn't exist in the database", async () => {
    customerId = 9999;
    const res = await request(app)
      .put(`/customer/${customerId}`)
      .send({ first_name: new_first_name, password: new_password });
    assert.equal(res.status, 404);
  });
});

describe("DELETE /customer/:customerId", () => {
  let customerIdToDelete = 25;
  it("The user has been successfully deleted", async () => {
    const res = await request(app).delete(`/customer/${customerIdToDelete}`);
    assert.equal(res.status, 200);
    const dataCheck = await db.query("SELECT * FROM customer WHERE id = $1", [
      customerIdToDelete,
    ]);
    assert.equal(dataCheck.rows.length, 0);
  });
  it("It doesn't delete a customer who doesn't exist in the database", async () => {
    customerIdToDelete = 999;
    const res = await request(app).delete(`/customer/${customerIdToDelete}`);
    assert.equal(res.status, 404);
  });
});

describe("GET /customer/:customerId", () => {
  let customerIdToCheck = 21;
  let emailCustomer = "user1@example.com";
  it("An user with an specific id was successfully retrieved", async () => {
    const res = await request(app).get(`/customer/${customerIdToCheck}`);
    assert.equal(res.status, 200);
    const resCustomer = JSON.parse(res.text);
    assert.equal(resCustomer.email, emailCustomer);
  });
  it("It doesn't retrieve any customer because the customerId doesn/t exist", async () => {
    customerIdToCheck = 999;
    const res = await request(app).get(`/customer/${customerIdToCheck}`);
    assert.equal(res.status, 404);
  });
});

describe("POST /customer/login", () => {
  let userEmail = "user1@example.com";
  let userPassword = "password1";
  it("An user has successfully logged", async () => {
    const res = await request(app)
      .post(`/customer/login`)
      .send({ email: userEmail, userPassword });
    assert.equal(res.status, 200);
    assert.equal(
      res.body.message,
      `You have been successfully logged with username ${userEmail}`
    );
  });
});
