const express = require("express");
const router = express.Router();
const dishesController = require("../controllers/dishesController");
const { auth, adminAuth } = require("../middleware/roleAuth");
const upload = require("../middleware/multer");

// Public routes
router.get("/", dishesController.getAllDishes);
router.get("/:id", dishesController.getDishById);

// Category routes (place before /:id routes to avoid conflicts)
router.get("/categories", dishesController.getAllCategories);
router.post("/categories", adminAuth, dishesController.createCategory);
router.put("/categories/:id", adminAuth, dishesController.updateCategory);
router.delete("/categories/:id", adminAuth, dishesController.deleteCategory);

// Add this route after your category routes but before the /:id routes
router.get("/category/:categoryId", dishesController.getDishesByCategory);

// Auth required routes
router.post("/:id/rate", auth, dishesController.rateDish);

// Admin only routes
router.post(
  "/",
  adminAuth,
  upload.single("image"),
  dishesController.createDish
);
router.put(
  "/:id",
  adminAuth,
  upload.single("image"),
  dishesController.updateDish
);
router.delete("/:id", adminAuth, dishesController.deleteDish);

// Toppings route
router.get("/toppings", dishesController.getAllToppings);

module.exports = router;
