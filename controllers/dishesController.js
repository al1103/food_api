const DishModel = require("../models/dishes_model");
const { pool } = require("../config/database");
const { getPaginationParams } = require("../utils/pagination");

exports.getAllDishes = async (req, res) => {
  try {
    const { page, limit, sortBy, sortOrder } = getPaginationParams(req);
    const { category, search, minPrice, maxPrice, isCombo } = req.query;

    const result = await DishModel.getAllDishes({
      page,
      limit,
      sortBy,
      sortOrder,
      category,
      search,
      minPrice,
      maxPrice,
      isCombo,
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

// Get dish by ID
exports.getDishById = async (req, res) => {
  try {
    const { id } = req.params;
    const dish = await DishModel.getDishById(id);

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
    console.error("Error getting dish by ID:", error);
    res.status(500).json({
      status: "error",
      message: "Lỗi khi lấy thông tin món ăn",
      error: error.message,
    });
  }
};

// Get popular dishes
exports.getPopularDishes = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Get dishes with highest ratings, limit to the requested number
    const result = await DishModel.getAllDishes({
      page: 1,
      limit,
      sortBy: "rating",
      sortOrder: "DESC",
      isAvailable: true,
    });

    res.json({
      status: "success",
      data: result.dishes,
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

// Get all dish categories
exports.getDishCategories = async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT category 
      FROM dishes 
      ORDER BY category ASC
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

// Get combo dishes
exports.getComboDishes = async (req, res) => {
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
      isCombo: true,
    });

    res.json({
      status: "success",
      data: result.dishes,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error getting combo dishes:", error);
    res.status(500).json({
      status: "error",
      message: "Không thể lấy danh sách combo",
      error: error.message,
    });
  }
};

// Get search suggestions
exports.getSearchSuggestions = async (req, res) => {
  try {
    const { term } = req.query;

    if (!term || term.length < 2) {
      return res.json({
        status: "success",
        data: [],
      });
    }

    const query = `
      SELECT name 
      FROM dishes 
      WHERE name ILIKE $1 
      ORDER BY name ASC 
      LIMIT 10
    `;

    const result = await pool.query(query, [`%${term}%`]);

    res.json({
      status: "success",
      data: result.rows.map((row) => row.name),
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

// Update size availability
exports.updateSizeAvailability = async (req, res) => {
  try {
    const { sizeId } = req.params;
    const { isAvailable } = req.body;

    if (typeof isAvailable !== "boolean") {
      return res.status(400).json({
        status: "error",
        message: "isAvailable phải là giá trị boolean",
      });
    }

    const result = await DishModel.updateSizeAvailability(sizeId, isAvailable);

    res.json({
      status: "success",
      message: isAvailable
        ? "Kích thước món ăn đã có sẵn"
        : "Kích thước món ăn tạm thời hết",
      data: result,
    });
  } catch (error) {
    console.error("Error updating size availability:", error);
    res.status(500).json({
      status: "error",
      message: "Lỗi khi cập nhật tình trạng kích thước món ăn",
      error: error.message,
    });
  }
};

// Update dish availability
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

    const result = await DishModel.updateDishAvailability(id, isAvailable);

    res.json({
      status: "success",
      message: isAvailable ? "Món ăn đã có sẵn" : "Món ăn tạm thời hết",
      data: result,
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

// Create dish with sizes and combo information
exports.createDish = async (req, res) => {
  try {
    const dishData = req.body;

    if (!dishData.name || !dishData.category) {
      return res.status(400).json({
        status: "error",
        message: "Thiếu thông tin cần thiết cho món ăn (tên, danh mục)",
      });
    }

    // Kiểm tra giá trị thời gian làm hợp lệ
    if (dishData.preparationTime !== undefined) {
      const prepTime = parseInt(dishData.preparationTime);
      if (isNaN(prepTime) || prepTime <= 0) {
        return res.status(400).json({
          status: "error",
          message: "Thời gian làm phải là số nguyên dương",
        });
      }
      dishData.preparationTime = prepTime;
    }

    if (
      dishData.isCombo &&
      (!dishData.comboItems || dishData.comboItems.length === 0)
    ) {
      return res.status(400).json({
        status: "error",
        message: "Combo phải có ít nhất một món ăn thành phần",
      });
    }

    if (
      !dishData.isCombo &&
      (!dishData.sizes || dishData.sizes.length === 0) &&
      !dishData.price
    ) {
      return res.status(400).json({
        status: "error",
        message: "Món ăn phải có ít nhất một kích thước hoặc giá",
      });
    }

    const result = await DishModel.createDish(dishData);

    res.status(201).json({
      status: "success",
      message: "Tạo món ăn thành công",
      data: result,
    });
  } catch (error) {
    console.error("Error creating dish:", error);
    res.status(500).json({
      status: "error",
      message: "Lỗi khi tạo món ăn",
      error: error.message,
    });
  }
};

// Update dish with sizes and combo information
exports.updateDish = async (req, res) => {
  try {
    const { id } = req.params;
    const dishData = req.body;

    if (!dishData.name || !dishData.category) {
      return res.status(400).json({
        status: "error",
        message: "Thiếu thông tin cần thiết cho món ăn (tên, danh mục)",
      });
    }

    // Kiểm tra giá trị thời gian làm hợp lệ
    if (dishData.preparationTime !== undefined) {
      const prepTime = parseInt(dishData.preparationTime);
      if (isNaN(prepTime) || prepTime <= 0) {
        return res.status(400).json({
          status: "error",
          message: "Thời gian làm phải là số nguyên dương",
        });
      }
      dishData.preparationTime = prepTime;
    }

    if (
      dishData.isCombo &&
      dishData.comboItems &&
      dishData.comboItems.length === 0
    ) {
      return res.status(400).json({
        status: "error",
        message: "Combo phải có ít nhất một món ăn thành phần",
      });
    }

    const result = await DishModel.updateDish(id, dishData);

    if (!result) {
      return res.status(404).json({
        status: "error",
        message: "Không tìm thấy món ăn",
      });
    }

    res.json({
      status: "success",
      message: "Cập nhật món ăn thành công",
      data: result,
    });
  } catch (error) {
    console.error("Error updating dish:", error);
    res.status(500).json({
      status: "error",
      message: "Lỗi khi cập nhật món ăn",
      error: error.message,
    });
  }
};

// Delete a dish
exports.deleteDish = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if dish exists
    const dish = await DishModel.getDishById(id);
    if (!dish) {
      return res.status(404).json({
        status: "error",
        message: "Không tìm thấy món ăn",
      });
    }

    await DishModel.deleteDish(id);

    res.json({
      status: "success",
      message: "Xóa món ăn thành công",
    });
  } catch (error) {
    console.error("Error deleting dish:", error);
    res.status(500).json({
      status: "error",
      message: "Lỗi khi xóa món ăn",
      error: error.message,
    });
  }
};

// Thêm route để cập nhật đánh giá món ăn (nếu chưa có)
exports.updateDishRating = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, isNewReview } = req.body;

    if (rating === undefined) {
      return res.status(400).json({
        status: "error",
        message: "Thiếu giá trị đánh giá",
      });
    }

    const parsedRating = parseFloat(rating);
    if (isNaN(parsedRating) || parsedRating < 0 || parsedRating > 5) {
      return res.status(400).json({
        status: "error",
        message: "Đánh giá phải là số từ 0 đến 5",
      });
    }

    const result = await DishModel.updateDishRating(
      id,
      parsedRating,
      isNewReview !== false
    );

    res.json({
      status: "success",
      message: "Cập nhật đánh giá thành công",
      data: result,
    });
  } catch (error) {
    console.error("Error updating dish rating:", error);
    res.status(500).json({
      status: "error",
      message: "Lỗi khi cập nhật đánh giá món ăn",
      error: error.message,
    });
  }
};
