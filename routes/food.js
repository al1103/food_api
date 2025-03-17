const express = require("express");
const router = express.Router();
const foodController = require("../controllers/foodController");
const { auth, adminAuth } = require("../middleware/roleAuth"); // Import specific middleware functions

// Public routes
router.get("/", foodController.getAllFoods);
router.get("/:id", foodController.getFoodById);

// Protected routes
router.post("/", adminAuth, foodController.createFood); // Admin only
router.put("/:id", adminAuth, foodController.updateFood); // Admin only
router.delete("/:id", adminAuth, foodController.deleteFood); // Admin only

module.exports = router;
