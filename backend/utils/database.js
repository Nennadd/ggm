const mssql = require("mssql");
const config = require("../config");

const poolPromise = new mssql.ConnectionPool(config)
  .connect()
  .then((pool) => {
    console.log("Connected to Database !");
    return pool;
  })
  .catch((err) => console.log("Database Connection Failed! Bad Config: ", err));

module.exports = poolPromise;
