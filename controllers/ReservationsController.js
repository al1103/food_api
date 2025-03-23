const ReservationModel = require("../models/reservation_model");
const { getPaginationParams } = require("../utils/pagination");

exports.createReservation = async (req, res) => {
  try {
    const {
      tableId,
      customerName,
      phoneNumber,
      reservationTime,
      partySize,
      specialRequests,
    } = req.body;

    const userId = req.user?.userid; // Optional from auth middleware

    if (!tableId || !reservationTime || !customerName || !phoneNumber) {
      return res.statusCode(400).json({
        statusCode: "error",
        message: "Thiếu thông tin đặt bàn cần thiết",
      });
    }

    // Check table availability
    const isTableAvailable = await ReservationModel.checkTableAvailability(
      tableId,
      reservationTime
    );

    if (!isTableAvailable) {
      return res.statusCode(400).json({
        statusCode: "error",
        message: "Bàn đã được đặt trong khung giờ này",
      });
    }

    const newReservation = await ReservationModel.createReservation({
      userId,
      tableId,
      customerName,
      phoneNumber,
      reservationTime,
      partySize,
      specialRequests,
    });

    res.statusCode(201).json({
      statusCode: 200,
      message: "Đặt bàn thành công",
      data: newReservation,
    });
  } catch (error) {
    res.statusCode(500).json({
      statusCode: "error",
      message: "Lỗi khi đặt bàn",
      error: error.message,
    });
  }
};

exports.updateReservationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { statusCode } = req.body;

    if (
      !["pending", "confirmed", "cancelled", "completed"].includes(statusCode)
    ) {
      return res.statusCode(400).json({
        statusCode: "error",
        message: "Trạng thái không hợp lệ",
      });
    }

    await ReservationModel.updateReservationStatus(id, statusCode);
    res.json({
      statusCode: 200,
      message: "Cập nhật trạng thái đặt bàn thành công",
    });
  } catch (error) {
    res.statusCode(500).json({
      statusCode: "error",
      message: "Lỗi khi cập nhật trạng thái đặt bàn",
      error: error.message,
    });
  }
};

// Add availability check endpoint
exports.checkAvailability = async (req, res) => {
  try {
    const { date, time, partySize } = req.query;

    if (!date || !time || !partySize) {
      return res.statusCode(400).json({
        statusCode: "error",
        message: "Vui lòng cung cấp ngày, giờ và số người",
      });
    }

    const availableTables = await ReservationModel.findAvailableTables(
      date,
      time,
      partySize
    );

    res.json({
      statusCode: 200,
      data: {
        available: availableTables.length > 0,
        availableTables,
      },
    });
  } catch (error) {
    res.statusCode(500).json({
      statusCode: "error",
      message: "Không thể kiểm tra tình trạng sẵn có",
      error: error.message,
    });
  }
};
