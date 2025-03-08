const TableModel = require("../models/table_model");

exports.getAllTables = async (req, res) => {
  try {
    const { page, limit, sortBy, sortOrder } = req.query;

    const result = await TableModel.getAllTables(
      page,
      limit,
      sortBy,
      sortOrder
    );

    res.json({
      status: "success",
      data: result.tables,
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Không thể lấy danh sách bàn",
      error: error.message,
    });
  }
};
exports.getTableById = async (req, res) => {
  try {
    const table = await TableModel.getTableById(req.params.id);
    if (!table) {
      return res.status(404).json({
        status: "error",
        message: "Không tìm thấy bàn",
      });
    }
    res.json({
      status: "success",
      data: table,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Lỗi khi lấy thông tin bàn",
      error: error.message,
    });
  }
};

exports.createTable = async (req, res) => {
  try {
    const { tableNumber, capacity, status } = req.body;

    if (!tableNumber || !capacity) {
      return res.status(400).json({
        status: "error",
        message: "Thiếu thông tin bàn",
      });
    }

    const newTable = await TableModel.createTable({
      tableNumber,
      capacity,
      status,
    });

    res.status(201).json({
      status: "success",
      message: "Tạo bàn mới thành công",
      data: newTable,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Lỗi khi tạo bàn mới",
      error: error.message,
    });
  }
};

exports.updateTable = async (req, res) => {
  try {
    const { id } = req.params;
    const { capacity, status } = req.body;

    await TableModel.updateTable(id, { capacity, status });

    res.json({
      status: "success",
      message: "Cập nhật bàn thành công",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Lỗi khi cập nhật bàn",
      error: error.message,
    });
  }
};

exports.deleteTable = async (req, res) => {
  try {
    await TableModel.deleteTable(req.params.id);
    res.json({
      status: "success",
      message: "Xóa bàn thành công",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Lỗi khi xóa bàn",
      error: error.message,
    });
  }
};
