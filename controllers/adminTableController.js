const TableModel = require("../models/table_model");
const OrderModel = require("../models/order_model");
const ApiResponse = require("../utils/apiResponse");

// Controller quản lý bàn dành cho Admin
class AdminTableController {
  // Lấy danh sách khách hàng trong bàn
  async getTableCustomers(req, res) {
    try {
      const { id } = req.params;

      // Kiểm tra bàn tồn tại
      const existingTable = await TableModel.getTableById(id);
      if (!existingTable) {
        return ApiResponse.error(res, 404, "Không tìm thấy bàn");
      }

      // Lấy tất cả các order đang hoạt động tại bàn này
      const activeOrders = await TableModel.getActiveOrdersByTableId(id);

      if (activeOrders.length === 0) {
        return ApiResponse.success(res, 200, "Bàn này hiện không có khách", {
          tableId: id,
          tableNumber: existingTable.tableNumber,
          customers: [],
          totalCustomers: 0,
        });
      }

      // Định dạng thông tin khách hàng từ các đơn hàng
      const customers = activeOrders.map((order) => ({
        orderId: order.orderId,
        userId: order.userId,
        customerName: order.userName,
        customerPhone: order.userPhone,
        orderTime: order.createdAt,
        orderStatus: order.status,
        totalAmount: order.totalAmount,
        paidStatus: order.paidStatus || "unpaid",
      }));

      return ApiResponse.success(
        res,
        200,
        "Lấy danh sách khách hàng thành công",
        {
          tableId: id,
          tableNumber: existingTable.tableNumber,
          customers: customers,
          totalCustomers: customers.length,
        }
      );
    } catch (error) {
      console.error("Lỗi khi lấy danh sách khách hàng trong bàn:", error);
      return ApiResponse.error(
        res,
        500,
        "Đã xảy ra lỗi khi lấy danh sách khách hàng"
      );
    }
  }

  // Lấy danh sách khách hàng và món ăn đã đặt tại bàn
  async getTableCustomersAndOrders(req, res) {
    try {
      const { id } = req.params;

      // Kiểm tra bàn tồn tại
      const existingTable = await TableModel.getTableById(id);
      if (!existingTable) {
        return ApiResponse.error(res, 404, "Không tìm thấy bàn");
      }

      // Lấy thông tin khách hàng và món ăn đã đặt
      const customersAndOrders = await TableModel.getTableCustomersAndOrders(
        id
      );

      if (customersAndOrders.length === 0) {
        return ApiResponse.success(res, 200, "Bàn này hiện không có khách", {
          tableId: id,
          tableNumber: existingTable.tableNumber,
          customers: [],
        });
      }

      return ApiResponse.success(
        res,
        200,
        "Lấy danh sách khách hàng và món ăn thành công",
        {
          tableId: id,
          tableNumber: existingTable.tableNumber,
          customers: customersAndOrders,
        }
      );
    } catch (error) {
      console.error(
        "Lỗi khi lấy danh sách khách hàng và món ăn tại bàn:",
        error
      );
      return ApiResponse.error(
        res,
        500,
        "Đã xảy ra lỗi khi lấy danh sách khách hàng và món ăn"
      );
    }
  }

  // Xác nhận thanh toán cho khách hàng
  async confirmPayment(req, res) {
    try {
      const { tableId, orderId } = req.params;
      const { paymentMethod, paymentAmount } = req.body;

      // Validate đầu vào
      if (!paymentMethod || !paymentAmount) {
        return ApiResponse.error(
          res,
          400,
          "Vui lòng cung cấp phương thức và số tiền thanh toán"
        );
      }

      // Kiểm tra bàn tồn tại
      const existingTable = await TableModel.getTableById(tableId);
      if (!existingTable) {
        return ApiResponse.error(res, 404, "Không tìm thấy bàn");
      }

      // Kiểm tra đơn hàng tồn tại và thuộc bàn này
      const order = await OrderModel.getOrderById(orderId);
      if (!order) {
        return ApiResponse.error(res, 404, "Không tìm thấy đơn hàng");
      }

      // Kiểm tra đơn hàng có thuộc bàn này không
      if (order.tableId != tableId) {
        return ApiResponse.error(
          res,
          400,
          "Đơn hàng này không thuộc bàn đã chọn"
        );
      }

      // Kiểm tra trạng thái đơn hàng
      if (order.status === "completed" || order.status === "cancelled") {
        return ApiResponse.error(
          res,
          400,
          "Đơn hàng này đã được hoàn thành hoặc đã hủy"
        );
      }

      // Cập nhật trạng thái thanh toán cho đơn hàng
      const updatedOrder = await OrderModel.updateOrderPayment(orderId, {
        paidStatus: "paid",
        paidAmount: paymentAmount,
        paymentMethod: paymentMethod,
        paidAt: new Date(),
      });

      // Xử lý hoàn thành đơn hàng nếu đã thanh toán đủ
      if (paymentAmount >= order.totalAmount) {
        await OrderModel.updateOrderStatus(orderId, "completed");
        updatedOrder.status = "completed";
      }

      return ApiResponse.success(
        res,
        200,
        "Xác nhận thanh toán thành công",
        updatedOrder
      );
    } catch (error) {
      console.error("Lỗi khi xác nhận thanh toán:", error);
      return ApiResponse.error(
        res,
        500,
        "Đã xảy ra lỗi khi xác nhận thanh toán"
      );
    }
  }

  // Xóa khách hàng khỏi bàn (hoàn thành hoặc hủy đơn hàng)
  async removeCustomerFromTable(req, res) {
    try {
      const { tableId, orderId } = req.params;
      const { action } = req.body; // action: 'complete' hoặc 'cancel'

      // Validate đầu vào
      if (!action || !["complete", "cancel"].includes(action)) {
        return ApiResponse.error(
          res,
          400,
          "Vui lòng chỉ định hành động: 'complete' hoặc 'cancel'"
        );
      }

      // Kiểm tra bàn tồn tại
      const existingTable = await TableModel.getTableById(tableId);
      if (!existingTable) {
        return ApiResponse.error(res, 404, "Không tìm thấy bàn");
      }

      // Kiểm tra đơn hàng tồn tại
      const order = await OrderModel.getOrderById(orderId);
      if (!order) {
        return ApiResponse.error(res, 404, "Không tìm thấy đơn hàng");
      }

      // Kiểm tra đơn hàng có thuộc bàn này không
      if (order.tableId != tableId) {
        return ApiResponse.error(
          res,
          400,
          "Đơn hàng này không thuộc bàn đã chọn"
        );
      }

      // Kiểm tra trạng thái đơn hàng
      if (order.status === "completed" || order.status === "cancelled") {
        return ApiResponse.error(
          res,
          400,
          "Đơn hàng này đã được hoàn thành hoặc đã hủy"
        );
      }

      // Xử lý theo hành động
      let updatedOrder;
      if (action === "complete") {
        // Nếu đơn hàng chưa được thanh toán, yêu cầu thanh toán trước
        if (order.paidStatus !== "paid") {
          return ApiResponse.error(
            res,
            400,
            "Vui lòng thanh toán đơn hàng trước khi hoàn thành"
          );
        }

        updatedOrder = await OrderModel.updateOrderStatus(orderId, "completed");

        // Kiểm tra xem còn đơn hàng nào khác đang hoạt động ở bàn này không
        const remainingOrders = await TableModel.getActiveOrdersByTableId(
          tableId
        );

        // Nếu không còn đơn hàng nào, đổi trạng thái bàn thành available
        if (remainingOrders.length === 0) {
          await TableModel.updateTableStatus(tableId, "available");
        }
      } else {
        // action === 'cancel'
        // Kiểm tra xem đơn hàng đã thanh toán chưa
        if (order.paidStatus === "paid") {
          return ApiResponse.error(
            res,
            400,
            "Không thể hủy đơn hàng đã thanh toán"
          );
        }

        updatedOrder = await OrderModel.updateOrderStatus(orderId, "cancelled");

        // Kiểm tra xem còn đơn hàng nào khác đang hoạt động ở bàn này không
        const remainingOrders = await TableModel.getActiveOrdersByTableId(
          tableId
        );

        // Nếu không còn đơn hàng nào, đổi trạng thái bàn thành available
        if (remainingOrders.length === 0) {
          await TableModel.updateTableStatus(tableId, "available");
        }
      }

      return ApiResponse.success(
        res,
        200,
        `Đã ${
          action === "complete" ? "hoàn thành" : "hủy"
        } đơn hàng và cập nhật trạng thái bàn`,
        {
          order: updatedOrder,
          tableStatus: (await TableModel.getTableById(tableId)).statusCode,
        }
      );
    } catch (error) {
      console.error("Lỗi khi xóa khách khỏi bàn:", error);
      return ApiResponse.error(res, 500, "Đã xảy ra lỗi khi xử lý yêu cầu");
    }
  }

  
  // Lấy danh sách yêu cầu đặt bàn theo trạng thái
  async getReservationsByStatus(req, res) {
    try {
      const { status } = req.query;

      // Default status is 'pending' if not specified
      const statusFilter = status || "pending";

      // Validate status parameter
      const validStatuses = ["pending", "confirmed", "canceled"];
      if (!validStatuses.includes(statusFilter)) {
        return ApiResponse.error(
          res,
          400,
          "Trạng thái không hợp lệ. Các giá trị hợp lệ: pending, confirmed, canceled"
        );
      }

      // Get reservations with status filter
      const reservations = await TableModel.getReservationsByStatus(
        statusFilter
      );

      // Create appropriate message based on status
      let message;
      switch (statusFilter) {
        case "pending":
          message = "Lấy danh sách yêu cầu đặt bàn đang chờ thành công";
          break;
        case "confirmed":
          message = "Lấy danh sách đặt bàn đã xác nhận thành công";
          break;
        case "canceled":
          message = "Lấy danh sách đặt bàn đã hủy thành công";
          break;
        default:
          message = "Lấy danh sách tất cả yêu cầu đặt bàn thành công";
      }

      return ApiResponse.success(res, 200, message, reservations);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách yêu cầu đặt bàn:", error);
      return ApiResponse.error(
        res,
        500,
        "Đã xảy ra lỗi khi lấy danh sách yêu cầu đặt bàn"
      );
    }
  }
  // Admin xác nhận hoặc hủy yêu cầu đặt bàn
  async updateReservationStatus(req, res) {
    try {
      const { reservationId } = req.params;
      const { status, tableId } = req.body;

      if (!reservationId) {
        return ApiResponse.error(
          res,
          400,
          "Vui lòng cung cấp ID của yêu cầu đặt bàn"
        );
      }

      if (!status || !["confirmed", "canceled"].includes(status)) {
        return ApiResponse.error(
          res,
          400,
          "Vui lòng cung cấp trạng thái hợp lệ: confirmed hoặc canceled"
        );
      }

      // Nếu xác nhận đặt bàn, cần có tableId
      if (status === "confirmed" && !tableId) {
        return ApiResponse.error(
          res,
          400,
          "Vui lòng cung cấp ID bàn để xác nhận đặt bàn"
        );
      }

      let result;

      if (status === "confirmed") {
        // Gọi phương thức xác nhận đặt bàn
        result = await TableModel.confirmReservation(reservationId, tableId);

        return ApiResponse.success(
          res,
          200,
          "Xác nhận đặt bàn thành công",
          result
        );
      } else {
        // Gọi phương thức hủy yêu cầu đặt bàn
        result = await TableModel.cancelReservationRequest(reservationId);

        return ApiResponse.success(
          res,
          200,
          "Hủy yêu cầu đặt bàn thành công",
          result
        );
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái đặt bàn:", error);
      return ApiResponse.error(
        res,
        500,
        "Đã xảy ra lỗi khi cập nhật trạng thái đặt bàn",
        { error: error.message }
      );
    }
  }
  async cancelReservationRequest(req, res) {
    try {
      const { reservationId } = req.params;

      // Hủy yêu cầu đặt bàn
      const cancelledReservation = await TableModel.cancelReservationRequest(
        reservationId
      );

      return ApiResponse.success(
        res,
        200,
        "Yêu cầu đặt bàn đã được hủy thành công",
        cancelledReservation
      );
    } catch (error) {
      console.error("Lỗi khi hủy yêu cầu đặt bàn:", error);
      return ApiResponse.error(
        res,
        500,
        "Đã xảy ra lỗi khi hủy yêu cầu đặt bàn"
      );
    }
  }
}

module.exports = new AdminTableController();
