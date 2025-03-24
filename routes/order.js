const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const { auth, adminAuth } = require("../middleware/roleAuth");

// ===== ROUTE CHO USER THÔNG THƯỜNG =====
// Tạo đơn hàng mới (User đăng nhập → Chọn món ăn → Đặt đơn → pending)
router.post("/", auth, orderController.createOrder);

// Thêm route mới để tạo đơn từ giỏ hàng
router.post("/from-cart", auth, orderController.createOrderFromCart);

// Xem danh sách đơn hàng của bản thân
router.get("/my-orders", auth, orderController.getUserOrders);

// Xem chi tiết một đơn hàng cụ thể
router.get("/:id", auth, orderController.getOrderById);

// Hủy đơn hàng (chỉ khi đơn còn ở trạng thái pending)
router.patch("/:id/cancel", auth, orderController.cancelOrder);

// ===== ROUTE CHO ADMIN =====
// Xem tất cả đơn hàng trong hệ thống
router.get("/admin/orders", adminAuth, orderController.getAllOrders);

// Xem chi tiết đơn hàng bất kỳ
router.get("/admin/orders/:id", adminAuth, orderController.getOrderByIdAdmin);

// Cập nhật trạng thái đơn hàng (Admin có thể cập nhật sang bất kỳ trạng thái nào)
router.patch(
  "/admin/orders/:id/status",
  adminAuth,
  orderController.updateOrderStatusAdmin
);

module.exports = router;
