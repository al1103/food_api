const sql = require("mssql");

const config = {
  server: process.env.DB_SERVER || "db", // Đổi 'localhost' thành 'db'
  database: process.env.DB_NAME || "food",
  user: process.env.DB_USER || "sa",
  password: process.env.DB_PASSWORD || "123123Abc.",
  options: {
    encrypt: false, // Nếu gặp lỗi chứng chỉ SSL, đặt false
    trustServerCertificate: true,
    enableArithAbort: true,
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
