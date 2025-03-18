const express = require("express");
const router = express.Router();
const dishesController = require("../controllers/dishesController");
const { auth, adminAuth } = require("../middleware/roleAuth");

// Public routes
router.get("/", dishesController.getAllDishes); // All dishes with filters
router.get("/suggestions", dishesController.getSearchSuggestions); // Search suggestions
router.get("/categories", dishesController.getDishCategories); // Dish categories
router.get("/popular", dishesController.getPopularDishes); // Popular dishes
router.get("/combos", dishesController.getComboDishes); // Get all combo dishes
router.get("/:id", dishesController.getDishById); // Dish details

// Protected routes (admin only)
router.post("/", adminAuth, dishesController.createDish); // Create dish
router.put("/:id", adminAuth, dishesController.updateDish); // Update dish
router.delete("/:id", adminAuth, dishesController.deleteDish); // Delete dish
router.patch(
  "/:id/availability",
  adminAuth,
  dishesController.updateDishAvailability
); // Update dish availability
router.patch(
  "/size/:sizeId/availability",
  adminAuth,
  dishesController.updateSizeAvailability
); // Update size availability

module.exports = router;
