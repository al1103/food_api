const express = require("express");
const router = express.Router();
const dishesController = require("../controllers/dishesController");
const { auth, adminAuth } = require("../middleware/roleAuth");
const upload = require("../middleware/multer");

// Create separate router for categories
const categoryRouter = express.Router();

// Mount category routes on a separate path
router.use("/categories", categoryRouter);

// Category routes (no leading slash needed since we're using a separate router)
categoryRouter.get("/", dishesController.getAllCategories);
categoryRouter.post("/", adminAuth, dishesController.createCategory);
categoryRouter.put("/:id", adminAuth, dishesController.updateCategory);
categoryRouter.delete("/:id", adminAuth, dishesController.deleteCategory);

// Change the route parameter name to match the controller
router.get("/category/:categoryId", dishesController.getDishesByCategory); // Changed from :id to :categoryId

// Toppings route
router.get("/toppings", dishesController.getAllToppings);

// Add this route before the general routes
// Public route for top dishes
router.get("/top", dishesController.getTopDishes);

// Public routes
router.get("/", dishesController.getAllDishes);
router.get("/:id", dishesController.getDishById);

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

module.exports = router;
