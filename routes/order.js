const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const { auth, adminAuth } = require("../middleware/roleAuth"); // Import specific middleware functions

// Protected routes
router.get("/", adminAuth, orderController.getAllOrders); // Admin only
router.get("/:id", auth, orderController.getOrderById); // Any authenticated user
router.post("/", auth, orderController.createOrder); // Any authenticated user
router.patch("/:id/statusCode", auth, orderController.updateOrderStatus); // Any authenticated user

module.exports = router;
