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

    res.status(200).json({
      statusCode: 200,
      data: result.tables,
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      message: "Không thể lấy danh sách bàn",
      error: error.message,
    });
  }
};
exports.getTableById = async (req, res) => {
  try {
    const table = await TableModel.getTableById(req.paramsuserid);
    if (!table) {
      return res.status(404).json({
        statusCode: 500,
        message: "Không tìm thấy bàn",
      });
    }
    res.status(200).json({
      statusCode: 200,
      data: [table],
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      message: "Lỗi khi lấy thông tin bàn",
      error: error.message,
    });
  }
};

exports.createTable = async (req, res) => {
  try {
    const { tableNumber, capacity, statusCode } = req.body;

    if (!tableNumber || !capacity) {
      return res.status(400).json({
        statusCode: 500,
        message: "Thiếu thông tin bàn",
      });
    }

    const newTable = await TableModel.createTable({
      tableNumber,
      capacity,
      statusCode,
    });

    res.status(201).json({
      statusCode: 200,
      message: "Tạo bàn mới thành công",
      data: newTable,
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
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

    res.status(200).json({
      statusCode: 200,
      message: "Cập nhật bàn thành công",
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      message: "Lỗi khi cập nhật bàn",
      error: error.message,
    });
  }
};
