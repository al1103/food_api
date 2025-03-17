const DishModel = require("../models/dishes_model");
const { getPaginationParams } = require("../utils/pagination");

exports.getAllDishes = async (req, res) => {
  try {
    const { page, limit, sortBy, sortOrder } = getPaginationParams(req);
    const { category, search } = req.query;

    const result = await DishModel.getAllDishes({
      page,
      limit,
      sortBy,
      sortOrder,
      category,
      search,
    });

    res.json({
      status: "success",
      data: result.dishes,
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Không thể lấy danh sách món ăn",
      error: error.message,
    });
  }
};

exports.getDishById = async (req, res) => {
  try {
    const dish = await DishModel.getDishById(req.paramsuserid);
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
    res.status(500).json({
      status: "error",
      message: "Lỗi khi lấy thông tin món ăn",
      error: error.message,
    });
  }
};

exports.createDish = async (req, res) => {
  try {
    const newDish = await DishModel.createDish(req.body);

    res.status(201).json({
      status: "success",
      message: "Tạo món ăn mới thành công",
      data: newDish,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Lỗi khi tạo món ăn",
      error: error.message,
    });
  }
};

exports.updateDish = async (req, res) => {
  try {
    const updatedDish = await DishModel.updateDish(req.paramsuserid, req.body);
    res.json({
      status: "success",
      message: "Cập nhật món ăn thành công",
      data: updatedDish,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Lỗi khi cập nhật món ăn",
      error: error.message,
    });
  }
};

exports.deleteDish = async (req, res) => {
  try {
    const result = await DishModel.deleteDish(req.paramsuserid);
    res.json({
      status: "success",
      message: result.message,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Lỗi khi xóa món ăn",
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
    res.status(500).json({
      status: "error",
      message: "Lỗi khi cập nhật tình trạng món ăn",
      error: error.message,
    });
  }
};
