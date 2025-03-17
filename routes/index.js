const express = require("express");
const usersRouter = require("./userRoutes");
const aiRoutes = require("./aiRoutes");
const tableRoutes = require("./tableRoutes");
const dishesRoutes = require("./dishes");
const orderRoutes = require("./order");
const orderDetailRoutes = require("./orderdetail");
const reservationRoutes = require("./Reservations");
const dashboardRoutes = require("./dashboard");
const adminRoutes = require("./adminRoutes"); // Add admin routes
const cartRoutes = require("./cart");

function routes(app) {
  // User management
  app.use("/api/users", usersRouter);

  // Admin routes
  app.use("/api/admin", adminRoutes);

  // AI features
  app.use("/api/ai", aiRoutes);
  app.use("/api/dashboard", dashboardRoutes);

  // Restaurant management
  app.use("/api/tables", tableRoutes);
  app.use("/api/dishes", dishesRoutes);

  // Order management
  app.use("/api/orders", orderRoutes);
  app.use("/api/order-details", orderDetailRoutes);

  // Reservation management
  app.use("/api/reservations", reservationRoutes);

  // In your app.js file
  app.use("/api/cart", cartRoutes);

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
      status: "error",
      message: err.message || "Đã xảy ra lỗi!",
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      status: "error",
      message: "Không tìm thấy tài nguyên",
    });
  });
}

module.exports = routes;
