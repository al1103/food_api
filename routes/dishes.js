const express = require("express");
const router = express.Router();
const dishesController = require("../controllers/dishesController");
const { auth, adminAuth } = require("../middleware/roleAuth");
const upload = require("../middleware/multer");

// Public routes
router.get("/", dishesController.getAllDishes); // All dishes with pagination
// router.get("/suggestions", dishesController.getSearchSuggestions); // Search suggestions
// router.get("/categories", dishesController.getDishCategories); // Dish categories
// router.get("/popular", dishesController.getPopularDishes); // Popular dishes
// router.get("/combos", dishesController.getComboDishes); // Get all combo dishes
router.get("/:id", dishesController.getDishById); // Dish details

// Auth required routes
router.post("/:id/rate", auth, dishesController.rateDish); // Rate a dish

// Admin only routes
router.post(
  "/",
  adminAuth,
  upload.single("image"),
  dishesController.createDish
); // Create dish
router.put(
  "/:id",
  adminAuth,
  upload.single("image"),
  dishesController.updateDish
); // Update dish
router.delete("/:id", adminAuth, dishesController.deleteDish); // Delete dish
// Get all available toppings
router.get("/toppings", dishesController.getAllToppings);
module.exports = router;
