const FoodModel = require("../models/food");

exports.getAllFoods = async (req, res) => {
  try {
    const foods = await FoodModel.getAllFoods();
    res.json({
      status: "success",
      data: foods,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Không thể lấy danh sách món ăn",
      error: error.message,
    });
  }
};

exports.getFoodById = async (req, res) => {
  try {
    const food = await FoodModel.getFoodById(req.params.id);
    if (!food) {
      return res.status(404).json({
        status: "error",
        message: "Không tìm thấy món ăn",
      });
    }
    res.json({
      status: "success",
      data: food,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Lỗi khi lấy thông tin món ăn",
      error: error.message,
    });
  }
};

exports.createFood = async (req, res) => {
  try {
    const newFood = await FoodModel.createFood(req.body);
    res.status(201).json({
      status: "success",
      message: "Tạo món ăn mới thành công",
      data: newFood,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Lỗi khi tạo món ăn mới",
      error: error.message,
    });
  }
};

exports.updateFood = async (req, res) => {
  try {
    await FoodModel.updateFood(req.params.id, req.body);
    res.json({
      status: "success",
      message: "Cập nhật món ăn thành công",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Lỗi khi cập nhật món ăn",
      error: error.message,
    });
  }
};

exports.deleteFood = async (req, res) => {
  try {
    await FoodModel.deleteFood(req.params.id);
    res.json({
      status: "success",
      message: "Xóa món ăn thành công",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Lỗi khi xóa món ăn",
      error: error.message,
    });
  }
};
