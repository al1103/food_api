const express = require("express");
const router = express.Router();
const adminTableController = require("../controllers/adminTableController");
const { adminAuth } = require("../middleware/roleAuth");

// Áp dụng middleware adminAuth cho tất cả các routes
router.use(adminAuth);

// Routes quản lý bàn cho admin
router.get("/tables", adminTableController.getAllTablesWithStatus);
router.get("/tables/:id", adminTableController.getTableDetail);
router.post("/tables", adminTableController.createTable);
router.put("/tables/:id", adminTableController.updateTable);
router.patch("/tables/:id/status", adminTableController.updateTableStatus);
router.delete("/tables/:id", adminTableController.deleteTable);

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
router.get("/tables/:id/history", adminTableController.getTableHistory);

module.exports = router;
