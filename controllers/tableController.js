const TableModel = require("../models/table_model");
const OrderModel = require("../models/order_model");
const ReservationModel = require("../models/reservation_model");
const ApiResponse = require("../utils/apiResponse");

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
    const userId = req.user.userId;

    // Log the received time for debugging
    console.log("Received reservation time:", reservationTime);

    // Validate that reservationTime is a valid date
    if (
      !reservationTime ||
      !partySize ||
      isNaN(new Date(reservationTime).getTime())
    ) {
      return ApiResponse.error(
        res,
        400,
        "Vui lòng cung cấp thời gian đặt bàn hợp lệ và số khách"
      );
    }

    // Format the date properly for PostgreSQL
    const formattedReservationTime = new Date(reservationTime).toISOString();
    console.log("Formatted reservation time:", formattedReservationTime);

    // Tạo order nếu có orderedItems (các món được đặt trước)
    let orderId = null;
    if (orderedItems && orderedItems.length > 0) {
      // Validate orderedItems structure
      for (const item of orderedItems) {
        if (!item.dishId || !item.quantity || item.quantity <= 0) {
          return ApiResponse.error(res, 400, "Thông tin món ăn không hợp lệ");
        }
      }

      try {
        // Tạo order mới với status là 'reserved' để lưu các món đã đặt trước
        const newOrder = await OrderModel.createOrder({
          userId,
          tableId: null, // Bàn sẽ được cập nhật sau khi xác nhận đặt bàn
          status: "reserved", // Status đặc biệt cho đơn hàng kèm đặt bàn
          items: orderedItems,
        });

        // Make sure newOrder has an orderId property
        console.log("Created order:", newOrder);

        // Check if orderId exists in the response
        if (newOrder && newOrder.orderId) {
          orderId = newOrder.orderId;
        } else if (newOrder && newOrder.id) {
          // Fallback if the property is named 'id' instead
          orderId = newOrder.id;
        } else {
          console.error(
            "No order ID found in order creation response:",
            newOrder
          );
        }
      } catch (orderError) {
        console.error("Error creating order:", orderError);
        return ApiResponse.error(
          res,
          500,
          "Lỗi khi tạo đơn hàng: " + orderError.message
        );
      }
    }

    console.log("Using order ID for reservation:", orderId);

    // Lưu yêu cầu đặt bàn với thời gian đã được format
    try {
      const reservation = await ReservationModel.createReservation(
        userId,
        null, // tableId sẽ được cập nhật khi admin xác nhận đặt bàn
        formattedReservationTime, // Use the formatted time
        partySize,
        specialRequests || null,
        orderId // This might be null if no order was created
      );

      return ApiResponse.success(
        res,
        201,
        "Yêu cầu đặt bàn đã được gửi",
        reservation
      );
    } catch (reservationError) {
      console.error("Error creating reservation:", reservationError);

      // If we created an order but failed to create a reservation, we should
      // try to delete the orphaned order to keep the database clean
      if (orderId) {
        try {
          await OrderModel.deleteOrder(orderId);
          console.log(
            `Deleted orphaned order ${orderId} after reservation creation failed`
          );
        } catch (cleanupError) {
          console.error(
            `Failed to delete orphaned order ${orderId}:`,
            cleanupError
          );
        }
      }

      throw reservationError; // Re-throw to be caught by outer catch block
    }
  } catch (error) {
    console.error("Lỗi khi tạo yêu cầu đặt bàn:", error);
    console.error("Error details:", error.stack);
    return ApiResponse.error(
      res,
      500,
      "Đã xảy ra lỗi khi tạo yêu cầu đặt bàn: " + error.message
    );
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
