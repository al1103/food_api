const sql = require("mssql");

const config = {
  server: "ZILONG\\SQLEXPRESS",
  database: "food",
  user: "sa",
  password: "sa",
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};
const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then((pool) => {
    console.log("Connected to MSSQL");
    return pool;
  })
  .catch((err) => console.log("Database Connection Failed! Bad Config: ", err));

module.exports = {
  sql,
  poolPromise,
};
