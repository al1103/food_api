const OrderModel = require("../models/order_model");
const { getPaginationParams } = require("../utils/pagination");

exports.getAllOrders = async (req, res) => {
  try {
    const { page, limit, sortBy, sortOrder } = getPaginationParams(req);
    const { statusCode, startDate, endDate } = req.query;

    const result = await OrderModel.getAllOrders({
      page,
      limit,
      sortBy,
      sortOrder,
      statusCode,
      startDate,
      endDate,
    });

    res.status(200).json({
      statusCode: 200,
      data: result.orders,
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      message: "Không thể lấy danh sách đơn hàng",
      error: error.message,
    });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await OrderModel.getOrderById(req.paramsuserid);
    if (!order) {
      return res.status(404).json({
        statusCode: 500,
        message: "Không tìm thấy đơn hàng",
      });
    }
    res.status(200).json({
      statusCode: 200,
      data: [order],
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      message: "Lỗi khi lấy thông tin đơn hàng",
      error: error.message,
    });
  }
};

// Enhanced create order with line items
exports.createOrder = async (req, res) => {
  try {
    const { tableId, items, customerName, phoneNumber, note } = req.body;
    const userId = req.user?.userid; // Optional from auth middleware

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        statusCode: 500,
        message: "Vui lòng chọn ít nhất một món ăn",
      });
    }

    const newOrder = await OrderModel.createOrder({
      userId,
      tableId,
      items, // Array of {dish_id, quantity, specialRequests}
      customerName,
      phoneNumber,
      note,
    });

    res.status(201).json({
      statusCode: 200,
      message: "Tạo đơn hàng thành công",
      data: newOrder,
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      message: "Lỗi khi tạo đơn hàng",
      error: error.message,
    });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { statusCode } = req.body;

    if (
      !["pending", "confirmed", "completed", "cancelled"].includes(statusCode)
    ) {
      return res.status(400).json({
        statusCode: 400,
        message: "Trạng thái không hợp lệ",
      });
    }

    await OrderModel.updateOrderStatus(id, statusCode);
    res.status(200).json({
      statusCode: 200,
      message: "Cập nhật trạng thái đơn hàng thành công",
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
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

    res.status(200).json({
      statusCode: 200,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      message: "Không thể lấy thống kê đơn hàng",
      error: error.message,
    });
  }
};

// Add to orderController.js
exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id; // From auth middleware
    const { page, limit } = req.query;

    // Add a new method in OrderModel
    const result = await OrderModel.getOrdersByUserId(userId, page, limit);

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
