const OrderModel = require("../models/order_model");
const { getPaginationParams } = require("../utils/pagination");
const { pool } = require("../config/database");

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
    const order = await OrderModel.getOrderById(req.paramsuserid);
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
    const userId = req.user?.userId || req.user?.id; // Handle both userId and id formats

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Vui lòng chọn ít nhất một món ăn",
      });
    }

    // Validate each item has the required fields
    for (const item of items) {
      if (!item.dishId || !item.quantity || item.quantity <= 0) {
        return res.status(400).json({
          status: "error",
          message: "Thông tin món ăn không hợp lệ",
        });
      }
    }

    // Validate table if provided
    if (tableId) {
      const tableQuery = "SELECT status FROM tables WHERE table_id = $1";
      const tableResult = await pool.query(tableQuery, [tableId]);

      if (tableResult.rows.length === 0) {
        return res.status(404).json({
          status: "error",
          message: "Bàn không tồn tại",
        });
      }

      if (tableResult.rows[0].status === "occupied") {
        return res.status(400).json({
          status: "error",
          message: "Bàn đã được sử dụng",
        });
      }
    }

    // Create order with all necessary data
    const newOrder = await OrderModel.createOrder({
      userId: userId,
      tableId: tableId,
      items: items.map((item) => ({
        dishId: item.dishId,
        quantity: item.quantity,
        specialRequests: item.specialRequests || item.note,
      })),
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
    console.error("Error creating order:", error);
    res.status(500).json({
      status: "error",
      message: "Lỗi khi tạo đơn hàng: " + error.message,
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

// Add to orderController.js
exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id; // Handle both formats
    const { page, limit } = getPaginationParams(req);

    // Get orders for user
    const result = await OrderModel.getOrdersByUserId(userId, page, limit);

    // Get order details for each order
    for (const order of result.orders) {
      const orderDetails = await OrderModel.getOrderDetails(order.orderId);
      order.items = orderDetails;
    }

    res.status(200).json({
      status: "success",
      data: result.orders,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({
      status: "error",
      message: "Lỗi khi lấy danh sách đơn hàng",
      error: error.message,
    });
  }
};
