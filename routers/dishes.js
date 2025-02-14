const express = require("express");
const router = express.Router();
const dishesController = require("../controllers/dishesController");
const authMiddleware = require("../middleware/auth");

// Public routes
router.get("/", dishesController.getAllDishes);
router.get("/:id", dishesController.getDishById);

// Protected routes
router.use(authMiddleware);
router.post("/", dishesController.createDish);
router.put("/:id", dishesController.updateDish);
router.delete("/:id", dishesController.deleteDish);

module.exports = router;
