const DishModel = require("../models/dishes_model");
const { pool } = require("../config/database");
const { getPaginationParams } = require("../utils/pagination");

exports.getAllDishes = async (req, res) => {
  try {
    const { page, limit, sortBy, sortOrder } = getPaginationParams(req);
    const { category, search, minPrice, maxPrice } = req.query;

    const result = await DishModel.getAllDishes({
      page,
      limit,
      sortBy,
      sortOrder,
      category,
      search,
      minPrice,
      maxPrice,
    });

    res.json({
      status: "success",
      data: result.dishes,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error in getAllDishes:", error);
    res.status(500).json({
      status: "error",
      message: "Không thể lấy danh sách món ăn",
      error: error.message,
    });
  }
};

exports.getDishCategories = async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT category
      FROM dishes
      ORDER BY category
    `;

    const result = await pool.query(query);

    res.json({
      status: "success",
      data: result.rows.map((row) => row.category),
    });
  } catch (error) {
    console.error("Error getting dish categories:", error);
    res.status(500).json({
      status: "error",
      message: "Không thể lấy danh sách danh mục món ăn",
      error: error.message,
    });
  }
};

exports.getDishById = async (req, res) => {
  try {
    const dish = await DishModel.getDishById(req.params.id);
    if (!dish) {
      return res.status(404).json({
        status: "error",
        message: "Không tìm thấy món ăn",
      });
    }
    res.json({
      status: "success",
      data: dish,
    });
  } catch (error) {
    console.error("Error getting dish by id:", error);
    res.status(500).json({
      status: "error",
      message: "Lỗi khi lấy thông tin món ăn",
      error: error.message,
    });
  }
};

exports.getPopularDishes = async (req, res) => {
  try {
    const result = await DishModel.getPopularDishes();

    res.json({
      status: "success",
      data: result,
    });
  } catch (error) {
    console.error("Error getting popular dishes:", error);
    res.status(500).json({
      status: "error",
      message: "Không thể lấy danh sách món ăn phổ biến",
      error: error.message,
    });
  }
};

exports.updateDishAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { isAvailable } = req.body;

    if (typeof isAvailable !== "boolean") {
      return res.status(400).json({
        status: "error",
        message: "isAvailable phải là giá trị boolean",
      });
    }

    await DishModel.updateDishAvailability(id, isAvailable);

    res.json({
      status: "success",
      message: isAvailable ? "Món ăn đã có sẵn" : "Món ăn tạm thời hết",
    });
  } catch (error) {
    console.error("Error updating dish availability:", error);
    res.status(500).json({
      status: "error",
      message: "Lỗi khi cập nhật tình trạng món ăn",
      error: error.message,
    });
  }
};

// Thêm API gợi ý tìm kiếm
exports.getSearchSuggestions = async (req, res) => {
  try {
    const { query, limit = 5 } = req.query;

    if (!query || query.length < 2) {
      return res.json({
        status: "success",
        data: [],
      });
    }

    const suggestions = await DishModel.getSearchSuggestions(query, limit);

    res.json({
      status: "success",
      data: suggestions,
    });
  } catch (error) {
    console.error("Error getting search suggestions:", error);
    res.status(500).json({
      status: "error",
      message: "Không thể lấy gợi ý tìm kiếm",
      error: error.message,
    });
  }
};
