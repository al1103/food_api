const express = require("express");
const router = express.Router();
const dishesController = require("../controllers/dishesController");
const authMiddleware = require("../middleware/auth");

// Public routes for viewing and searching dishes
router.get("/", dishesController.getAllDishes);
router.get("/:id", dishesController.getDishById);

// Protected routes for creating, updating, and deleting dishes
router.use(authMiddleware);
router.post("/", dishesController.createDish);
router.put("/:id", dishesController.updateDish);
router.delete("/:id", dishesController.deleteDish);

module.exports = router;
