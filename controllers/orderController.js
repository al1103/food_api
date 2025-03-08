const OrderModel = require("../models/order_model");
const { getPaginationParams } = require("../utils/pagination");

exports.getAllOrders = async (req, res) => {
  try {
    const { page, limit, sortBy, sortOrder } = getPaginationParams(req);
    const { status, startDate, endDate } = req.query;

    const result = await OrderModel.getAllOrders({
      page,
      limit,
      sortBy,
      sortOrder,
      status,
      startDate,
      endDate,
    });

    res.json({
      status: "success",
      data: result.orders,
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Không thể lấy danh sách đơn hàng",
      error: error.message,
    });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await OrderModel.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({
        status: "error",
        message: "Không tìm thấy đơn hàng",
      });
    }
    res.json({
      status: "success",
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Lỗi khi lấy thông tin đơn hàng",
      error: error.message,
    });
  }
};

// Enhanced create order with line items
exports.createOrder = async (req, res) => {
  try {
    const { tableId, items, customerName, phoneNumber, note } = req.body;
    const userId = req.user?.id; // Optional from auth middleware

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Vui lòng chọn ít nhất một món ăn",
      });
    }

    const newOrder = await OrderModel.createOrder({
      userId,
      tableId,
      items, // Array of {dishId, quantity, specialRequests}
      customerName,
      phoneNumber,
      note,
    });

    res.status(201).json({
      status: "success",
      message: "Tạo đơn hàng thành công",
      data: newOrder,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Lỗi khi tạo đơn hàng",
      error: error.message,
    });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["pending", "confirmed", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({
        status: "error",
        message: "Trạng thái không hợp lệ",
      });
    }

    await OrderModel.updateOrderStatus(id, status);
    res.json({
      status: "success",
      message: "Cập nhật trạng thái đơn hàng thành công",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Lỗi khi cập nhật trạng thái đơn hàng",
      error: error.message,
    });
  }
};

// Add order statistics feature
exports.getOrderStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const stats = await OrderModel.getOrderStatistics(startDate, endDate);

    res.json({
      status: "success",
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Không thể lấy thống kê đơn hàng",
      error: error.message,
    });
  }
};
