const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const authMiddleware = require("../middleware/auth");

router.use(authMiddleware);

// Get all orders (admin only)
router.get("/", orderController.getAllOrders);

// Get order by ID
router.get("/:id", orderController.getOrderById);

// Create new order
router.post("/", orderController.createOrder);

// Update order status
router.patch("/:id/status", orderController.updateOrderStatus);

module.exports = router;
