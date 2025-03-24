const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const { auth, adminAuth } = require("../middleware/roleAuth");

// Protected routes
router.get("/", adminAuth, orderController.getAllOrders); // Admin only
router.get("/my-orders", auth, orderController.getUserOrders); // New method to get only user's orders
router.get("/:id", auth, orderController.getOrderById); // Note: This is the route with the parameter
router.post("/", auth, orderController.createOrder);
router.patch("/:id/status", auth, orderController.updateOrderStatus);

module.exports = router;
