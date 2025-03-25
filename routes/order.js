const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const { auth, adminAuth } = require("../middleware/roleAuth");

// ===== ADMIN STATISTICS ROUTE - ADD THIS AT THE TOP =====
// Define statistics route before any routes with :id parameter
router.get("/statistics", adminAuth, orderController.getOrderStatistics);

// ===== ROUTE CHO USER THÔNG THƯỜNG =====
// Tạo đơn hàng mới (User đăng nhập → Chọn món ăn → Đặt đơn → pending)
router.post("/", auth, orderController.createOrder);

// Xem danh sách đơn hàng của bản thân
router.get("/my-orders", auth, orderController.getUserOrders);

// Xem chi tiết một đơn hàng cụ thể
router.get("/:id", auth, orderController.getOrderById);

// Hủy đơn hàng (chỉ khi đơn còn ở trạng thái pending)
router.patch("/:id/cancel", auth, orderController.cancelOrder);

// ===== ROUTE CHO ADMIN =====
// Xem tất cả đơn hàng trong hệ thống
router.get("/", adminAuth, orderController.getAllOrders);

// Xem chi tiết đơn hàng bất kỳ
router.get("/admin/:id", adminAuth, orderController.getOrderByIdAdmin);

// Cập nhật trạng thái đơn hàng (Admin có thể cập nhật sang bất kỳ trạng thái nào)
router.patch("/:id/status", adminAuth, orderController.updateOrderStatusAdmin);

module.exports = router;
