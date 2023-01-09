/*---IMPORTS---*/
const db = require("../db");

/*---HELPERS---*/

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

const validateCustomerId = async (req, res, next) => {
  const customerId = parseInt(req.params.customerId);
  const customerNotExist = await checkIndexExists("customer", customerId);
  if (customerNotExist) {
    console.log(customerNotExist);
    return res.status(400).send({ error: customerNotExist });
  }
  next();
};

const validateProductId = async (req, res, next) => {
  const productId = parseInt(req.params.productId);
  const productNoExist = await checkIndexExists("product", productId);
  if (productNoExist) {
    console.log(productNoExist);
    return res.status(400).send({ error: productNoExist });
  }
  next();
};

/*---EXPORTS---*/
const helpers = {
  validateCustomerId,
  validateProductId,
  retrieveInformationGivenId,
  checkIndexExists,
};
module.exports = helpers;
