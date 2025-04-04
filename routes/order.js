const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const { auth, adminAuth } = require("../middleware/roleAuth");

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
router.get("/admin/orders", adminAuth, orderController.getAllOrders);

// Xem chi tiết đơn hàng bất kỳ
router.get("/admin/orders/:id", adminAuth, orderController.getOrderByIdAdmin);

// Cập nhật trạng thái đơn hàng
router.patch(
  "/admin/orders/:id/status",
  adminAuth,
  orderController.updateOrderStatusAdmin
);

// Thống kê đơn hàng
router.get("/statistics", adminAuth, orderController.getOrderStatistics);

module.exports = router;
