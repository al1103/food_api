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

  // Đặt bàn trước
  async reserveTable(req, res) {
    try {
      const { tableId } = req.params;
      const { reservationTime } = req.body;

      // Kiểm tra đầu vào
      if (!reservationTime) {
        return ApiResponse.error(
          res,
          400,
          "Vui lòng cung cấp thời gian đặt bàn"
        );
      }

      // Đặt bàn trước
      const reservedTable = await TableModel.reserveTable(
        tableId,
        reservationTime
      );

      return ApiResponse.success(
        res,
        200,
        "Đặt bàn trước thành công",
        reservedTable
      );
    } catch (error) {
      console.error("Lỗi khi đặt bàn trước:", error);
      return ApiResponse.error(res, 500, "Đã xảy ra lỗi khi đặt bàn trước");
    }
  }

  // Đặt bàn trước với số lượng người, ngày giờ và ghi chú
  async reserveTableWithDetails(req, res) {
    try {
      const { numberOfGuests, reservationTime, note } = req.body;

      // Kiểm tra đầu vào
      if (!numberOfGuests || !reservationTime) {
        return ApiResponse.error(
          res,
          400,
          "Vui lòng cung cấp số lượng người và thời gian đặt bàn"
        );
      }

      // Đặt bàn trước
      const reservedTable = await TableModel.reserveTableWithDetails(
        numberOfGuests,
        reservationTime,
        note || null
      );

      return ApiResponse.success(
        res,
        200,
        "Đặt bàn trước thành công",
        reservedTable
      );
    } catch (error) {
      console.error("Lỗi khi đặt bàn trước:", error);
      return ApiResponse.error(res, 500, "Đã xảy ra lỗi khi đặt bàn trước");
    }
  }

  // Hủy đặt bàn

  // Client gửi yêu cầu đặt bàn
  async createReservationRequest(req, res) {
    try {
      const {
        tableId,
        reservationTime,
        partySize,
        customerName,
        phoneNumber,
        specialRequests,
      } = req.body;

      // Lấy userId từ token (giả sử middleware đã giải mã token và lưu userId vào req.user)
      const userId = req.user.id;

      // Kiểm tra đầu vào
      if (!reservationTime || !partySize || !customerName || !phoneNumber) {
        return ApiResponse.error(
          res,
          400,
          "Vui lòng cung cấp đầy đủ thông tin yêu cầu đặt bàn"
        );
      }

      // Lưu yêu cầu đặt bàn
      const reservation = await TableModel.createReservationRequest(
        userId,
        tableId || null,
        reservationTime,
        partySize,
        customerName,
        phoneNumber,
        specialRequests || null
      );

      return ApiResponse.success(
        res,
        201,
        "Yêu cầu đặt bàn đã được gửi",
        reservation
      );
    } catch (error) {
      console.error("Lỗi khi tạo yêu cầu đặt bàn:", error);
      return ApiResponse.error(
        res,
        500,
        "Đã xảy ra lỗi khi tạo yêu cầu đặt bàn"
      );
    }
  }

  // Admin xác nhận yêu cầu đặt bàn
  async confirmReservation(req, res) {
    try {
      const { reservationId, tableId } = req.body;

      // Kiểm tra đầu vào
      if (!reservationId || !tableId) {
        return ApiResponse.error(
          res,
          400,
          "Vui lòng cung cấp ID yêu cầu đặt bàn và ID bàn"
        );
      }

      // Xác nhận yêu cầu đặt bàn
      const confirmedReservation = await TableModel.confirmReservation(
        reservationId,
        tableId
      );

      return ApiResponse.success(
        res,
        200,
        "Yêu cầu đặt bàn đã được xác nhận",
        confirmedReservation
      );
    } catch (error) {
      console.error("Lỗi khi xác nhận yêu cầu đặt bàn:", error);
      return ApiResponse.error(
        res,
        500,
        "Đã xảy ra lỗi khi xác nhận yêu cầu đặt bàn"
      );
    }
  }

  // Lấy danh sách yêu cầu đặt bàn
  async getPendingReservations(req, res) {
    try {
      const reservations = await TableModel.getPendingReservations();

      return ApiResponse.success(
        res,
        200,
        "Lấy danh sách yêu cầu đặt bàn thành công",
        reservations
      );
    } catch (error) {
      console.error("Lỗi khi lấy danh sách yêu cầu đặt bàn:", error);
      return ApiResponse.error(
        res,
        500,
        "Đã xảy ra lỗi khi lấy danh sách yêu cầu đặt bàn"
      );
    }
  }

  // Hủy yêu cầu đặt bàn
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
