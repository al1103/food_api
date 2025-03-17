const express = require("express");
const router = express.Router();
const dishesController = require("../controllers/dishesController");

router.get("/", dishesController.getAllDishes); // Tất cả món ăn với bộ lọc
router.get("/suggestions", dishesController.getSearchSuggestions); // Gợi ý tìm kiếm
router.get("/categories", dishesController.getDishCategories); // Danh mục món ăn
router.get("/popular", dishesController.getPopularDishes); // Món ăn phổ biến
router.get("/:id", dishesController.getDishById); // Chi tiết món ăn

router.patch("/:id/availability", dishesController.updateDishAvailability); // Cập nhật tình trạng món ăn

module.exports = router;
