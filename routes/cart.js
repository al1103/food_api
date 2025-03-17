const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");
const { authenticate } = require("../middleware/auth"); // Assuming you have an auth middleware

// All cart routes require authentication
router.use(authenticate);

// Get cart
router.get("/", cartController.getCart);

// Add to cart
router.post("/add", cartController.addToCart);

// Update cart item
router.put("/item/:cartId", cartController.updateCartItem);

// Remove from cart
router.delete("/item/:cartId", cartController.removeFromCart);

// Clear cart
router.delete("/", cartController.clearCart);

module.exports = router;
