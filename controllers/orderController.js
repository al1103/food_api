const OrderModel = require("../models/order_model");
const { pool } = require("../config/database");
const { getPaginationParams } = require("../utils/pagination");
const CartModel = require("../models/cart_model");
const NotificationController = require("../controllers/notificationController");

// ===== CONTROLLER CHO USER THÔNG THƯỜNG =====

exports.createOrder = async (req, res) => {
  try {
    const { tableId, data: items, customerName, phoneNumber, note } = req.body;
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

    // Create notification for the new order
    await NotificationController.integrateWithOrderCreate(newOrder, userId);

    // Add orderId to each item in the response
    const itemsWithOrderId = items.map(item => ({
      ...item,
      orderId: newOrder.orderId
    }));

    res.status(201).json({
      statusCode: 200,
      data: itemsWithOrderId,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({
      statusCode: 500,
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
      statusCode: 200,
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
      statusCode: 200,

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
      statusCode: 200,

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
      statusCode: 200,

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

// 3. Admin cập nhật trạng thái đơn hàng
exports.updateOrderStatusAdmin = async (req, res) => {
  try {
    // Dòng log để debug
    console.log(
      `Received request to update status for order ID: ${req.params.id}`
    );
    console.log(`Body: ${JSON.stringify(req.body)}`);

    const orderId = req.params.id;
    const { status } = req.body;

    // Kiểm tra nếu status không được gửi lên
    if (!status) {
      return res.status(400).json({
        status: "error",
        message: "Trạng thái đơn hàng không được cung cấp",
      });
    }

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

    // Store the old status for notification
    const oldStatus = order.status;
    console.log(`Updating order from ${oldStatus} to ${status}`);

    // Cập nhật trạng thái
    const updateResult = await OrderModel.updateOrderStatus(orderId, status);
    console.log("Update result:", updateResult);

    // Nếu hoàn thành hoặc hủy đơn có liên quan đến bàn, cập nhật trạng thái bàn
    if ((status === "completed" || status === "cancelled") && order.tableId) {
      await pool.query(
        "UPDATE tables SET status = 'available', updated_at = NOW() WHERE table_id = $1",
        [order.tableId]
      );
      console.log(`Updated table ${order.tableId} status to available`);
    }

    // Create notification for status change
    try {
      await NotificationController.integrateWithOrderUpdate(
        orderId,
        order.userId,
        oldStatus,
        status
      );
      console.log("Notification created for status update");
    } catch (notifError) {
      console.error("Error creating notification:", notifError);
      // Continue execution even if notification fails
    }

    res.status(200).json({
      statusCode: 200,

      message: "Cập nhật trạng thái đơn hàng thành công",
      data: updateResult,
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({
      status: "error",
      message: "Lỗi khi cập nhật trạng thái đơn hàng: " + error.message,
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
      statusCode: 200,

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
