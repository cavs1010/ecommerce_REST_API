/*---IMPORTS---*/
const db = require("../db");

/*---HELPERS---*/
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

const retrieveInformationGivenId = async (
  columnRetrieved,
  tableName,
  columnToFilter,
  valueFiltered
) => {
  try {
    let results = await db.query(
      `SELECT ${columnRetrieved} FROM ${tableName} WHERE ${columnToFilter}` +
        " = $1",
      [valueFiltered]
    );
    return results.rows[0][columnRetrieved];
  } catch (error) {
    console.error(error);
    return;
  }
};

const checkIndexExists = async (tableName, indexToCheck) => {
  let error = "";
  try {
    const { rows } = await db.query(
      `SELECT * FROM ${tableName} ` + "WHERE id = $1;",
      [indexToCheck]
    );
    if (!rows.length) {
      errorMessage = `The id ${indexToCheck} does not exist in table ${tableName}`;
      return errorMessage;
    }
  } catch (error) {
    console.log(error);
    errorMessage = "There was an error";
    return errorMessage;
  }
};

/*---EXPORTS---*/
const helpers = {
  checkProductExists,
  checkCustomerExists,
  retrieveInformationGivenId,
  checkIndexExists,
};
module.exports = helpers;
