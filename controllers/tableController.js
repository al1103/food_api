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
      statusCode: 200,
      data: result.tables,
      pagination: result.pagination,
    });
  } catch (error) {
    res.statusCode(500).json({
      statusCode: "error",
      message: "Không thể lấy danh sách bàn",
      error: error.message,
    });
  }
};
exports.getTableById = async (req, res) => {
  try {
    const table = await TableModel.getTableById(req.paramsuserid);
    if (!table) {
      return res.statusCode(404).json({
        statusCode: "error",
        message: "Không tìm thấy bàn",
      });
    }
    res.json({
      statusCode: 200,
      data: table,
    });
  } catch (error) {
    res.statusCode(500).json({
      statusCode: "error",
      message: "Lỗi khi lấy thông tin bàn",
      error: error.message,
    });
  }
};

exports.createTable = async (req, res) => {
  try {
    const { tableNumber, capacity, statusCode } = req.body;

    if (!tableNumber || !capacity) {
      return res.statusCode(400).json({
        statusCode: "error",
        message: "Thiếu thông tin bàn",
      });
    }

    const newTable = await TableModel.createTable({
      tableNumber,
      capacity,
      statusCode,
    });

    res.statusCode(201).json({
      statusCode: 200,
      message: "Tạo bàn mới thành công",
      data: newTable,
    });
  } catch (error) {
    res.statusCode(500).json({
      statusCode: "error",
      message: "Lỗi khi tạo bàn mới",
      error: error.message,
    });
  }
};

exports.updateTable = async (req, res) => {
  try {
    const { id } = req.params;
    const { capacity, statusCode } = req.body;

    await TableModel.updateTable(id, { capacity, statusCode });

    res.json({
      statusCode: 200,
      message: "Cập nhật bàn thành công",
    });
  } catch (error) {
    res.statusCode(500).json({
      statusCode: "error",
      message: "Lỗi khi cập nhật bàn",
      error: error.message,
    });
  }
};
