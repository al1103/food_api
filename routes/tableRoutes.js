const express = require("express");
const router = express.Router();
const tableController = require("../controllers/tableController");
const { auth, adminAuth } = require("../middleware/roleAuth");
const adminTableController = require("../controllers/adminTableController");

// Public routes
router.get("/", tableController.getAllTables);
router.get("/:id", tableController.getTableById);
// router.post("/reserve", auth, adminTableController.reserveTableWithDetails);

// Protected routes - use the auth middleware function
router.post("/", auth, tableController.createTable);
router.put("/:id", auth, tableController.updateTable);
router.post("/reservations", auth, tableController.createReservationRequest); // Client gửi yêu cầu đặt bàn

module.exports = router;
