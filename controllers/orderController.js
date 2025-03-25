const OrderModel = require("../models/order_model");
const { pool } = require("../config/database");
const { getPaginationParams } = require("../utils/pagination");
const CartModel = require("../models/cart_model");

// ===== CONTROLLER CHO USER THÔNG THƯỜNG =====

// 1. Tạo đơn hàng mới
exports.createOrder = async (req, res) => {
  try {
    const { tableId, items, customerName, phoneNumber, note } = req.body;
    const userId = req.user.userId;

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Vui lòng chọn ít nhất một món ăn",
      });
    }

    // Validate each item
    for (const item of items) {
      if (!item.dishId || !item.quantity || item.quantity <= 0) {
        return res.status(400).json({
          status: "error",
          message: "Thông tin món ăn không hợp lệ",
        });
      }
    }

    // Create order with pending status
    const newOrder = await OrderModel.createOrder({
      userId,
      tableId,
      items: items.map((item) => ({
        dishId: item.dishId,
        quantity: item.quantity,
        specialRequests: item.specialRequests || item.note,
      })),
      status: "pending", // Set default status as pending
      customerName,
      phoneNumber,
      note,
    });

    res.status(201).json({
      status: "success",
      message: "Đặt món thành công! Đơn hàng của bạn đang chờ xác nhận",
      data: newOrder,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({
      status: "error",
      message: "Không thể tạo đơn hàng: " + error.message,
    });
  }
};

// 2. Xem danh sách đơn hàng của user đăng nhập
exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page, limit } = getPaginationParams(req);

    const result = await OrderModel.getOrdersByUserId(userId, page, limit);

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
    });
  }
};

// 3. Xem chi tiết đơn hàng (user chỉ xem được đơn của mình)
exports.getOrderById = async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.user.userId;

    const order = await OrderModel.getOrderById(orderId);

    if (!order) {
      return res.status(404).json({
        status: "error",
        message: "Không tìm thấy đơn hàng",
      });
    }

    // Kiểm tra đơn hàng có thuộc về user không
    if (order.userId != userId) {
      return res.status(403).json({
        status: "error",
        message: "Bạn không có quyền xem đơn hàng này",
      });
    }

    res.status(200).json({
      status: "success",
      data: order,
    });
  } catch (error) {
    console.error("Error getting order:", error);
    res.status(500).json({
      status: "error",
      message: "Lỗi khi lấy thông tin đơn hàng",
    });
  }
};

// 4. Hủy đơn hàng (user chỉ được hủy đơn khi còn ở trạng thái pending)
exports.cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.user.userId;

    // Kiểm tra đơn hàng tồn tại
    const order = await OrderModel.getOrderById(orderId);

    if (!order) {
      return res.status(404).json({
        status: "error",
        message: "Không tìm thấy đơn hàng",
      });
    }

    // Kiểm tra đơn hàng có thuộc về user không
    if (order.userId != userId) {
      return res.status(403).json({
        status: "error",
        message: "Bạn không có quyền hủy đơn hàng này",
      });
    }

    // Kiểm tra trạng thái đơn hàng
    if (order.status !== "pending") {
      return res.status(400).json({
        status: "error",
        message:
          "Chỉ có thể hủy đơn hàng khi đơn hàng đang ở trạng thái chờ xác nhận",
      });
    }

    // Cập nhật trạng thái đơn hàng thành cancelled
    await OrderModel.updateOrderStatus(orderId, "cancelled");

    res.status(200).json({
      status: "success",
      message: "Đơn hàng đã được hủy thành công",
    });
  } catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).json({
      status: "error",
      message: "Lỗi khi hủy đơn hàng",
    });
  }
};

// ===== CONTROLLER CHO ADMIN =====

// 1. Xem tất cả đơn hàng (có filter, phân trang)
exports.getAllOrders = async (req, res) => {
  try {
    const { page, limit } = getPaginationParams(req);
    const { status, startDate, endDate } = req.query;

    const result = await OrderModel.getAllOrders(page, limit, {
      status,
      startDate,
      endDate,
    });

    res.status(200).json({
      status: "success",
      data: result.orders,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error getting all orders:", error);
    res.status(500).json({
      status: "error",
      message: "Lỗi khi lấy danh sách đơn hàng",
    });
  }
};

// 2. Admin xem chi tiết bất kỳ đơn hàng nào
exports.getOrderByIdAdmin = async (req, res) => {
  try {
    const orderId = req.params.id;

    const order = await OrderModel.getOrderById(orderId);

    if (!order) {
      return res.status(404).json({
        status: "error",
        message: "Không tìm thấy đơn hàng",
      });
    }

    // Chuyển đổi dữ liệu thành mảng để phù hợp với yêu cầu
    res.status(200).json({
      status: "success",
      data: [order], // Bọc đơn hàng trong một mảng
    });
  } catch (error) {
    console.error("Error getting order:", error);
    res.status(500).json({
      status: "error",
      message: "Lỗi khi lấy thông tin đơn hàng",
    });
  }
};

// 3. Admin cập nhật trạng thái đơn hàng (có thể cập nhật sang bất kỳ trạng thái nào)
exports.updateOrderStatusAdmin = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;

    // Validate status
    const validStatuses = [
      "pending",
      "confirmed",
      "processing",
      "completed",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        status: "error",
        message: `Trạng thái không hợp lệ. Các trạng thái hợp lệ: ${validStatuses.join(
          ", "
        )}`,
      });
    }

    // Kiểm tra đơn hàng tồn tại
    const order = await OrderModel.getOrderById(orderId);

    if (!order) {
      return res.status(404).json({
        status: "error",
        message: "Không tìm thấy đơn hàng",
      });
    }

    // Logic cập nhật trạng thái theo quy trình hợp lý
    if (order.status === "cancelled" || order.status === "completed") {
      return res.status(400).json({
        status: "error",
        message: `Không thể thay đổi trạng thái của đơn hàng đã ${
          order.status === "cancelled" ? "hủy" : "hoàn thành"
        }`,
      });
    }

    // Cập nhật trạng thái
    await OrderModel.updateOrderStatus(orderId, status);

    // Nếu hoàn thành hoặc hủy đơn có liên quan đến bàn, cập nhật trạng thái bàn
    if ((status === "completed" || status === "cancelled") && order.tableId) {
      await pool.query(
        "UPDATE tables SET status = 'available', updated_at = NOW() WHERE table_id = $1",
        [order.tableId]
      );
    }

    res.status(200).json({
      status: "success",
      message: "Cập nhật trạng thái đơn hàng thành công",
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({
      status: "error",
      message: "Lỗi khi cập nhật trạng thái đơn hàng",
    });
  }
};

// Add this new controller method for statistics
exports.getOrderStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Validate date parameters
    if (!startDate || !endDate) {
      return res.status(400).json({
        status: "error",
        message: "Vui lòng cung cấp ngày bắt đầu và ngày kết thúc",
      });
    }

    // Parse dates to ensure valid format
    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

    // Check if dates are valid
    if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
      return res.status(400).json({
        status: "error",
        message: "Định dạng ngày không hợp lệ. Sử dụng định dạng YYYY-MM-DD",
      });
    }

    // Get order statistics from the model
    const statistics = await OrderModel.getOrdersByDateRange(
      startDate,
      endDate
    );

    // Calculate total revenue and order count
    let totalRevenue = 0;
    let totalOrders = 0;

    statistics.forEach((stat) => {
      totalRevenue += parseFloat(stat.total_revenue || 0);
      totalOrders += parseInt(stat.count || 0);
    });

    res.status(200).json({
      status: "success",
      data: {
        byStatus: statistics,
        summary: {
          totalOrders: totalOrders,
          totalRevenue: totalRevenue,
          period: {
            start: startDate,
            end: endDate,
          },
        },
      },
    });
  } catch (error) {
    console.error("Error getting order statistics:", error);
    res.status(500).json({
      status: "error",
      message: "Lỗi khi lấy thống kê đơn hàng",
      error: error.message,
    });
  }
};
