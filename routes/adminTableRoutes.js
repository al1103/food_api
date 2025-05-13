const express = require("express");
const router = express.Router();
const adminTableController = require("../controllers/adminTableController");
const { adminAuth, auth } = require("../middleware/roleAuth");

// Áp dụng middleware adminAuth cho tất cả các routes
router.use(adminAuth);

// Routes mới để quản lý khách hàng trong bàn
router.get("/tables/:id/customers", adminTableController.getTableCustomers);
router.get(
  "/tables/:id/customers-and-orders",
  adminTableController.getTableCustomersAndOrders
);
router.post(
  "/tables/:tableId/orders/:orderId/payment",
  adminTableController.confirmPayment
);
router.post(
  "/tables/:tableId/orders/:orderId/action",
  adminTableController.removeCustomerFromTable
);

// Routes quản lý yêu cầu đặt bàn
router.get("/reservations", adminTableController.getReservationsByStatus); // Admin xem danh sách yêu cầu đặt bàn theo trạng thái
router.post(
  "/reservations/:reservationId/update-status",
  adminTableController.updateReservationStatus
); // Admin xác nhận hoặc hủy yêu cầu đặt bàn
router.post(
  "/reservations/:reservationId/cancel",
  adminTableController.cancelReservationRequest
);
module.exports = router;
