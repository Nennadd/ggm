const sql = require("mssql");
const config = require("../config");

let pool = null;
const closePool = async () => {
  try {
    await pool.close();
    pool = null;
  } catch (error) {
    pool = null;
    console.log("BadConnection..", error);
  }
};

const getConnection = async () => {
  try {
    if (pool) {
      return pool;
    }
    pool = await sql.connect(config);

    pool.on("error", async (err) => {
      console.log("Connection pool error..", err);
      await closePool();
    });
    console.log("Connected to database !");
    return pool;
  } catch (err) {
    console.log("Error connecting to sql server", err);
    pool = null;
  }
};

module.exports = { getConnection, sql };
