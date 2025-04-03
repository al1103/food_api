const TableModel = require("../models/table_model");
const OrderModel = require("../models/order_model");
const ReservationModel = require("../models/reservation_model");

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
exports.createReservationRequest = async (req, res) => {
  try {
    const { reservationTime, partySize, specialRequests, orderedItems } =
      req.body;
    const userId = req.user.id;

    // Kiểm tra đầu vào
    if (!reservationTime || !partySize || !customerName || !phoneNumber) {
      return ApiResponse.error(
        res,
        400,
        "Vui lòng cung cấp đầy đủ thông tin: thời gian, số khách, tên và số điện thoại"
      );
    }

    // Tạo order nếu có orderedItems (các món được đặt trước)
    let orderId = null;
    if (orderedItems && orderedItems.length > 0) {
      // Tạo order mới với status là 'pending' để lưu các món đã đặt trước
      const newOrder = await OrderModel.createOrder({
        userId,
        tableId: null, // Bàn sẽ được cập nhật sau khi xác nhận đặt bàn
        status: "reserved", // Status đặc biệt cho đơn hàng kèm đặt bàn
        items: orderedItems,
      });

      orderId = newOrder.orderId;
    }

    // Lưu yêu cầu đặt bàn
    const reservation = await ReservationModel.createReservation(
      userId,
      null, // tableId sẽ được cập nhật khi admin xác nhận đặt bàn
      reservationTime,
      partySize,
      specialRequests || null,
      orderId
    );

    return ApiResponse.success(
      res,
      201,
      "Yêu cầu đặt bàn đã được gửi",
      reservation
    );
  } catch (error) {
    console.error("Lỗi khi tạo yêu cầu đặt bàn:", error);
    return ApiResponse.error(res, 500, "Đã xảy ra lỗi khi tạo yêu cầu đặt bàn");
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
