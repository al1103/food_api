const DishModel = require("../models/dishes_model");

exports.getAllDishes = async (req, res) => {
  try {
    const dishes = await DishModel.getAllDishes();
    res.json({
      status: "success",
      data: dishes,
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
      message: "Lỗi khi tạo món ăn mới",
      error: error.message,
    });
  }
};

exports.updateDish = async (req, res) => {
  try {
    await DishModel.updateDish(req.params.id, req.body);
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

exports.deleteDish = async (req, res) => {
  try {
    await DishModel.deleteDish(req.params.id);
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
