const express = require("express");
const router = express.Router();
const foodController = require("../controllers/foodController");
const authMiddleware = require("../middleware/auth");

// Public routes
router.get("/", foodController.getAllFoods);
router.get("/:id", foodController.getFoodById);

// Protected routes
router.use(authMiddleware);
router.post("/", foodController.createFood);
router.put("/:id", foodController.updateFood);
router.delete("/:id", foodController.deleteFood);

module.exports = router;
