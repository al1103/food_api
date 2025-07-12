const express = require("express");
const router = express.Router();
const dishesController = require("../controllers/dishesController");
const { auth, adminAuth } = require("../middleware/roleAuth");
const upload = require("../middleware/multer");
const trackDishView = require('../middleware/trackDishView');

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

// Review-related routes
router.get("/:id/reviews", dishesController.getDishReviews); // Get reviews for a dish
router.get("/:id/reviews/stats", dishesController.getDishReviewStats); // Get review statistics
router.get("/reviews/top-rated", dishesController.getTopRatedDishes); // Get top rated dishes
router.get("/reviews/recent", dishesController.getRecentReviews); // Get recent reviews

// Public routes
router.get("/", dishesController.getAllDishes);
router.get('/:id', trackDishView, dishesController.getDishById);

// API trả về món đã xem gần đây
router.get('/recent-viewed', async (req, res) => {
  const ids = req.session?.recentDishes || [];
  if (!ids.length) return res.json({ dishes: [] });
  const dishes = await require('../models/dishes_model').getDishesByIds(ids);
  res.json({ dishes });
});

// API gợi ý món cùng loại
router.get('/recommend', async (req, res) => {
  const ids = req.session?.recentDishes || [];
  if (!ids.length) return res.json({ recommendations: [] });
  const DishModel = require('../models/dishes_model');
  const recentDishes = await DishModel.getDishesByIds(ids);
  const categoryIds = [...new Set(recentDishes.map(d => d.categoryId))];
  const recommendations = await DishModel.getDishesByCategoryIds(categoryIds, ids);
  res.json({ recommendations });
});

// Auth required routes
router.post("/:id/rate", auth, dishesController.rateDish);

// Admin only routes
router.post(
  "/",
  adminAuth,
  upload.single("image"),
  dishesController.createDish,
);
router.put(
  "/:id",
  adminAuth,
  upload.single("image"),
  dishesController.updateDish,
);
router.delete("/:id", adminAuth, dishesController.deleteDish);

// Admin route to set dish availability
router.patch(
  "/:id/availability",
  adminAuth,
  dishesController.setDishAvailability,
);

module.exports = router;
