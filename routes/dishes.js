const express = require("express");
const router = express.Router();
const dishesController = require("../controllers/dishesController");
const { auth, adminAuth } = require("../middleware/roleAuth"); // Import specific middleware functions

// Public routes for viewing and searching dishes
router.get("/", dishesController.getAllDishes);
router.get("/:id", dishesController.getDishById);

// Protected routes for creating, updating, and deleting dishes
router.post("/", adminAuth, dishesController.createDish); // Admin only
router.put("/:id", adminAuth, dishesController.updateDish); // Admin only
router.delete("/:id", adminAuth, dishesController.deleteDish); // Admin only

module.exports = router;
