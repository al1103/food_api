const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");
const { auth, adminAuth } = require("../middleware/roleAuth"); // Import specific middleware functions

// Get cart
router.get("/", auth, cartController.getCart);

// Add to cart
router.post("/add", auth, cartController.addToCart);

// Update cart item
router.put("/item/:cartId", auth, cartController.updateCartItem);

// Remove from cart
router.delete("/item/:cartId", auth, cartController.removeFromCart);

// Clear cart
router.delete("/", auth, cartController.clearCart);

module.exports = router;
