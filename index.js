const express = require("express");
const bodyParser = require("body-parser");
const rateLimit = require("express-rate-limit");
const { poolPromise } = require("./config/database");
const routes = require("./routers");
const cookieParser = require("cookie-parser");
const http = require("http");
const cors = require("cors");

const app = express();

const server = http.createServer(app);

const corsOptions = {
  origin: true, // Hoặc địa chỉ cụ thể của client
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization", "Set-Cookie"],
};

app.use(cors(corsOptions));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 1000, // Giới hạn số yêu cầu
  standardHeaders: true,
  legacyHeaders: false,
  message: "Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau 15 phút",
});

app.use(limiter);
app.use(bodyParser.json());
app.use(cookieParser());

poolPromise
  .then(() => {
    console.log("Database pool initialized");
  })
  .catch((err) => {
    console.error("Error initializing database pool:", err);
    process.exit(1);
  });

routes(app);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Đã xảy ra lỗi!");
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server đang chạy trên cổng ${PORT}`);
});
